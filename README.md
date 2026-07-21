# Metric Solutions — корпоративный сайт

Двуязычный (RU/KZ) сайт инженерно-консалтинговой компании в области геометаллургии,
обогащения полезных ископаемых и гидрометаллургии.

## Технологический стек

- **Next.js 14** (App Router, серверные компоненты)
- **React 18** + **TypeScript**
- **Tailwind CSS**
- **lucide-react** (иконки)
- **nodemailer** (отправка заявок через Gmail SMTP)

## Страницы

| Путь (RU / KZ)                 | Описание                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| `/` · `/kz`                    | Главная: hero, о компании, направления, показатели, металлы |
| `/about` · `/kz/about`         | О компании, ценности, миссия                                |
| `/services` · `/kz/services`   | 6 направлений деятельности                                  |
| `/solutions` · `/kz/solutions` | Мобильные решения NomadLab и Nomad Pilot Plant              |
| `/contacts` · `/kz/contacts`   | Контакты и форма заявки на консультацию                     |

## Мультиязычность (i18n)

Локаль определяется **URL и обрабатывается на сервере** (важно для SEO — казахская
версия попадает в индекс, есть корректные `lang`, `canonical` и `hreflang`).

- **Русский — корень сайта** (`/`, `/about`, …), **казахский — префикс `/kz`** (`/kz`, `/kz/about`, …).
- `src/middleware.ts` внутренне **переписывает** (rewrite, без смены URL в адресной строке)
  все не-`/kz` пути на `/ru/...`; `/kz/...` проходит напрямую. Исключения: `/api`, `/_next`,
  файлы с расширением (в т.ч. `sitemap.xml`, `robots.txt`, `icon.png`).
- Единая структура маршрутов: `src/app/[lang]/...`, `generateStaticParams` → `ru` и `kz`,
  `dynamicParams = false` (прочие языки → 404). Корневой layout — `src/app/[lang]/layout.tsx`
  (`<html lang>`: `ru` → `ru`, `kz` → `kk`).
- Словари: `src/i18n/ru.ts` и `src/i18n/kz.ts`, типизированы единым интерфейсом
  `Translation` (`src/i18n/types.ts`) — паритет проверяется `tsc`.
- Страницы — серверные компоненты: читают словарь (`translations[lang]`) и передают строки
  в компоненты через props. Клиентские островки: `Header` (мобильное меню, переключатель
  языка), `ConsultationForm` (состояние формы), `MetalPrices` (клиентский fetch).
- Метаданные (`title`, `description`, `keywords`, `alternates`) формируются per-page через
  `generateMetadata` и хелпер `src/i18n/seo.ts`. `src/app/sitemap.ts` отдаёт обе локали
  (10 URL) с `hreflang`-альтернативами.

## API-маршруты

- `POST /api/contact` — приём заявки формы: валидация, honeypot, rate-limit, отправка письма
  через **nodemailer + Gmail SMTP** (`GMAIL_USER`, `GMAIL_APP_PASSWORD`).
- `GET /api/metals` — спотовые цены металлов с **metals.dev** (кеш 12 ч). Без `METALS_API_KEY`
  секция «Цены на металлы» просто скрывается.

## Переменные окружения

См. `.env.example` (скопируйте в `.env.local`):

| Переменная             | Назначение                                                      |
| ---------------------- | --------------------------------------------------------------- |
| `GMAIL_USER`           | Gmail-адрес отправителя заявок                                  |
| `GMAIL_APP_PASSWORD`   | App Password Gmail (для SMTP)                                   |
| `NEXT_PUBLIC_SITE_URL` | Базовый URL сайта (canonical, hreflang, sitemap)                |
| `METALS_API_KEY`       | Ключ metals.dev (необязателен; без него секция металлов скрыта) |

## Скрипты

```bash
npm run dev           # разработка (http://localhost:3000)
npm run build         # продакшен-сборка
npm start             # запуск собранного приложения
npm run lint          # ESLint (next lint)
npm run format        # Prettier --write
npm run format:check  # Prettier --check (используется в CI)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) на push и pull request в `main`:
`npm ci` → `lint` → `tsc --noEmit` → `format:check` → `build`.
