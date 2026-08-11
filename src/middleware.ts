import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Локальная маршрутизация без смены URL в адресной строке:
 * - /en и /en/... проходят напрямую (английская версия);
 * - всё остальное внутренне REWRITE-ится на /ru/... (русская версия остаётся на корне).
 *
 * Исключения (не обрабатываются): /api, /_next, файлы с расширением,
 * sitemap.xml, robots.txt, icon.png — за это отвечает и matcher ниже, и явные проверки.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Английская версия уже с префиксом — пропускаем как есть.
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return NextResponse.next();
  }

  // Всё остальное — русская версия на корне: переписываем на /ru/...
  const url = request.nextUrl.clone();
  url.pathname = `/ru${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Не запускаем middleware для API, внутренних ресурсов Next и любых файлов с точкой
  // (в т.ч. sitemap.xml, robots.txt, icon.png, картинки, шрифты).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
