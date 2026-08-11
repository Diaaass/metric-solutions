# Metric Solutions — корпоративный сайт

Двуязычный (RU/EN) сайт инженерно-консалтинговой компании в области геометаллургии,
обогащения полезных ископаемых и гидрометаллургии.

## Стек

- **Next.js 14** — App Router, серверные компоненты по умолчанию
- **React 18** + **TypeScript** (strict)
- **Tailwind CSS**
- **lucide-react** — иконки
- **nodemailer** — отправка заявок через Gmail SMTP

## Страницы

| Путь (RU / EN)                             | Что на странице                                                     |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `/` · `/en`                                | Герой с видео-анимацией лого, о компании, направления, CTA, галерея |
| `/about` · `/en/about`                     | О компании, ценности, миссия                                        |
| `/services` · `/en/services`               | Три направления деятельности карточками                             |
| `/services/[slug]` · `/en/services/[slug]` | Детальная страница направления и связанные решения                  |
| `/solutions` · `/en/solutions`             | NomadLab, Nomad Pilot Plant и технологический аудит                 |
| `/contacts` · `/en/contacts`               | Контакты и форма заявки на консультацию                             |

Слаги направлений: `geometallurgy`, `beneficiation`, `hydrometallurgy`
(`SERVICE_SLUGS` в `src/i18n/seo.ts`, `dynamicParams = false` — прочие слаги отдают 404).
Сборка — 23 статические страницы.

## Мультиязычность

Локаль определяется URL и обрабатывается на сервере — английская версия попадает в индекс,
`lang`, `canonical` и `hreflang` проставляются корректно.

- **Русский — в корне** (`/`, `/about`, …), **английский — с префиксом `/en`**.
- `src/middleware.ts` внутренне переписывает (rewrite, без смены URL в адресной строке)
  не-`/en` пути на `/ru/...`; `/en/...` проходит напрямую. Исключения: `/api`, `/_next`
  и файлы с расширением (`sitemap.xml`, `robots.txt`, `icon.png`).
- Единая структура маршрутов `src/app/[lang]/...`, `generateStaticParams` → `ru` и `en`.
  Корневой layout — `src/app/[lang]/layout.tsx` (`<html lang>`: `ru` / `en`).
- Словари `src/i18n/ru.ts` и `src/i18n/en.ts` типизированы общим интерфейсом `Translation`
  (`src/i18n/types.ts`) — паритет языков проверяет `tsc`. **Любой пользовательский текст
  добавляется сразу в оба словаря и в типы.**
- Метаданные формирует `generateMetadata` через хелпер `src/i18n/seo.ts`.
  `src/app/sitemap.ts` отдаёт обе локали (8 маршрутов × 2 языка = 16 URL) с `hreflang`.

## SEO

- `title`/`description`/`canonical`/`hreflang` на каждую страницу (`src/i18n/seo.ts`).
- **Open Graph + Twitter Card** с общей картинкой `public/og.jpg` (1200×630, лого на
  фирменном тёмно-синем); относительный путь разрешается через `metadataBase`.
- **JSON-LD Organization** (адрес, телефон, email) вставляется в layout —
  `buildOrgJsonLd` в `src/i18n/seo.ts`.
- `sitemap.xml` и `robots.txt` генерируются (`src/app/sitemap.ts`, `src/app/robots.ts`),
  `/api` закрыт от индексации.
- `keywords` добавляются только в RU-версию (на них смотрит разве что Яндекс).

## Герой: видео-анимация логотипа

`src/components/sections/HeroVisual.tsx` + `public/logo-reveal.webm` / `.mov` (720×772, 2 с).

- Ролик проигрывается один раз и замирает на финальном кадре. Фон — **настоящий
  альфа-канал** (прозрачность закодирована в файле): `mix-blend-mode` на видео
  Chromium композитит ненадёжно, а прозрачное видео рендерится нативно везде.
- Два источника: `logo-reveal.webm` (VP9 + альфа, ~70 КБ — Chrome/Firefox/Edge) и
  `logo-reveal.mov` (HEVC + альфа, ~115 КБ — Safari; остальные quicktime не играют
  и переходят ко второму source). `ffprobe` покажет `yuv420p` — альфа VP9 лежит
  side-channel'ом (`TAG:alpha_mode=1`), декодер ffmpeg её игнорирует, браузеры читают.
- Клиентский гейт через `matchMedia`: видео монтируется только от `xl` (1280px) —
  мобильные браузеры его даже не скачивают.
- `prefers-reduced-motion: reduce` — статичный SVG-логотип вместо видео.
- Пережать исходник (1920×1080, лого на чёрном):

  ```bash
  ffmpeg -i <src> -vf "crop=840:900:548:90,scale=720:-2,colorkey=0x000000:0.09:0.12" \
    -c:v libvpx-vp9 -pix_fmt yuva420p -crf 32 -b:v 0 -auto-alt-ref 0 -an public/logo-reveal.webm
  ffmpeg -i <src> -vf "crop=840:900:548:90,scale=720:-2,colorkey=0x000000:0.09:0.12,format=bgra" \
    -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.7 -q:v 60 -tag:v hvc1 -an public/logo-reveal.mov
  ```

## Тикер котировок

`src/components/layout/TickerBar.tsx` + `src/lib/metals.ts`.

- Серверный компонент: данные приходят из layout, поэтому цены есть уже в первом HTML-кадре —
  без клиентского запроса и сдвига вёрстки.
- Один запрос к [metals.dev](https://metals.dev) с `unit=toz`, кеш Next на 24 часа
  (≈30 обращений в месяц + сборки — с запасом в бесплатном лимите 100/мес).
- **Ответ считается успешным только при `body.status === 'success'`**: metals.dev отдаёт
  ошибки (исчерпанная квота, неверный ключ) телом с HTTP 200.
- **Полоса не пропадает никогда**: при недоступном API (квота, нет ключа, сбой сети)
  показываются фиксированные цены-заглушки (`FALLBACK_DATA`); данные помечены
  дисклеймером «справочный характер». Когда API оживает, живые цены возвращаются
  сами — кеш fetch сутки.
- **В dev по умолчанию те же цены-заглушки** — дев-сервер и сборки не тратят
  квоту. Живые данные локально: `METALS_LIVE=1` в `.env.local`.
- Драгметаллы (Au, Ag) показываются за тройскую унцию — `$/oz`. Промышленные (Cu, Zn, Al)
  пересчитываются арифметически в цену за метрическую тонну (× 32150,7466) и показываются
  как `$/т`: биржевой стандарт LME, цена меди «за унцию» смысла не имеет.

## Форма заявки

`src/components/forms/ConsultationForm.tsx` → `POST /api/contact`
(`src/app/api/contact/route.ts`).

- Валидация имени, email, телефона (`+7`/`8` и 11 цифр) и сообщения (до 5000 символов,
  код `long`) на сервере; control-символы вырезаются (защита от инъекции заголовков письма).
- Антиспам двухуровневый:
  - **жёсткие сигналы** — honeypot `website`, отсутствие/мусор в метке `renderedAt` —
    тихий дроп с ответом `200 {code:'spam'}` (бот не должен знать, на чём попался);
  - **мягкий сигнал** — заполнение быстрее 3 секунд — заявка **не теряется**: письмо
    уходит с пометкой `[Возможен спам]` в теме и плашкой в теле. Реальный человек
    с автозаполнением браузера способен уложиться в 3 секунды.
- Ограничение частоты: 3 **валидные** заявки в минуту с одного IP; опечатки счётчик
  не увеличивают. Карта IP чистится лениво (пустые ключи удаляются, при >500 IP — свип).
  В памяти процесса; на serverless защита вспомогательная.
- Тела больше 32 КБ отсекаются до парсинга (413).
- Письмо уходит через nodemailer + Gmail SMTP на адрес `GMAIL_USER`, `replyTo` — почта
  отправителя. Пользовательский ввод экранируется перед вставкой в HTML.

## Безопасность

- Security-заголовки в `next.config.js`: **CSP** (только в проде — dev-серверу нужны
  eval/ws), **HSTS** (год, без preload), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- `script-src 'self' 'unsafe-inline'` — вынужденно: страницы статические (SSG),
  per-request nonce для них невозможен.
- Известный остаток `npm audit`: вложенный `postcss` внутри `next@14` (сборочная
  зависимость, лечится только переходом на Next 16 — breaking).

## Прочее

- **Галерея** на главной — `src/components/sections/Gallery.tsx`.
- **Плавающая кнопка WhatsApp** в нижнем **правом** углу — `src/components/layout/WhatsAppWidget.tsx`.
- **Иконки направлений** — камни из брендбука (`public/icon-service-*.png`).
- Контакты и связи «направление → решение» вынесены в `src/data/`.

## Переменные окружения

Локально — скопируйте `.env.example` в `.env.local`. **На хостинге эти значения задаются
в переменных окружения проекта, а не файлом в репозитории.**

| Переменная             | Назначение                                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| `METALS_API_KEY`       | Ключ metals.dev. Необязателен: без него тикер котировок не выводится   |
| `METALS_LIVE`          | `1` — живые котировки в dev (по умолчанию в dev показываются мок-цены) |
| `GMAIL_USER`           | Gmail-адрес, с которого и на который уходят заявки                     |
| `GMAIL_APP_PASSWORD`   | App Password Gmail для SMTP (не обычный пароль от аккаунта)            |
| `NEXT_PUBLIC_SITE_URL` | Боевой базовый URL — canonical, hreflang, sitemap, OG                  |

## Скрипты

```bash
npm run dev           # разработка (http://localhost:3000)
npm run build         # продакшен-сборка
npm start             # запуск собранной сборки
npm run lint          # ESLint (next lint)
npm run format        # Prettier --write
npm run format:check  # Prettier --check (используется в CI)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) на push и pull request в `main`, Node 20:
`npm ci` → `lint` → `tsc --noEmit` → `format:check` → `build`.

## Чеклист деплоя

1. Задать все переменные окружения на хостинге (см. таблицу выше; `METALS_LIVE` не нужен).
2. `NEXT_PUBLIC_SITE_URL` — боевой домен: от него считаются canonical, hreflang, sitemap и OG.
3. Проверить, что `GMAIL_APP_PASSWORD` — именно App Password, иначе SMTP вернёт `EAUTH`.
4. Квота metals.dev: бесплатные 100 запросов/мес, сбрасывается 1-го числа. При исчерпании
   тикер просто исчезает (сайт не ломается).
5. `npm ci && npm run build`, затем `npm start`.
6. Смоук: `/` и `/en` открываются, тикер показывает цены, форма на `/contacts` отправляется,
   `/sitemap.xml` и `/robots.txt` отдают 200, security-заголовки на месте (`curl -I`).
