import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const ipHits = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return true;
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
  website?: string;
};

function validate(body: unknown): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Некорректный запрос' };
  const b = body as Record<string, unknown>;

  const str = (v: unknown, max: number) =>
    typeof v === 'string' && v.length <= max ? v.trim() : null;

  const name = str(b.name, 100);
  const email = str(b.email, 200);
  const phone = str(b.phone ?? '', 50) ?? '';
  const company = str(b.company ?? '', 200) ?? '';
  const message = str(b.message, 5000);
  const website = typeof b.website === 'string' ? b.website : '';

  if (!name || !email || !phone || !message)
    return { ok: false, error: 'Заполните обязательные поля' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Некорректный email' };
  if (!PHONE_DIGITS_RE.test(phone.replace(/\D/g, '')))
    return { ok: false, error: 'Некорректный телефон' };
  if (website) return { ok: false, error: 'spam' };

  return { ok: true, data: { name, email, phone, company, message, website } };
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный JSON' }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'spam' ? 200 : 400 },
    );
  }
  const { name, email, phone, company, message } = result.data;

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
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Metric Solution" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Заявка от ${name}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact] sendMail failed', err);
    return NextResponse.json({ error: 'Ошибка отправки. Попробуйте позже.' }, { status: 500 });
  }
}
