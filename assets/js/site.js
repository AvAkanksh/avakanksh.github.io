/* Av Akanksh — motion and the résumé picker.
   Every animation uses gsap.from(), so the page renders complete without JS
   and nothing is ever invisible by default. */

(function () {
  "use strict";

  /* ---------------------------------------------------------------- résumés */

  function resumePicker() {
    var root = document.querySelector("[data-resumes]");
    if (!root) return;

    var buttons = Array.prototype.slice.call(root.querySelectorAll(".variant"));
    var frame = root.querySelector("[data-resume-frame]");
    var download = root.querySelector("[data-resume-download]");
    var caption = root.querySelector("[data-resume-caption]");
    /* Browsers with no built-in PDF viewer would show an empty box. */
    var canPreview = navigator.pdfViewerEnabled !== false;
    var loaded = false;

    function fallback(file, label) {
      var p = document.createElement("p");
      p.className = "preview-fallback";
      p.appendChild(document.createTextNode("This browser does not show PDFs inline. "));
      var a = document.createElement("a");
      a.href = file;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Open the " + label.toLowerCase() + " résumé";
      p.appendChild(a);
      return p;
    }

    function select(btn, loadPreview) {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var file = btn.getAttribute("data-file");
      var label = btn.getAttribute("data-label") || "Résumé";
      if (download) download.setAttribute("href", file);
      if (caption) caption.textContent = btn.getAttribute("data-caption") || "";
      if (!frame || !loadPreview) return;

      frame.innerHTML = "";
      if (canPreview) {
        var obj = document.createElement("object");
        obj.setAttribute("type", "application/pdf");
        obj.setAttribute("data", file + "#view=FitH&toolbar=0");
        obj.setAttribute("aria-label", label + " résumé preview");
        obj.appendChild(fallback(file, label));
        frame.appendChild(obj);
      } else {
        frame.appendChild(fallback(file, label));
      }
      loaded = true;
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { select(b, true); });
    });

    var initial = root.querySelector('.variant[aria-pressed="true"]') || buttons[0];
    if (initial) select(initial, false);

    if (frame && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !loaded) {
          select(root.querySelector('.variant[aria-pressed="true"]') || buttons[0], true);
          io.disconnect();
        }
      }, { rootMargin: "300px" });
      io.observe(root);
    } else if (frame && initial) {
      select(initial, true);
    }
  }

  /* ------------------------------------------------------------------ motion */

  function motion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);

    var mm = gsap.matchMedia();

    /* Reduced motion: no animation at all. The DOM is already in its final
       state, so there is nothing to reveal. */
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      var splits = [];

      /* 1 — the name, split to characters. Short headline only. */
      var name = document.querySelector("[data-split]");
      if (name && window.SplitText) {
        var split = new SplitText(name, { type: "chars" });
        splits.push(split);
        gsap.from(split.chars, {
          opacity: 0,
          yPercent: 110,
          rotateX: -40,
          duration: 0.7,
          stagger: 0.015,
          ease: "expo.out"
        });
      }

      /* 2 — the one pinned, scrub-driven section: the hero. */
      var hero = document.querySelector(".hero");
      if (hero && window.matchMedia("(min-width: 56rem)").matches) {
        gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "+=120%",
            scrub: 1,
            pin: true,
            pinSpacing: true
          }
        })
          .to(".hero-name", { yPercent: -18, opacity: 0.12, ease: "none" }, 0)
          .to(".hero-figure", { yPercent: 34, ease: "none" }, 0)
          .to(".hero-meta", { yPercent: -8, opacity: 0.2, ease: "none" }, 0);
      }

      /* 3 — section headings wipe up behind their own rule. */
      gsap.utils.toArray(".section-head").forEach(function (el) {
        gsap.from(el.querySelector("h2"), {
          yPercent: 108,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
      });

      /* 4 — staggered reveals, scoped per container, max ~8 children. */
      gsap.utils.toArray("[data-reveal]").forEach(function (el) {
        var kids = el.children.length && el.children.length <= 9 ? el.children : el;
        gsap.from(kids, {
          opacity: 0,
          y: 26,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 86%" }
        });
      });

      /* 5 — metric numbers count in. */
      gsap.utils.toArray(".metric-value").forEach(function (el) {
        gsap.from(el, {
          yPercent: 60,
          opacity: 0,
          duration: 0.6,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%" }
        });
      });

      return function () {
        /* Restore the original text nodes for screen readers. */
        splits.forEach(function (s) { s.revert(); });
      };
    });

    /* Pinning depends on final layout: recalculate once webfonts and images
       have settled, or the hero pins against the wrong height. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  function init() {
    resumePicker();
    motion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
