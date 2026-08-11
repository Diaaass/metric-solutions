import { Translation } from './types';

const en: Translation = {
  nav: {
    home: 'Home',
    about: 'About us',
    services: 'Services',
    solutions: 'Solutions',
    contacts: 'Contact',
    homeAriaLabel: 'Metric Solutions — home',
    primaryNavLabel: 'Main navigation',
    mobileNavLabel: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  hero: {
    eyebrow: 'Geometallurgy and process consulting',
    title: 'Engineering solutions for efficient',
    titleAccent: 'mining and processing',
    subtitle:
      'An integrated approach to research, development and implementation of technologies for the mining and metals industry',
    tagline: 'A scientific approach. Practical results. Measurable impact.',
    btnContact: 'Discuss your project',
    stat1Value: '2',
    stat1Label: 'Proprietary mobile solutions:',
    stat1LabelAccent: 'NomadLab and Nomad Pilot Plant',
  },

  homeAbout: {
    eyebrow: 'About us',
    title: 'We bring together science, technology and hands-on experience',
    brand: 'Metric Solutions',
    intro:
      ' is an engineering consultancy specializing in the development and implementation of process technologies for the mining and metals industry. We provide services in geometallurgy, mineral processing, hydrometallurgy, laboratory studies and pilot testing.',
    cards: [
      {
        icon: 'CheckCircle',
        title: 'Scientific approach',
        text: 'We apply modern research and analytical methods for an accurate assessment of feed materials and processes.',
      },
      {
        icon: 'History',
        title: 'Engineering expertise',
        text: 'We design and implement solutions that account for plant realities and process constraints',
      },
      {
        icon: 'CheckSquare',
        title: 'Practical results',
        text: 'We focus on measurable impact and improved business performance.',
      },
    ],
  },

  homeServices: {
    eyebrow: 'Services',
    title: 'A full cycle of engineering services',
    text: 'From ore characterization to technology implementation at site. Three areas of expertise — geometallurgy, mineral processing and hydrometallurgy — cover the entire journey from feed studies to industrial results.',
    btn: 'All services',
  },

  gallery: {
    title: 'Our laboratories and projects',
    text: 'Research, pilot campaigns and work at client sites: laboratory equipment, processing circuits and the plants where we implement our solutions. Photos of Metric Solutions projects and equipment.',
  },

  ctaBanner: {
    title: 'Ready to discuss your project?',
    subtitle: 'Get in touch — we will propose the right solution for your needs',
    btn: 'Contact us',
  },

  footer: {
    navTitle: 'NAVIGATION',
    servicesTitle: 'SERVICES',
    contactsTitle: 'Contact',
    caption: 'Metric Solutions, 2026',
    services: ['Geometallurgy', 'Mineral processing', 'Hydrometallurgy'],
  },

  aboutPage: {
    breadcrumb: 'Home / About us',
    title: 'We bring together science, technology and hands-on experience',
    brand: 'Metric Solutions',
    intro:
      ' is an engineering consultancy specializing in the development and implementation of process technologies for the mining and metals industry. We provide services in geometallurgy, mineral processing, hydrometallurgy, laboratory studies and pilot testing.',
    values: [
      {
        icon: 'Shield',
        title: 'Reliability',
        text: 'We act responsibly at every stage of the project.',
      },
      {
        icon: 'Users',
        title: 'Partnership',
        text: 'We build long-term relationships with our clients.',
      },
      {
        icon: 'Lock',
        title: 'Safety',
        text: 'We care about people and the environment',
      },
      {
        icon: 'Lightbulb',
        title: 'Innovation',
        text: 'We continuously look for and implement the best engineering solutions',
      },
      {
        icon: 'Send',
        title: 'Our mission',
        text: 'To improve the efficiency of mining and metallurgical operations through advanced technologies, a scientific approach and engineering expertise.',
      },
      {
        icon: 'CheckCircle2',
        title: 'Professionalism',
        text: 'We rely on knowledge, experience and engineering judgment to solve complex problems',
      },
      {
        icon: 'Clock',
        title: 'Accountability',
        text: 'We take on commitments and deliver projects to a measurable result',
      },
    ],
  },

  servicesPage: {
    breadcrumb: 'Home / Services',
    title: 'Our services',
    subtitle:
      'Integrated engineering solutions that improve the performance of mining and metallurgical operations across every stage of processing',
    items: [
      {
        num: '01',
        slug: 'geometallurgy',
        title: 'Geometallurgy',
        text: 'Understanding the relationship between ore geology and its behavior in processing. Defining process parameters for different ore types.',
      },
      {
        num: '02',
        slug: 'beneficiation',
        title: 'Mineral processing',
        text: 'Development and optimization of processing flowsheets to maximize the recovery of valuable components and improve final product quality.',
      },
      {
        num: '03',
        slug: 'hydrometallurgy',
        title: 'Hydrometallurgy',
        text: 'Development of leaching and metal recovery technologies for ores and concentrates. Optimization of dissolution, sorption and electrowinning processes.',
      },
    ],
  },

  serviceDetail: {
    breadcrumbPrefix: 'Home / Services',
    moreLabel: 'Learn more',
    relatedSolutionsTitle: 'Related solutions',
    relatedSolutionsLink: 'View solutions',
    relatedServicesTitle: 'Related services',
    items: {
      geometallurgy: {
        lead: 'Understanding how ore geology drives processing behavior: from domain-based ore typing to forecasting recovery and throughput across every part of the deposit.',
        paragraphs: [
          'Geometallurgy links the geological model of a deposit to its metallurgical response. We sample and classify ore by domain, study mineral composition, textural features and the mode of occurrence of valuable components, and then determine how these properties affect grindability, recovery and concentrate quality.',
          'The resulting data feed a geometallurgical model — a set of relationships that predicts how ore will behave before it reaches the plant. The model supports blend planning, flags refractory ore types in advance and helps select process regimes for each specific feed.',
          'The outcome is less uncertainty in design and operations: the production plan is based on the actual metallurgical properties of each domain rather than deposit-wide averages. This narrows recovery variance, stabilizes concentrator performance and makes the project economics more reliable.',
        ],
        seoTitle: 'Geometallurgy — Metric Solutions',
        seoDescription:
          'Geometallurgical studies: domain-based ore typing, mineralogy, recovery forecasting and geometallurgical modeling of the deposit.',
      },
      beneficiation: {
        lead: 'Development and optimization of processing flowsheets — from laboratory testing to industrial operation — to maximize the recovery of valuable components and improve final product quality.',
        paragraphs: [
          'Work starts with a study of the feed material composition and its amenability to processing. We select the ore preparation circuit, determine the liberation size and the sequence of operations — gravity, magnetic, flotation — based on the mineralogy of the specific ore rather than off-the-shelf templates.',
          'The flowsheet is then verified at laboratory and larger scale: reagent regimes, circulating loads and middlings take-off points are refined. Test results are compiled into a process design document with product balances, recovery figures and equipment requirements.',
          "For operating concentrators we solve the reverse problem: we find the causes of losses to tailings, identify bottlenecks in the existing flowsheet and propose changes that deliver results without a full rebuild of the circuit. Every recommendation is validated by test work on the client's actual feed.",
        ],
        seoTitle: 'Mineral processing — Metric Solutions',
        seoDescription:
          'Development and optimization of processing flowsheets: amenability testing, reagent regimes, process design documentation and reduced losses to tailings.',
      },
      hydrometallurgy: {
        lead: 'Development of leaching and metal recovery technologies for ores, concentrates and middlings, including optimization of dissolution, sorption, solvent extraction and electrowinning.',
        paragraphs: [
          'Hydrometallurgical routes are used where physical beneficiation cannot deliver: for refractory and oxidized ores, low-grade feed, middlings and mining waste. We determine the deportment of the metal, then select the reagent system and the leaching mode — heap, tank or autoclave — based on feed composition and downstream requirements.',
          'Recovering metal from solution into a saleable product is a task of its own. We test sorption, elution, solvent extraction, precipitation and electrowinning, tune parameters for kinetics and selectivity, and design solution recycling and effluent treatment — both directly affect operating costs and environmental performance.',
          "Every regime is verified on the client's actual samples, producing reliable mass balances, reagent consumption figures and kinetic data. This approach justifies the process flowsheet before any capital commitment is made.",
        ],
        seoTitle: 'Hydrometallurgy — Metric Solutions',
        seoDescription:
          'Leaching and metal recovery technologies for ores and concentrates: sorption, solvent extraction, electrowinning, solution recycling and mass balances.',
      },
    },
  },

  solutionsPage: {
    breadcrumb: 'Home / Solutions',
    heroTitle1: 'Nomad',
    heroTitle1Accent: 'Lab',
    heroTitleConjunction: 'and',
    heroTitle2: 'Nomad',
    heroTitle2Accent: 'Pilot Plant',
    heroSubtitle:
      "Research and process testing where the ore is — at the client's site, with no need to ship samples thousands of kilometers.",
    intro:
      'Metric Solutions mobile units make it possible to test process hypotheses in the field and shorten the path from research to industrial implementation.',
    items: [
      {
        slug: 'nomadlab',
        name: 'NomadLab',
        tagline: 'Mobile containerized laboratory',
        description:
          'A containerized laboratory for running studies directly at site. It allows feed analysis and process testing on the spot, without lengthy sample logistics.',
        points: [
          "Research and analytics at the client's site",
          'Shorter sampling logistics and timelines',
          'Rapid assessment of feed processing properties',
        ],
      },
      {
        slug: 'nomad-pilot-plant',
        name: 'Nomad Pilot Plant',
        tagline: 'Mobile pilot plant',
        description:
          'A mobile pilot plant for rapid validation of process solutions under near-industrial conditions — before capital is committed.',
        points: [
          'Technology validation under near-industrial conditions',
          'Lower process and investment risk',
          'A fast path from laboratory data to pilot scale',
        ],
      },
      {
        slug: 'tech-audit',
        name: 'Process audit',
        tagline: 'Comprehensive plant assessment',
        description:
          'A comprehensive assessment of the processes and equipment of an operating plant. We identify bottlenecks and sources of losses, quantify efficiency reserves and build an action plan with measurable impact. The audit relies on actual site data, so it applies to any of our service areas.',
        points: [
          'Audit of processes and equipment',
          'Identification of bottlenecks and sources of losses',
          'Assessment of efficiency improvement potential',
          'An action plan with measurable impact',
        ],
      },
    ],
  },

  contactsPage: {
    breadcrumb: 'Home / Contact',
    title: 'Contact us',
    subtitle: 'Get in touch to discuss your process challenge or project.',
    formTitle: 'Send a request',
    howTitle: 'How to reach us',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    officeLabel: 'Office',
    hoursLabel: 'Working hours',
    addressText: '10/2-36 B. Momyshuly St., Astana, 010000, Kazakhstan',
    hoursText: 'Mon–Fri: 9:00 AM – 6:00 PM, Sat–Sun: closed',
  },

  form: {
    namePlaceholder: 'Your name',
    companyPlaceholder: 'Company name',
    emailPlaceholder: 'Email',
    phonePlaceholder: 'Phone',
    messagePlaceholder: 'Message',
    submit: 'Send request',
    submitting: 'Sending...',
    success: 'Your request has been sent. We will get back to you shortly.',
    successTitle: 'Thank you!',
    close: 'Close',
    errorConn: 'Could not send your request. Please check your connection.',
    errorPhone: 'Enter the number as +7 (XXX) XXX XXXX',
    privacyNote: 'By clicking the button you agree to the privacy policy',
    errors: {
      request: 'Invalid request. Refresh the page and try again.',
      required: 'Please fill in the required fields',
      email: 'Invalid email address',
      phone: 'Invalid phone number',
      rate: 'Too many requests. Please try again later.',
      send: 'Failed to send. Please try again later.',
      long: 'Message is too long (5,000 characters max)',
    },
  },

  metals: {
    eyebrow: 'Metal prices',
    disclaimer: 'Prices are provided for reference only and do not constitute an offer.',
    names: {
      gold: 'Gold',
      silver: 'Silver',
      copper: 'Copper',
      zinc: 'Zinc',
      aluminum: 'Aluminum',
    },
    units: {
      toz: '$/oz',
      mt: '$/t',
    },
  },

  seo: {
    home: {
      title: 'Metric Solutions — Geometallurgy, Mineral Processing and Hydrometallurgy',
      description:
        'Metric Solutions is an engineering consultancy for the mining and metals industry: geometallurgy, mineral processing, flotation, hydrometallurgy, laboratory and pilot testing. Proprietary mobile units NomadLab and Nomad Pilot Plant.',
    },
    about: {
      title: 'About us — Metric Solutions',
      description:
        'Metric Solutions is an engineering consultancy specializing in geometallurgy, mineral processing, hydrometallurgy, laboratory studies and pilot testing.',
    },
    services: {
      title: 'Services — Metric Solutions',
      description:
        'Integrated engineering solutions for mining and metallurgical operations: geometallurgy, mineral processing and hydrometallurgy — from ore characterization to technology implementation.',
    },
    solutions: {
      title: 'NomadLab and Nomad Pilot Plant — Metric Solutions',
      description:
        "Metric Solutions mobile units: the NomadLab containerized laboratory and the Nomad Pilot Plant for research and process testing at the client's site.",
    },
    contacts: {
      title: 'Contact — Metric Solutions',
      description:
        'Contact Metric Solutions to discuss your process challenge or project: office in Astana, email, phone and a consultation request form.',
    },
  },

  whatsapp: {
    ariaLabel: 'Message us on WhatsApp',
  },
};

export default en;
