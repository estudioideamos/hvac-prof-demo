// HVAC PROF | Interacciones del sitio desarrolladas por Estudio Ideamos.

const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  if (reducedMotion.matches) return;
  item.classList.add('reveal-pending');
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
    if (reducedMotion.matches || document.hidden || heroSlider.matches(':focus-within')) return;
    autoplayId = window.setTimeout(() => {
      setActiveSlide(activeIndex + 1);
    }, autoplayDelay);
  };

  const setActiveSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      if (active) {
        slide.querySelectorAll('img[data-src]').forEach(img => {
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.loading = 'eager';
          img.src = img.dataset.src;
          delete img.dataset.src;
          delete img.dataset.srcset;
        });
      }
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
  reducedMotion.addEventListener('change', queueAutoplay);
  heroSlider.addEventListener('focusin', () => window.clearTimeout(autoplayId));
  heroSlider.addEventListener('focusout', () => window.setTimeout(queueAutoplay, 0));
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const statusMessage = contactForm.querySelector("[data-form-status]");
  const submitButton = contactForm.querySelector("[data-submit-button]");
  const startedAtField = contactForm.querySelector("[data-form-started-at]");

  if (startedAtField) {
    startedAtField.value = String(Math.floor(Date.now() / 1000));
  }

  const showFormStatus = (message, isError = false) => {
    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", isError);
    statusMessage.removeAttribute("hidden");
  };

  const queryStatus = new URLSearchParams(window.location.search).get("estado");
  if (queryStatus === "ok") {
    showFormStatus("Gracias. Recibimos tu consulta y te responderemos a la brevedad.");
    window.history.replaceState({}, "", `${window.location.pathname}#formulario-contacto`);
  } else if (queryStatus === "error") {
    showFormStatus("No pudimos enviar la consulta. Por favor, intentá nuevamente.", true);
    window.history.replaceState({}, "", `${window.location.pathname}#formulario-contacto`);
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      return;
    }

    statusMessage?.setAttribute("hidden", "");
    submitButton?.setAttribute("disabled", "");
    if (submitButton) {
      submitButton.textContent = "Enviando...";
    }

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      let response;
      try {
      response = await fetch(contactForm.action, {
        signal: controller.signal,
        method: "POST",
        body: new FormData(contactForm),
        headers: {
          Accept: "application/json",
        },
      });
      } finally { window.clearTimeout(timeout); }
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "No se pudo enviar la consulta.");
      }

      showFormStatus(payload.message);
      contactForm.reset();
      if (startedAtField) {
        startedAtField.value = String(Math.floor(Date.now() / 1000));
      }
    } catch (error) {
      showFormStatus(
        error instanceof Error
          ? (error.name === 'AbortError' ? 'La conexión tardó demasiado. Consultá por WhatsApp antes de reenviar.' : error.message)
          : "No pudimos enviar la consulta. Por favor, intentá nuevamente.",
        true
      );
    } finally {
      submitButton?.removeAttribute("disabled");
      if (submitButton) {
        submitButton.textContent = "Enviar consulta";
      }
    }
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
        <img alt="" />
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
    lightboxImage.removeAttribute("src");
    lightboxImage.setAttribute("alt", "");
    lightboxCaption.textContent = "";
    document.querySelector('.page-shell')?.removeAttribute('inert');
    lastFocusedElement?.focus();
  };

  const openLightbox = (image) => {
    lastFocusedElement = image;
    lightboxImage.setAttribute("src", image.getAttribute('src') || image.currentSrc);
    lightboxImage.setAttribute("alt", image.alt || "Imagen ampliada");
    lightboxCaption.textContent = image.alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton?.focus();
    document.querySelector('.page-shell')?.setAttribute('inert', '');
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
    if (event.key === 'Tab' && lightbox.classList.contains('is-open')) {
      event.preventDefault();
      closeButton?.focus();
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
