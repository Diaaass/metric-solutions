import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
// Порог, после которого лениво выметаем из карты IP с истёкшими метками:
// иначе на долгоживущем сервере (npm start) карта росла бы бесконечно.
const RATE_LIMIT_SWEEP_SIZE = 500;
const ipHits = new Map<string, number[]>();

/**
 * Минимальное время «человеческого» заполнения формы. Заполнение быстрее —
 * мягкий сигнал спама: письмо всё равно уходит, но с пометкой в теме.
 * Жёсткие сигналы (honeypot, отсутствие метки renderedAt) режутся молча —
 * реальный пользователь их не задевает, т.к. метку ставит наш же клиент.
 */
const MIN_FILL_MS = 3000;

/** Максимальный размер тела запроса: легитимная заявка сильно меньше. */
const MAX_BODY_BYTES = 32_768;

const MAX_MESSAGE_LENGTH = 5000;

function pruneHits(hits: number[], now: number): number[] {
  return hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
}

/** Проверка лимита без учёта запроса: считаем только принятые заявки (recordHit). */
function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Ленивая уборка: не даём карте расти на долгоживущем процессе.
  // (forEach вместо for...of: target TS ниже es2015 не итерирует Map;
  // удаление во время forEach по спецификации Map безопасно.)
  if (ipHits.size > RATE_LIMIT_SWEEP_SIZE) {
    ipHits.forEach((hits, key) => {
      const alive = pruneHits(hits, now);
      if (alive.length === 0) ipHits.delete(key);
      else ipHits.set(key, alive);
    });
  }

  const alive = pruneHits(ipHits.get(ip) ?? [], now);
  if (alive.length === 0) {
    ipHits.delete(ip);
    return false;
  }
  ipHits.set(ip, alive);
  return alive.length >= RATE_LIMIT_MAX;
}

/** Записываем попытку только для прошедших валидацию заявок: опечатки не блокируют. */
function recordHit(ip: string): void {
  const now = Date.now();
  const hits = pruneHits(ipHits.get(ip) ?? [], now);
  hits.push(now);
  ipHits.set(ip, hits);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_RE = /^[78]\d{10}$/;

type Payload = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

/**
 * Машинный код ошибки. Текст для пользователя маршрут не выбирает: он не знает
 * языка страницы, а зашитые здесь русские строки показывались бы и на /en.
 * Локализация — в словарях (form.errors), сопоставление по коду — на клиенте.
 */
type ErrorCode =
  | 'request'
  | 'required'
  | 'email'
  | 'phone'
  | 'long'
  | 'consent'
  | 'rate'
  | 'send'
  | 'spam';

type ValidationResult =
  | { ok: true; data: Payload; suspicious: boolean }
  | { ok: false; code: ErrorCode };

function validate(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') return { ok: false, code: 'request' };
  const b = body as Record<string, unknown>;

  // Однострочные поля: режем control-символы (в т.ч. переводы строк) — защита
  // от инъекции заголовков письма и мусора в теме.
  const line = (v: unknown, max: number) =>
    typeof v === 'string' && v.length <= max
      ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
      : null;

  // Сообщение: переводы строк легитимны (pre-wrap в письме), остальное режем.
  const rawMessage = typeof b.message === 'string' ? b.message : null;
  const message =
    rawMessage === null
      ? null
      : rawMessage
          .replace(/\r\n?/g, '\n')
          .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
          .trim();

  const name = line(b.name, 100);
  const email = line(b.email, 200);
  const phone = line(b.phone ?? '', 50) ?? '';
  const company = line(b.company ?? '', 200) ?? '';
  const website = typeof b.website === 'string' ? b.website : '';

  if (!name || !email || !phone || message === null || message === '') {
    // Слишком длинное сообщение — отдельный код: «заполните обязательные поля»
    // на заполненную форму сбивает с толку.
    if (typeof b.message === 'string' && b.message.length > MAX_MESSAGE_LENGTH)
      return { ok: false, code: 'long' };
    return { ok: false, code: 'required' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, code: 'long' };
  if (!EMAIL_RE.test(email)) return { ok: false, code: 'email' };
  if (!PHONE_DIGITS_RE.test(phone.replace(/\D/g, ''))) return { ok: false, code: 'phone' };

  // Согласие на обработку ПДн обязательно (Закон РК № 94-V): чекбокс на
  // клиенте — required, но клиенту не доверяем и проверяем здесь тоже.
  if (b.consent !== true) return { ok: false, code: 'consent' };

  // Жёсткий сигнал: honeypot заполняют только боты (поле скрыто от людей).
  if (website) return { ok: false, code: 'spam' };

  // Жёсткий сигнал: метку ставит наш же клиент при монтировании формы, поэтому
  // её отсутствие или мусор в ней означают POST мимо формы — то есть бота.
  const renderedAt = Number(b.renderedAt);
  if (!Number.isFinite(renderedAt) || renderedAt <= 0) return { ok: false, code: 'spam' };

  // Мягкий сигнал: форма заполнена подозрительно быстро. Реальный человек с
  // автозаполнением браузера способен уложиться в 3 секунды, поэтому заявку
  // не теряем — отправляем с пометкой. Отрицательный elapsed (часы клиента
  // спешат) тоже не повод терять заявку.
  const elapsed = Date.now() - renderedAt;
  const suspicious = elapsed >= 0 && elapsed < MIN_FILL_MS;

  return { ok: true, data: { name, email, phone, company, message }, suspicious };
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ code: 'rate' }, { status: 429 });
  }

  // Отсекаем заведомо раздутые тела до парсинга JSON.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ code: 'request' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: 'request' }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    // spam отдаём как 200: бот не должен понимать, на чём его отсекли.
    return NextResponse.json({ code: result.code }, { status: result.code === 'spam' ? 200 : 400 });
  }
  const { name, email, phone, company, message } = result.data;

  // Лимит частоты считает только валидные заявки: три опечатки подряд
  // не блокируют пользователя на минуту.
  recordHit(ip);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone || '—');
  const safeCompany = escapeHtml(company || '—');
  const safeMessage = escapeHtml(message);

  // Мягкий спам-сигнал помечаем в теме и в теле: получатель видит контекст,
  // а фильтр почты может отсортировать по префиксу.
  const subjectPrefix = result.suspicious ? '[Возможен спам] ' : '';
  const suspicionNote = result.suspicious
    ? `<p style="margin: 16px 0 0; padding: 10px 12px; background: #fef3c7; border-left: 4px solid #d97706; border-radius: 4px; color: #92400e;">
        Форма заполнена быстрее 3 секунд — возможна автоматическая отправка.
      </p>`
    : '';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0369a1; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
        Новая заявка с сайта Metric Solution
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; color: #64748b; width: 140px;">Имя</td>
          <td style="padding: 10px 0; font-weight: 600;">${safeName}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px 0; color: #64748b;">Email</td>
          <td style="padding: 10px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b;">Телефон</td>
          <td style="padding: 10px 0;">${safePhone}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px 0; color: #64748b;">Компания</td>
          <td style="padding: 10px 0;">${safeCompany}</td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 16px; background: #f0f9ff; border-left: 4px solid #0369a1; border-radius: 4px;">
        <p style="color: #64748b; margin: 0 0 8px;">Сообщение</p>
        <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
      </div>
      ${suspicionNote}
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Metric Solution" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `${subjectPrefix}Заявка от ${name}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] sendMail failed', err);
    return NextResponse.json({ code: 'send' }, { status: 500 });
  }
}
