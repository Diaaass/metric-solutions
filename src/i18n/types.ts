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

export interface ProjectData {
  id: string;
  title: string;
  client: string;
  category: string;
  description: string;
  results: string[];
  year: number;
}

export interface TeamMemberData {
  id: string;
  name: string;
  position: string;
  bio: string;
  expertise: string[];
}

export interface Translation {
  nav: {
    home: string;
    about: string;
    services: string;
    projects: string;
    team: string;
    contacts: string;
  };
  hero: {
    title: string;
    subtitle: string;
    btnServices: string;
    btnContact: string;
  };
  servicesPreview: {
    title: string;
    subtitle: string;
    learnMore: string;
  };
  stats: {
    items: Array<{ value: string; label: string }>;
  };
  cta: {
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
    cards: Array<{ title: string; text: string }>;
    whyTitle: string;
    reasons: Array<{ title: string; text: string }>;
  };
  servicesPage: {
    heroTitle: string;
    heroSubtitle: string;
    detailsBtn: string;
    notFoundTitle: string;
    notFoundText: string;
    contactBtn: string;
  };
  servicePage: {
    geometallurgy: {
      whatTitle: string;
      whatP1: string;
      whatP2: string;
      featuresTitle: string;
      benefitsTitle: string;
    };
    metalBalance: {
      whatTitle: string;
      whatP1: string;
      whatP2: string;
      featuresTitle: string;
      benefitsTitle: string;
    };
    oreResearch: {
      whatTitle: string;
      whatP1: string;
      whatP2: string;
      featuresTitle: string;
      benefitsTitle: string;
    };
  };
  projectsPage: {
    heroTitle: string;
    heroSubtitle: string;
    resultsLabel: string;
    ctaTitle: string;
    ctaText: string;
    contactBtn: string;
  };
  teamPage: {
    heroTitle: string;
    heroSubtitle: string;
    expertiseLabel: string;
    ctaTitle: string;
    ctaText: string;
    joinBtn: string;
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
    errorConn: string;
    privacyNote: string;
  };
  servicesData: ServiceData[];
  projectsData: ProjectData[];
  teamData: TeamMemberData[];
}
