export type Lang = 'ru' | 'en';

/** Слаги детальных страниц направлений (/services/[slug]). */
export type ServiceSlug = 'geometallurgy' | 'beneficiation' | 'hydrometallurgy';

export interface Translation {
  nav: {
    home: string;
    about: string;
    services: string;
    solutions: string;
    contacts: string;
    /** aria-label логотипа-ссылки в шапке */
    homeAriaLabel: string;
    /** aria-label основной навигации (десктоп) */
    primaryNavLabel: string;
    /** aria-label мобильной навигации */
    mobileNavLabel: string;
    /** aria-label бургера в закрытом состоянии */
    openMenu: string;
    /** aria-label бургера в открытом состоянии */
    closeMenu: string;
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
  };

  /** Секция «О компании» на главной (наука/технологии/опыт + 3 мини-карточки) */
  homeAbout: {
    eyebrow: string;
    title: string;
    brand: string;
    intro: string;
    cards: Array<{ icon: string; title: string; text: string }>;
  };

  /** Краткий блок услуг на главной: изображение + обобщённая подпись + ссылка на /services */
  homeServices: {
    eyebrow: string;
    title: string;
    text: string;
    btn: string;
  };

  /** Галерея на главной: карусель фотографий + описание под ней */
  gallery: {
    title: string;
    text: string;
    /** aria-label кнопок листания */
    prevLabel: string;
    nextLabel: string;
    /** alt-тексты слайдов (по порядку файлов gallery-N.jpg) */
    alts: string[];
  };

  /** Баннер «Готовы обсудить ваш проект?» */
  ctaBanner: {
    title: string;
    subtitle: string;
    btn: string;
  };

  footer: {
    navTitle: string;
    servicesTitle: string;
    contactsTitle: string;
    caption: string;
    services: string[];
    /** Ссылка на политику конфиденциальности */
    privacyLabel: string;
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
    /** Союз между двумя частями заголовка («и» / «and») */
    heroTitleConjunction: string;
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
    /** Текст согласия на обработку ПДн перед ссылкой на политику */
    consentPrefix: string;
    /** Текст самой ссылки на политику конфиденциальности */
    consentLinkLabel: string;
    /**
     * Ошибки, пришедшие с сервера. /api/contact отдаёт машинный код, а текст
     * берётся отсюда: иначе на английской странице показывались бы русские
     * сообщения, зашитые в маршрут.
     */
    errors: {
      /** Тело запроса не разобрано */
      request: string;
      /** Не заполнены обязательные поля */
      required: string;
      /** Некорректный email */
      email: string;
      /** Некорректный телефон */
      phone: string;
      /** Слишком много запросов с одного IP */
      rate: string;
      /** Письмо не ушло (SMTP) */
      send: string;
      /** Сообщение длиннее допустимого лимита */
      long: string;
      /** Не дано согласие на обработку персональных данных */
      consent: string;
    };
  };

  /** Полоса котировок над шапкой (TickerBar): подписи для screen reader и tooltip */
  metals: {
    /** aria-label полосы */
    eyebrow: string;
    /** tooltip полосы: данные носят справочный характер */
    disclaimer: string;
    /** Полные названия металлов — для скринридера вместо символов Au/Ag/… */
    names: {
      gold: string;
      silver: string;
      copper: string;
      zinc: string;
      aluminum: string;
    };
    /** Подписи единиц измерения цены рядом с числом */
    units: {
      /** Тройская унция — драгметаллы (Au, Ag) */
      toz: string;
      /** Метрическая тонна — промышленные металлы (Cu, Zn, Al) */
      mt: string;
    };
  };

  /** Плавающая кнопка WhatsApp в нижнем левом углу */
  whatsapp: {
    /** aria-label/tooltip кнопки */
    ariaLabel: string;
  };

  /** Политика конфиденциальности (/privacy) */
  privacyPage: {
    breadcrumb: string;
    title: string;
    /** Дата редакции, показывается под заголовком */
    updatedAt: string;
    intro: string;
    sections: Array<{ title: string; paragraphs: string[] }>;
  };

  /** SEO-метаданные по страницам (title + description на каждую) */
  seo: {
    home: { title: string; description: string };
    about: { title: string; description: string };
    services: { title: string; description: string };
    solutions: { title: string; description: string };
    contacts: { title: string; description: string };
    privacy: { title: string; description: string };
  };
}
