import type { ServiceSlug } from '@/i18n/types';

/**
 * Связка «направление → решения».
 * Один источник истины для блока «Связанные решения» на /services/[slug]
 * и для строки «Связанные направления» на /solutions.
 */
export const SOLUTIONS_BY_SERVICE: Record<ServiceSlug, string[]> = {
  // Типизация руд и прогнозные модели опираются и на аналитику на площадке, и на пилотные кампании.
  geometallurgy: ['nomadlab', 'nomad-pilot-plant', 'tech-audit'],
  // Схемы обогащения отрабатываются в лаборатории и проверяются на пилоте.
  beneficiation: ['nomadlab', 'nomad-pilot-plant', 'tech-audit'],
  // Гидрометаллургические режимы подбираются лабораторно.
  hydrometallurgy: ['nomadlab', 'tech-audit'],
  // tech-audit стоит у всех трёх: аудит оценивает действующее производство
  // и не привязан к конкретной технологии. Обратная связка (servicesBySolution)
  // поэтому вернёт для него все направления сразу.
};

/** Обратная связка: какие направления показывать под карточкой решения. */
export function servicesBySolution(solutionSlug: string): ServiceSlug[] {
  return (Object.keys(SOLUTIONS_BY_SERVICE) as ServiceSlug[]).filter((service) =>
    SOLUTIONS_BY_SERVICE[service].includes(solutionSlug),
  );
}
