import React from 'react';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import type { Translation } from '@/i18n';

/**
 * Галерея на главной: 4 изображения + описание под ними.
 * Файлы названы предсказуемо (gallery-1…4.svg) — заглушки заменяются
 * на реальные фото лабораторий и производств без правки кода.
 */
const IMAGES = ['/gallery-1.svg', '/gallery-2.svg', '/gallery-3.svg', '/gallery-4.svg'];

export default function Gallery({ t }: { t: Translation['gallery'] }) {
  return (
    <section className="relative overflow-hidden bg-ink-950 section-padding">
      <div className="absolute inset-0 bg-grid-dark" aria-hidden="true" />

      <Container>
        <div className="relative">
          <h2 className="max-w-2xl mb-10 animate-fade-in">{t.title}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {IMAGES.map((src, i) => (
              <div
                key={src}
                className="overflow-hidden rounded-2xl border border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                {/* width/height заданы явно — без сдвига вёрстки при загрузке */}
                <Image
                  src={src}
                  alt=""
                  width={800}
                  height={600}
                  unoptimized
                  sizes="(min-width: 1024px) 288px, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-3xl text-[15px] md:text-base font-extralight text-white/95 leading-relaxed tracking-tight animate-fade-in">
            {t.text}
          </p>
        </div>
      </Container>
    </section>
  );
}
