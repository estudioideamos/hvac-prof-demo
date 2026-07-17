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

const zoomableImages = Array.from(
  document.querySelectorAll(".project-gallery-media img, .union-visual img")
);

if (zoomableImages.length > 0) {
  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="image-lightbox-backdrop" data-lightbox-close></div>
    <div class="image-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
      <button class="image-lightbox-close" type="button" aria-label="Cerrar imagen ampliada" data-lightbox-close>&times;</button>
      <div class="image-lightbox-frame">
        <img src="" alt="" />
      </div>
      <p class="image-lightbox-caption"></p>
    </div>
  `;

  document.body.append(lightbox);

  const lightboxImage = lightbox.querySelector(".image-lightbox-frame img");
  const lightboxCaption = lightbox.querySelector(".image-lightbox-caption");
  const closeTargets = lightbox.querySelectorAll("[data-lightbox-close]");
  const closeButton = lightbox.querySelector(".image-lightbox-close");
  let lastFocusedElement = null;

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImage.setAttribute("src", "");
    lightboxImage.setAttribute("alt", "");
    lightboxCaption.textContent = "";
    lastFocusedElement?.focus();
  };

  const openLightbox = (image) => {
    lastFocusedElement = image;
    lightboxImage.setAttribute("src", image.currentSrc || image.src);
    lightboxImage.setAttribute("alt", image.alt || "Imagen ampliada");
    lightboxCaption.textContent = image.alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
  };

  closeTargets.forEach((target) => {
    target.addEventListener("click", closeLightbox);
  });

  lightbox.querySelector(".image-lightbox-dialog")?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  zoomableImages.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", `${image.alt || "Imagen"} - ampliar`);

    image.addEventListener("click", () => {
      openLightbox(image);
    });

    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(image);
      }
    });
  });
}
