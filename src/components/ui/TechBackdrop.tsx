import React from 'react';

/**
 * Технический фон главной страницы «1:1» с макетом (кадр 1440×1061).
 *
 * Состоит из двух статичных слоёв (без анимации — reduced-motion безопасен by design):
 *  1) Подсвеченные ячейки сетки — плоские полупрозрачные квадраты 80×80, чуть светлее/синее фона,
 *     позиционируются по координатам кадра внутри центрированного контейнера 1440px,
 *     поэтому совпадают с контентом на вьюпортах ≥1440. Только на lg+ (на мобиле макет иной).
 *  2) Тонкие эллиптические дуги — 4 длинных светло-синих штриха, low-opacity, с мягким затуханием
 *     к краям кадра (radial-маска). SVG во всю ширину секции, масштабируется по её ширине.
 *
 * Базовая сетка (.bg-grid-dark, шаг 80px) и базовый фон (bg-ink-950) остаются на самих секциях.
 * Компонент презентационный, серверный, декоративный (aria-hidden, pointer-events-none).
 */

// Кадр-локальные координаты левого-верхнего угла ячеек (80×80) на холсте 1440×1061.
const LIT_CELLS: readonly [number, number][] = [
  [853, 818],
  [449, 818],
  [1176, 254],
  [529, 174],
  [1094, 335],
  [448, 254],
  [1094, 254],
  [448, 174],
  [369, 818],
  [369, 899],
  [207, 738],
];

const CELL = 80;

// Четыре дуги — сегменты эллипсов, вписанных в bounding-box'ы из макета (кадр-локально).
// V1 раскрывается вниз-вправо по верх-лево, V2 идёт через середину слева,
// V3 — угол справа-снизу, V4 — пологая арка по центру-низу.
const ARCS: readonly string[] = [
  'M 800 12 A 616 358 0 0 1 113 556', // V1  box (-330,-147) 1233×717
  'M 158 547 A 503 339 0 0 1 781 1026', // V2  box (-164,524) 1007×678
  'M 1254 1581 A 562 578 0 0 1 1860 796', // V3  box (1215,790) 1125×1157
  'M 335 845 A 490 318 0 0 1 1212 662', // V4  box (335,539) 981×636
];

export default function TechBackdrop({ cells = false }: { cells?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      aria-hidden="true"
    >
      {/* Дуги — во всю ширину, масштаб по ширине секции (высота из viewBox-пропорции) */}
      <svg
        className="absolute left-0 top-0 w-full"
        style={{ height: 'auto', overflow: 'visible' }}
        viewBox="0 0 1440 1061"
        fill="none"
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <radialGradient id="tb-arc-fade" cx="720" cy="500" r="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.58" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask
            id="tb-arc-mask"
            maskUnits="userSpaceOnUse"
            x="-500"
            y="-400"
            width="2900"
            height="2400"
          >
            <rect x="-500" y="-400" width="2900" height="2400" fill="url(#tb-arc-fade)" />
          </mask>
        </defs>
        <g
          mask="url(#tb-arc-mask)"
          stroke="rgba(96,160,255,0.18)"
          strokeWidth={1.25}
          strokeLinecap="round"
        >
          {ARCS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>

      {/* Подсвеченные ячейки — в центрированном контейнере 1440px (совпадают с контентом ≥1440) */}
      {cells && (
        <div className="absolute left-1/2 top-0 h-full w-[1440px] -translate-x-1/2">
          {LIT_CELLS.map(([x, y], i) => (
            <span
              key={i}
              className="absolute block"
              style={{
                left: x,
                top: y,
                width: CELL,
                height: CELL,
                background: 'rgba(64,128,255,0.08)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
