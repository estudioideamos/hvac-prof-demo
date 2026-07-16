const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");

const syncMobileMenuState = (isOpen) => {
  if (!header || !navToggle) {
    return;
  }

  navToggle.setAttribute("aria-expanded", String(isOpen));
  header.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
};

if (navToggle && header) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    syncMobileMenuState(!expanded);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (!header || !navToggle) {
      return;
    }

    syncMobileMenuState(false);
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) {
    syncMobileMenuState(false);
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 40, 220)}ms`;
  observer.observe(item);
});

const heroSlider = document.querySelector("[data-hero-slider]");

if (heroSlider) {
  const slides = Array.from(heroSlider.querySelectorAll("[data-hero-slide]"));
  const triggers = Array.from(document.querySelectorAll("[data-hero-trigger]"));
  const prevButton = document.querySelector("[data-hero-prev]");
  const nextButton = document.querySelector("[data-hero-next]");
  const autoplayDelay = 7000;
  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let autoplayId;

  if (activeIndex < 0) {
    activeIndex = 0;
  }

  const queueAutoplay = () => {
    window.clearTimeout(autoplayId);
    autoplayId = window.setTimeout(() => {
      setActiveSlide(activeIndex + 1);
    }, autoplayDelay);
  };

  const setActiveSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
    });

    triggers.forEach((trigger, triggerIndex) => {
      const isActive = triggerIndex === activeIndex;
      trigger.classList.toggle("is-active", isActive);
      trigger.setAttribute("aria-pressed", String(isActive));
    });

    queueAutoplay();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      setActiveSlide(Number(trigger.dataset.heroTrigger));
    });
  });

  prevButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex - 1);
  });

  nextButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex + 1);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearTimeout(autoplayId);
      return;
    }

    queueAutoplay();
  });

  setActiveSlide(activeIndex);
}

const demoContactForm = document.querySelector("[data-demo-contact-form]");

if (demoContactForm) {
  const successMessage = demoContactForm.querySelector("[data-form-success]");

  demoContactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!demoContactForm.reportValidity()) {
      return;
    }

    successMessage?.removeAttribute("hidden");
    demoContactForm.reset();
  });
}
