import type { SupportedLocale } from "@/middleware";

export interface Dictionary {
  nav: { cases: string; posts: string; about: string };
  stack: { title: string };
  cases: { title: string; viewAll: string; readCase: string; empty: string };
  posts: { title: string; viewAll: string; empty: string };
  about: { title: string; full: string; empty: string };
  contacts: { title: string; empty: string };
  comments: {
    title: string;
    empty: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    bodyLabel: string;
    bodyPlaceholder: string;
    captchaLabel: string;
    captchaPlaceholder: string;
    captchaRefresh: string;
    submit: string;
    submitting: string;
    success: string;
    genericError: string;
    pendingTitle: string;
    pendingBody: string;
    pendingClose: string;
    published: string;
  };
  footer: { note: string; sitemap: string };
  techCategory: Record<"LANGUAGE" | "FRAMEWORK" | "DATABASE" | "INFRA" | "TOOL" | "OTHER", string>;
  contactPlatform: Record<"GITHUB" | "TELEGRAM" | "HABR_CAREER" | "EMAIL" | "LINKEDIN" | "OTHER", string>;
}

const dictionary: Record<SupportedLocale, Dictionary> = {
  ru: {
    nav: { cases: "Кейсы", posts: "Блог", about: "Обо мне" },
    stack: { title: "Стек" },
    cases: {
      title: "Кейсы",
      viewAll: "Все кейсы →",
      readCase: "Читать кейс →",
      empty: "Кейсы появятся здесь после публикации в админ-панели.",
    },
    posts: {
      title: "Последние статьи",
      viewAll: "Весь блог →",
      empty: "Статьи появятся здесь после публикации в админ-панели.",
    },
    about: { title: "Обо мне", full: "Полная версия →", empty: "Раздел ещё не заполнен." },
    contacts: { title: "Контакты", empty: "Контакты ещё не добавлены." },
    comments: {
      title: "Комментарии",
      empty: "Пока нет комментариев — будьте первым.",
      nameLabel: "Имя",
      namePlaceholder: "Как к вам обращаться",
      emailLabel: "Email (не публикуется)",
      emailPlaceholder: "you@example.com",
      bodyLabel: "Комментарий",
      bodyPlaceholder: "Ваше мнение",
      captchaLabel: "Введите код с картинки",
      captchaPlaceholder: "Код",
      captchaRefresh: "Обновить код",
      submit: "Отправить",
      submitting: "Отправка…",
      success: "Комментарий отправлен и появится после проверки модератором.",
      genericError: "Не удалось отправить комментарий. Проверьте код с картинки и попробуйте снова.",
      pendingTitle: "Комментарий отправлен",
      pendingBody: "Он появится на странице после проверки модератором — обычно это занимает немного времени.",
      pendingClose: "Понятно",
      published: "Комментарий опубликован.",
    },
    footer: { note: "собрано на NestJS + Next.js", sitemap: "Карта сайта" },
    techCategory: {
      LANGUAGE: "Язык",
      FRAMEWORK: "Фреймворк",
      DATABASE: "Данные",
      INFRA: "Инфра",
      TOOL: "Инструменты",
      OTHER: "Другое",
    },
    contactPlatform: {
      GITHUB: "GitHub",
      TELEGRAM: "Telegram",
      HABR_CAREER: "Habr Career",
      EMAIL: "Email",
      LINKEDIN: "LinkedIn",
      OTHER: "Ссылка",
    },
  },
  en: {
    nav: { cases: "Cases", posts: "Blog", about: "About" },
    stack: { title: "Stack" },
    cases: {
      title: "Cases",
      viewAll: "All cases →",
      readCase: "Read case →",
      empty: "Cases will appear here once published from the admin panel.",
    },
    posts: {
      title: "Latest posts",
      viewAll: "All posts →",
      empty: "Posts will appear here once published from the admin panel.",
    },
    about: { title: "About", full: "Full version →", empty: "This section hasn't been filled in yet." },
    contacts: { title: "Contacts", empty: "No contacts added yet." },
    comments: {
      title: "Comments",
      empty: "No comments yet — be the first.",
      nameLabel: "Name",
      namePlaceholder: "How should we call you",
      emailLabel: "Email (not published)",
      emailPlaceholder: "you@example.com",
      bodyLabel: "Comment",
      bodyPlaceholder: "Share your thoughts",
      captchaLabel: "Enter the code from the image",
      captchaPlaceholder: "Code",
      captchaRefresh: "Get a new code",
      submit: "Submit",
      submitting: "Submitting…",
      success: "Comment submitted — it will appear once a moderator approves it.",
      genericError: "Couldn't submit the comment. Check the image code and try again.",
      pendingTitle: "Comment submitted",
      pendingBody: "It will appear on the page once a moderator approves it — usually shortly.",
      pendingClose: "Got it",
      published: "Comment published.",
    },
    footer: { note: "built with NestJS + Next.js", sitemap: "Sitemap" },
    techCategory: {
      LANGUAGE: "Language",
      FRAMEWORK: "Framework",
      DATABASE: "Data",
      INFRA: "Infra",
      TOOL: "Tooling",
      OTHER: "Other",
    },
    contactPlatform: {
      GITHUB: "GitHub",
      TELEGRAM: "Telegram",
      HABR_CAREER: "Habr Career",
      EMAIL: "Email",
      LINKEDIN: "LinkedIn",
      OTHER: "Link",
    },
  },
};

export function getDictionary(locale: SupportedLocale): Dictionary {
  return dictionary[locale];
}
