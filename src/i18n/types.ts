export type Lang = 'ru' | 'kz';

export interface ServiceData {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  features: string[];
  benefits: string[];
}

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
    subtitle: string;
    btnServices: string;
    btnContact: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
  };
  servicesPreview: {
    eyebrow: string;
    title: string;
    subtitle: string;
    learnMore: string;
    allBtn: string;
  };
  stats: {
    items: Array<{ value: string; label: string }>;
  };
  cta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    points: string[];
  };
  footer: {
    description: string;
    navTitle: string;
    servicesTitle: string;
    contactsTitle: string;
    rights: string;
  };
  about: {
    heroTitle: string;
    heroSubtitle: string;
    intro1: string;
    intro2: string;
    missionTitle: string;
    missionText: string;
    valuesTitle: string;
    values: string[];
    cardsTitle: string;
    cards: Array<{ title: string; text: string }>;
    whyTitle: string;
    reasons: Array<{ title: string; text: string }>;
  };
  audience: {
    eyebrow: string;
    title: string;
    subtitle: string;
    clients: string[];
    geoTitle: string;
    geo: string[];
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
  servicesPage: {
    heroTitle: string;
    heroSubtitle: string;
    detailsBtn: string;
    notFoundTitle: string;
    notFoundText: string;
    contactBtn: string;
  };
  solutionsPage: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    intro: string;
    items: Array<{
      slug: string;
      name: string;
      tagline: string;
      description: string;
      points: string[];
    }>;
    ctaTitle: string;
    ctaText: string;
    contactBtn: string;
  };
  contactsPage: {
    heroTitle: string;
    heroSubtitle: string;
    howTitle: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    hoursLabel: string;
    addressText: string;
    hoursText: string;
    infoTitle: string;
    infoItems: string[];
  };
  form: {
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    messageLabel: string;
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
  servicesData: ServiceData[];
}
