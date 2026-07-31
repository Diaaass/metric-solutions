export type Lang = 'ru' | 'kz';

/** Слаги детальных страниц направлений (/services/[slug]). */
export type ServiceSlug = 'geometallurgy' | 'beneficiation' | 'hydrometallurgy';

export interface Translation {
  nav: {
    home: string;
    about: string;
    services: string;
    solutions: string;
    contacts: string;
  };

  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    tagline: string;
    btnContact: string;
    stat1Value: string;
    stat1Label: string;
    stat1LabelAccent: string;
    stat2Value: string;
    stat2Label: string;
    /** Кнопка над 3D-визуалом: остановить анимацию (WCAG 2.2.2) */
    pauseAnimation: string;
    /** Кнопка над 3D-визуалом: возобновить анимацию */
    playAnimation: string;
  };

  /** Секция «О компании» на главной (наука/технологии/опыт + 3 мини-карточки) */
  homeAbout: {
    eyebrow: string;
    title: string;
    brand: string;
    intro: string;
    cards: Array<{ icon: string; title: string; text: string }>;
  };

  /** Секция «Направления деятельности» на главной (6 карточек) */
  homeDirections: {
    eyebrow: string;
    title: string;
    cards: Array<{ title: string; text: string }>;
  };

  /** Баннер «Готовы обсудить ваш проект?» */
  ctaBanner: {
    title: string;
    subtitle: string;
    btn: string;
  };

  /** Секция «Результаты в цифрах» */
  results: {
    eyebrow: string;
    title: string;
    items: Array<{ value: string; label: string }>;
  };

  footer: {
    navTitle: string;
    servicesTitle: string;
    contactsTitle: string;
    caption: string;
    services: string[];
  };

  aboutPage: {
    breadcrumb: string;
    title: string;
    brand: string;
    intro: string;
    values: Array<{ icon: string; title: string; text: string }>;
  };

  servicesPage: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    items: Array<{ num: string; slug: ServiceSlug; title: string; text: string }>;
  };

  /** Детальные страницы направлений (/services/[slug]) и перекрёстные ссылки с решениями */
  serviceDetail: {
    /** Начало хлебных крошек; название направления добавляется в разметке */
    breadcrumbPrefix: string;
    /** Ссылка «Подробнее» на карточках /services */
    moreLabel: string;
    /** Заголовок блока со связанными решениями на детальной странице */
    relatedSolutionsTitle: string;
    /** Подпись ссылки на карточке связанного решения */
    relatedSolutionsLink: string;
    /** Заголовок строки со связанными направлениями на /solutions */
    relatedServicesTitle: string;
    items: Record<
      ServiceSlug,
      {
        lead: string;
        paragraphs: string[];
        seoTitle: string;
        seoDescription: string;
      }
    >;
  };

  solutionsPage: {
    breadcrumb: string;
    heroTitle1: string;
    heroTitle1Accent: string;
    heroTitle2: string;
    heroTitle2Accent: string;
    heroSubtitle: string;
    intro: string;
    items: Array<{
      slug: string;
      name: string;
      tagline: string;
      description: string;
      points: string[];
    }>;
  };

  contactsPage: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    formTitle: string;
    howTitle: string;
    emailLabel: string;
    phoneLabel: string;
    officeLabel: string;
    hoursLabel: string;
    addressText: string;
    hoursText: string;
  };

  form: {
    namePlaceholder: string;
    companyPlaceholder: string;
    emailPlaceholder: string;
    phonePlaceholder: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    successTitle: string;
    close: string;
    errorConn: string;
    errorPhone: string;
    privacyNote: string;
  };

  metals: {
    eyebrow: string;
    title: string;
    subtitle: string;
    updatedLabel: string;
    sourceLabel: string;
    disclaimer: string;
    names: {
      gold: string;
      silver: string;
      copper: string;
      zinc: string;
      aluminum: string;
    };
  };

  /** SEO-метаданные по страницам (title + description на каждую из 5 страниц) */
  seo: {
    home: { title: string; description: string };
    about: { title: string; description: string };
    services: { title: string; description: string };
    solutions: { title: string; description: string };
    contacts: { title: string; description: string };
  };
}
