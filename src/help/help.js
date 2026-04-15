(function () {
  "use strict";

  const languageButton = document.querySelector('[data-action="toggle-language"]');
  const themeButton = document.querySelector('[data-action="cycle-theme"]');
  const heroBrandLink = document.querySelector('[data-role="hero-brand-link"]');
  const themeOrder = ["system", "dark", "light"];
  const translations = {
    fa: {
      languageButton: "FA / EN",
      themeLabel: "تم",
      switchLanguage: "تغییر زبان",
      cycleTheme: "تغییر تم",
      openRepository: "باز کردن گیت‌هاب Rashnu",
      heroSubtitle: "راهنمای استفاده از افزونه مقایسه قیمت Rashnu",
      whatTitle: "این افزونه چه کار می‌کند؟",
      whatBody: "Rashnu هنگام مرور صفحات لیست و جزئیات محصول در <strong>دیجیکالا</strong>، <strong>ترب</strong> و <strong>تکنولایف</strong>، نتیجه‌ی مقایسه را برای چندین منبع از جمله ایمالز، دیوار، آمازون و eBay در پنل کناری نمایش می‌دهد.",
      supportedTitle: "صفحه‌های پشتیبانی‌شده",
      supportedList: "<li>صفحات لیست و جست‌وجوی دیجیکالا</li><li>صفحات جزئیات محصول دیجیکالا</li><li>صفحات لیست و جست‌وجوی ترب</li><li>صفحات جزئیات محصول ترب</li><li>صفحات لیست و جست‌وجوی تکنولایف</li><li>صفحات جزئیات محصول تکنولایف</li><li>صفحات لیست و جست‌وجوی ایمالز</li><li>صفحات جزئیات محصول ایمالز</li><li>صفحات لیست و جست‌وجوی آمازون</li><li>صفحات جزئیات محصول آمازون</li><li>صفحات لیست و جست‌وجوی eBay</li><li>صفحات جزئیات محصول eBay</li>",
      featuresTitle: "ویژگی‌ها",
      featuresList: "<li>مقایسه قیمت بین چندین فروشگاه</li><li>شماره‌گذاری راهنما روی صفحه و داخل پنل</li><li>پرش از پنل به محصول روی صفحه و برعکس</li><li>همگام‌سازی با آیتم قابل مشاهده در صفحه</li><li>نمای لیست یا گرید، به‌همراه نمای مینیمال</li><li>جست‌وجوی سراسری با فیلترهای include / exclude، شرط وضعیت و ادغام موارد مشابه</li><li>پشتیبانی جست‌وجوی دیوار با انتخاب شهر مستقل</li>",
      globalSearchTitle: "جست‌وجوی سراسری Rashnu",
      globalSearchList: "<li>از دکمه‌ی ذره‌بین در هدر پنل برای باز کردن تب جست‌وجوی سراسری استفاده کنید.</li><li>از دکمه‌ی <strong>جست‌وجوی Rashnu</strong> داخل هر کارت برای باز کردن همان عنوان در جست‌وجوی سراسری استفاده کنید.</li><li>در جست‌وجوی سراسری می‌توانید منابع فعال را انتخاب کنید، عبارت‌ها را در <strong>باید شامل شود</strong> و <strong>حذف واژه‌ها</strong> مدیریت کنید و روی نتیجه‌ها شرط <strong>فقط نو / فقط کارکرده</strong> بگذارید.</li><li>برای دیوار، شهر انتخاب‌شده در پنل و تب جست‌وجوی سراسری مشترک است و فقط روی درخواست‌های دیوار اعمال می‌شود.</li><li>ادغام موارد مشابه، پیش‌نمایش کوئری، پیشنهادهای جداگانه برای include و exclude، و تصویر بندانگشتی نتیجه‌ها فقط در همین تب اعمال می‌شوند و تنظیمات پنل را بازنویسی نمی‌کنند.</li>",
      settingsTitle: "تنظیمات",
      settingsList: "<li><strong>انتخاب عنصر</strong>: فقط محصولی که روی آن hover یا focus می‌شود بررسی و نمایش داده می‌شود.</li><li><strong>همگام با دید صفحه</strong>: پنل سعی می‌کند آیتمی را برجسته کند که کاربر واقعاً در صفحه می‌بیند.</li><li><strong>نمای مینیمال</strong>: کارت‌ها فشرده‌تر می‌شوند و دکمه‌های هر آیتم به حالت آیکونی درمی‌آیند.</li><li><strong>شماره راهنما</strong>: کنار هر محصول روی سایت، یک شماره می‌افتد که همان شماره در Rashnu هم دیده می‌شود.</li><li><strong>شهر دیوار</strong>: فقط روی جست‌وجوها و تطبیق‌های دیوار اثر می‌گذارد و استخراج صفحه‌ای برای دیوار فعال نمی‌کند.</li><li><strong>دیباگ</strong>: داده‌های تشخیصی و جزئیات بیشتری در پنل نشان می‌دهد.</li><li><strong>ثبت خودکار لاگ</strong>: وقایع توسعه را به لاگ محلی می‌فرستد.</li><li><strong>چیدمان</strong>: بین لیست و گرید جابه‌جا می‌شود.</li><li><strong>اندازه</strong>: مقیاس کلی پنل را کم یا زیاد می‌کند.</li><li><strong>هشدار آمازون و eBay</strong>: آمازون و eBay ممکن است ترافیک افزونه را به‌عنوان رفتار بات تشخیص دهند، بنابراین نتایج این دو منبع همیشه کاملاً قابل اتکا نیست.</li>",
      guideTitle: "کار با راهنما و انتخاب آیتم",
      guideList: "<li>با کلیک روی دکمه‌ی مکان‌یاب هر کارت، صفحه به همان محصول اسکرول می‌شود و هایلایت می‌گردد.</li><li>با hover روی شماره راهنمای روی سایت، آیتم متناظر در پنل برجسته می‌شود.</li><li>با کلیک روی شماره راهنما، پنل به همان آیتم اسکرول می‌کند.</li><li>دکمه‌ی <strong>جست‌وجوی Rashnu</strong> روی هر کارت، تب جست‌وجوی سراسری را باز می‌کند و همان عنوان را برای شما جست‌وجو می‌کند.</li>",
      loggingTitle: "ثبت لاگ محلی",
      loggingBody1: "برای توسعه، Rashnu از helper محلی استفاده می‌کند و لاگ‌ها را در مسیر زیر می‌نویسد:",
      loggingBody2: "اگر helper فعال نباشد، افزونه همچنان کار می‌کند ولی لاگ فایل‌ها به‌روزرسانی نمی‌شوند.",
      licenseTitle: "مجوز و سازنده",
      licenseBody1: "این پروژه با مجوز <strong>MIT</strong> منتشر می‌شود.",
      licenseBody2: "Creator & Copyright: <strong>Ali Sinaee</strong>"
    },
    en: {
      languageButton: "EN / FA",
      themeLabel: "Theme",
      switchLanguage: "Switch language",
      cycleTheme: "Cycle theme",
      openRepository: "Open Rashnu GitHub repository",
      heroSubtitle: "Guide to using the Rashnu comparison extension",
      whatTitle: "What does this extension do?",
      whatBody: "Rashnu watches listing and product-detail pages on <strong>Digikala</strong>, <strong>Torob</strong>, and <strong>Technolife</strong>, then shows multi-provider comparison results (including Emalls, Divar, Amazon, and eBay) in the side panel.",
      supportedTitle: "Supported pages",
      supportedList: "<li>Digikala listing and search pages</li><li>Digikala product detail pages</li><li>Torob listing and search pages</li><li>Torob product detail pages</li><li>Technolife listing and search pages</li><li>Technolife product detail pages</li><li>Emalls listing and search pages</li><li>Emalls product detail pages</li><li>Amazon listing and search pages</li><li>Amazon product detail pages</li><li>eBay listing and search pages</li><li>eBay product detail pages</li>",
      featuresTitle: "Features",
      featuresList: "<li>Cross-site price comparison</li><li>Guide numbers on the page and inside the panel</li><li>Jump from the panel to the page item and back</li><li>Sync with the currently visible page item</li><li>List or grid layout with a minimal mode</li><li>Global search with include/exclude filters, condition filters, and duplicate grouping</li><li>Divar search support with a shared city selector</li>",
      globalSearchTitle: "Rashnu Global Search",
      globalSearchList: "<li>Use the search icon in the panel header to open the global-search tab.</li><li>Use the <strong>Rashnu Search</strong> button on any item card to open global search for that exact title.</li><li>Inside global search you can choose active providers, manage <strong>Must Include</strong> and <strong>Exclude Words</strong> chips, and apply <strong>New only / Used only</strong> conditions.</li><li>The Divar city selector is shared between the side panel and the global-search tab and only affects Divar requests.</li><li>Duplicate grouping, query preview, separate include/exclude suggestions, and result thumbnails are session-local to the search tab and do not overwrite panel settings.</li>",
      settingsTitle: "Settings",
      settingsList: "<li><strong>Element Select</strong>: only the hovered or focused product is inspected and shown.</li><li><strong>Sync Page View</strong>: Rashnu tries to follow the product that is actually visible on the real page.</li><li><strong>Minimal View</strong>: cards become compact and item actions switch to icon buttons.</li><li><strong>Guide Numbers</strong>: every product on the site gets a number that also appears in Rashnu.</li><li><strong>Divar City</strong>: only affects Divar searches and matches; it does not turn Divar pages into supported extraction pages.</li><li><strong>Debug</strong>: shows extra diagnostic details.</li><li><strong>Auto Logs</strong>: sends development events to the local helper.</li><li><strong>Layout</strong>: switches between list and grid.</li><li><strong>Size</strong>: changes the panel scale.</li><li><strong>Amazon/eBay Warning</strong>: Amazon and eBay may detect extension traffic as bot activity, so results on these providers are not always fully reliable.</li>",
      guideTitle: "Guide numbers and item navigation",
      guideList: "<li>Click the locate button on a card to scroll the real page to that item and highlight it.</li><li>Hover a guide badge on the site to highlight the matching Rashnu row.</li><li>Click a guide badge on the site to scroll Rashnu to the matching item.</li><li>The <strong>Rashnu Search</strong> action on each card opens the global-search tab and immediately runs that item title there.</li>",
      loggingTitle: "Local logging",
      loggingBody1: "For development, Rashnu uses a local helper and writes logs to:",
      loggingBody2: "If the helper is not running, the extension still works, but repo log files are not updated.",
      licenseTitle: "License and creator",
      licenseBody1: "This project is released under the <strong>MIT</strong> license.",
      licenseBody2: "Creator & Copyright: <strong>Ali Sinaee</strong>"
    }
  };

  boot().catch(() => {});

  async function boot() {
    const stored = await chrome.storage.local.get(["rashnuLanguage", "rashnuThemeMode"]);
    const language = stored.rashnuLanguage === "en" ? "en" : "fa";
    const themeMode = themeOrder.includes(stored.rashnuThemeMode) ? stored.rashnuThemeMode : "system";
    applyLanguage(language);
    applyTheme(themeMode);

    languageButton?.addEventListener("click", async () => {
      const next = document.documentElement.lang === "en" ? "fa" : "en";
      await chrome.storage.local.set({ rashnuLanguage: next });
      applyLanguage(next);
    });

    themeButton?.addEventListener("click", async () => {
      const current = document.documentElement.dataset.themeMode || "system";
      const next = themeOrder[(themeOrder.indexOf(current) + 1) % themeOrder.length];
      await chrome.storage.local.set({ rashnuThemeMode: next });
      applyTheme(next);
    });
  }

  function applyLanguage(language) {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    languageButton.textContent = translations[language].languageButton;
    setTitleAndAria(languageButton, translations[language].switchLanguage);
    setTitleAndAria(heroBrandLink, translations[language].openRepository);
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (key && translations[language][key]) {
        node.innerHTML = translations[language][key];
      }
    });
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const key = node.getAttribute("data-i18n-html");
      if (key && translations[language][key]) {
        node.innerHTML = translations[language][key];
      }
    });
    updateThemeButtonLabel(language);
  }

  function applyTheme(themeMode) {
    document.documentElement.dataset.themeMode = themeMode;
    document.documentElement.dataset.theme =
      themeMode === "system"
        ? (window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark")
        : themeMode;
    updateThemeButtonLabel(document.documentElement.lang === "en" ? "en" : "fa");
  }

  function updateThemeButtonLabel(language) {
    const themeMode = document.documentElement.dataset.themeMode || "system";
    const modeLabel =
      language === "en"
        ? { system: "System", dark: "Dark", light: "Light" }[themeMode]
        : { system: "خودکار", dark: "تیره", light: "روشن" }[themeMode];
    themeButton.textContent = `${translations[language].themeLabel}: ${modeLabel}`;
    setTitleAndAria(
      themeButton,
      `${translations[language].cycleTheme}: ${translations[language].themeLabel} ${modeLabel}`
    );
  }

  function setTitleAndAria(element, text) {
    if (!element || !text) {
      return;
    }
    element.title = text;
    element.setAttribute("aria-label", text);
  }
})();
