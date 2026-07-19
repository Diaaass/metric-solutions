export type Lang = 'ru' | 'kz';

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
    items: Array<{ num: string; title: string; text: string }>;
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
}
