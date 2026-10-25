/* Av Akanksh — portfolio behaviour.
   Three things: the volatility-surface figure, nav position, and the résumé picker. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Implied volatility surface.

     A wireframe of sigma(k, T) over log-moneyness k and maturity T, drawn in
     isometric projection and coloured by level: cool blue through to amber.
     The shape is the familiar one — a pronounced smile at short maturity that
     flattens out along the term structure, with a negative skew. Synthetic, not
     market data; it is here because it is the object the thesis forecasts.
     ---------------------------------------------------------------------- */

  function surface(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var NK = 22;          // grid steps in log-moneyness
    var NT = 16;          // grid steps in maturity
    var K_MAX = 0.95;
    var T_MIN = 0.08;
    var T_MAX = 1.5;

    var w = 0, h = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.width * 0.86;
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* sigma(k, T) — level, skew and curvature all decay along maturity. */
    function sigma(k, t, phase) {
      var level = 0.17 + 0.035 * Math.sin(phase) + 0.05 / (t + 0.55);
      var curv = 0.3 / (t + 0.3);
      var skew = (0.17 + 0.05 * Math.cos(phase * 0.8)) / Math.sqrt(t + 0.25);
      return level + curv * k * k - skew * k;
    }

    /* Blue -> sea green -> amber, matching the scale swatch in the figure.
       Takes a value already normalised to [0, 1] across the surface. */
    function ramp(v) {
      v = Math.max(0, Math.min(1, v));
      var stops = [
        [0.00, 72, 132, 190],
        [0.38, 95, 168, 180],
        [0.66, 173, 180, 120],
        [1.00, 242, 181, 68]
      ];
      for (var i = 1; i < stops.length; i++) {
        if (v <= stops[i][0] || i === stops.length - 1) {
          var a = stops[i - 1], b = stops[i];
          var f = (v - a[0]) / (b[0] - a[0] || 1);
          f = Math.max(0, Math.min(1, f));
          return [
            Math.round(a[1] + (b[1] - a[1]) * f),
            Math.round(a[2] + (b[2] - a[2]) * f),
            Math.round(a[3] + (b[3] - a[3]) * f)
          ];
        }
      }
      return [242, 181, 68];
    }

    function rgba(c, a) {
      return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
    }

    function draw(phase) {
      ctx.clearRect(0, 0, w, h);
      if (w < 2) return;

      /* Sample the surface, then normalise: the smile is far taller at the short
         end than the long end, so a fixed vertical scale either clips or flattens. */
      var raw = [], lo = Infinity, hi = -Infinity;
      for (var j = 0; j <= NT; j++) {
        raw[j] = [];
        var t = T_MIN + (T_MAX - T_MIN) * (j / NT);
        for (var i = 0; i <= NK; i++) {
          var k = -K_MAX + 2 * K_MAX * (i / NK);
          var z = sigma(k, t, phase);
          raw[j][i] = z;
          if (z < lo) lo = z;
          if (z > hi) hi = z;
        }
      }
      var span = (hi - lo) || 1;

      var sx = w * 0.0205;
      var sy = w * 0.0098;
      var sz = w * 0.40;
      var FLOOR = -0.07;

      /* Model space first: isometric x/y with no attempt to centre. */
      function model(i, j, n) {
        var u = i - NK / 2;
        var v = j - NT / 2;
        return [(u - v) * sx, (u + v) * sy - n * sz];
      }

      var pts = [], ns = [];
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      function track(p) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }

      for (var j1 = 0; j1 <= NT; j1++) {
        pts[j1] = [];
        ns[j1] = [];
        for (var i1 = 0; i1 <= NK; i1++) {
          var n = (raw[j1][i1] - lo) / span;
          ns[j1][i1] = n;
          var mp = model(i1, j1, n);
          pts[j1][i1] = mp;
          track(mp);
        }
      }
      // The floor plane sits below the surface and widens the box.
      track(model(0, 0, FLOOR));
      track(model(NK, 0, FLOOR));
      track(model(0, NT, FLOOR));
      track(model(NK, NT, FLOOR));

      /* Then fit that box into the canvas, uniformly, with a margin. */
      var pad = 18;
      var bw = (maxX - minX) || 1;
      var bh = (maxY - minY) || 1;
      var fit = Math.min((w - pad * 2) / bw, (h - pad * 2) / bh);
      var offX = (w - bw * fit) / 2 - minX * fit;
      var offY = (h - bh * fit) / 2 - minY * fit;

      function screen(p) { return [p[0] * fit + offX, p[1] * fit + offY]; }

      for (var j2a = 0; j2a <= NT; j2a++) {
        for (var i2a = 0; i2a <= NK; i2a++) {
          pts[j2a][i2a] = screen(pts[j2a][i2a]);
        }
      }
      function project(i, j, n) { return screen(model(i, j, n)); }

      // Floor grid, a quiet reference plane under the surface.
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(34, 50, 64, 0.8)";
      for (var jj = 0; jj <= NT; jj += 4) {
        ctx.beginPath();
        for (var ii = 0; ii <= NK; ii++) {
          var fp = project(ii, jj, FLOOR);
          ii ? ctx.lineTo(fp[0], fp[1]) : ctx.moveTo(fp[0], fp[1]);
        }
        ctx.stroke();
      }
      for (var ii2 = 0; ii2 <= NK; ii2 += 4) {
        ctx.beginPath();
        for (var jj2 = 0; jj2 <= NT; jj2++) {
          var fp2 = project(ii2, jj2, FLOOR);
          jj2 ? ctx.lineTo(fp2[0], fp2[1]) : ctx.moveTo(fp2[0], fp2[1]);
        }
        ctx.stroke();
      }

      // Surface, far maturity first so near rows overdraw far ones.
      for (var j2 = NT; j2 >= 0; j2--) {
        if (j2 < NT) {
          for (var i3 = 0; i3 < NK; i3++) {
            var a = pts[j2][i3], b = pts[j2][i3 + 1];
            var c = pts[j2 + 1][i3 + 1], d = pts[j2 + 1][i3];
            var nc = (ns[j2][i3] + ns[j2][i3 + 1] + ns[j2 + 1][i3] + ns[j2 + 1][i3 + 1]) / 4;
            ctx.fillStyle = rgba(ramp(nc), 0.13);
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
            ctx.lineTo(c[0], c[1]);
            ctx.lineTo(d[0], d[1]);
            ctx.closePath();
            ctx.fill();
          }
        }

        // The smile for this maturity, coloured segment by segment so the
        // wings read hot and the trough reads cold.
        var alpha = 0.34 + 0.52 * (1 - j2 / NT);
        ctx.lineWidth = j2 % 4 === 0 ? 1.5 : 1;
        for (var i4 = 0; i4 < NK; i4++) {
          var p0 = pts[j2][i4], p1 = pts[j2][i4 + 1];
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.lineTo(p1[0], p1[1]);
          ctx.strokeStyle = rgba(ramp((ns[j2][i4] + ns[j2][i4 + 1]) / 2), alpha);
          ctx.stroke();
        }
      }

      // Term-structure ribs across maturity.
      ctx.lineWidth = 1;
      for (var i5 = 0; i5 <= NK; i5 += 2) {
        for (var j5 = 0; j5 < NT; j5++) {
          var r0 = pts[j5][i5], r1 = pts[j5 + 1][i5];
          ctx.beginPath();
          ctx.moveTo(r0[0], r0[1]);
          ctx.lineTo(r1[0], r1[1]);
          ctx.strokeStyle = rgba(ramp((ns[j5][i5] + ns[j5 + 1][i5]) / 2), 0.26);
          ctx.stroke();
        }
      }

      // The at-the-money ridge, the one line worth picking out.
      var atm = Math.round(NK / 2);
      ctx.beginPath();
      for (var j6 = 0; j6 <= NT; j6++) {
        var sp = pts[j6][atm];
        j6 ? ctx.lineTo(sp[0], sp[1]) : ctx.moveTo(sp[0], sp[1]);
      }
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = "rgba(242, 181, 68, 0.92)";
      ctx.stroke();
    }

    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      draw(((ts - start) / 1000) * 0.14);
      raf = window.requestAnimationFrame(frame);
    }

    var raf = null;
    function startLoop() {
      if (reduceMotion) { draw(0.6); return; }
      if (raf === null) raf = window.requestAnimationFrame(frame);
    }
    function stopLoop() {
      if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; start = null; }
    }

    resize();
    draw(0.6);

    var ro = window.ResizeObserver ? new ResizeObserver(function () {
      resize();
      if (reduceMotion || raf === null) draw(0.6);
    }) : null;
    if (ro) ro.observe(canvas.parentNode);
    else window.addEventListener("resize", function () { resize(); draw(0.6); });

    // Only animate while the figure is actually on screen.
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? startLoop() : stopLoop();
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      startLoop();
    }

    document.addEventListener("visibilitychange", function () {
      document.hidden ? stopLoop() : startLoop();
    });
  }

  /* ----------------------------------------------------------------------
     Nav position — marks the section you are reading.
     ---------------------------------------------------------------------- */

  function scrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
    if (!links.length || !window.IntersectionObserver) return;

    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute("data-spy")); })
      .filter(Boolean);

    var visible = {};

    function paint() {
      var current = null;
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) { current = sections[i].id; break; }
      }
      links.forEach(function (a) {
        if (a.getAttribute("data-spy") === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      paint();
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ----------------------------------------------------------------------
     Résumé picker — swaps the preview and the download target.
     ---------------------------------------------------------------------- */

  function resumePicker() {
    var root = document.querySelector("[data-resumes]");
    if (!root) return;

    var buttons = Array.prototype.slice.call(root.querySelectorAll(".variant"));
    /* Browsers without a built-in PDF viewer (most on mobile) would render an
       empty rectangle, so offer them the link instead. */
    var canPreview = navigator.pdfViewerEnabled !== false;
    var frame = root.querySelector("[data-resume-frame]");
    var download = root.querySelector("[data-resume-download]");
    var caption = root.querySelector("[data-resume-caption]");
    var loaded = false;

    function fallback(file, label) {
      var p = document.createElement("p");
      p.className = "preview-fallback";
      p.appendChild(document.createTextNode("This browser does not show PDFs inline. "));
      var a = document.createElement("a");
      a.href = file;
      a.textContent = "Open the " + label.toLowerCase() + " résumé";
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
      p.appendChild(a);
      return p;
    }

    function select(btn, loadPreview) {
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var file = btn.getAttribute("data-file");
      if (download) download.setAttribute("href", file);
      if (caption) caption.textContent = btn.getAttribute("data-caption") || "";
      if (frame && loadPreview) {
        var label = btn.getAttribute("data-caption") || "Résumé";
        frame.innerHTML = "";

        if (canPreview) {
          /* <object> rather than <iframe> so a failed load is not a blank box. */
          var obj = document.createElement("object");
          obj.setAttribute("type", "application/pdf");
          obj.setAttribute("data", file + "#view=FitH&toolbar=0");
          obj.setAttribute("aria-label", label + " preview");
          obj.appendChild(fallback(file, label));
          frame.appendChild(obj);
        } else {
          frame.appendChild(fallback(file, label));
        }
        loaded = true;
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { select(b, true); });
    });

    var initial = root.querySelector('.variant[aria-pressed="true"]') || buttons[0];
    if (initial) select(initial, false);

    // The PDF itself only loads once the section is in view.
    if (frame && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !loaded) {
          select(root.querySelector('.variant[aria-pressed="true"]') || buttons[0], true);
          io.disconnect();
        }
      }, { rootMargin: "200px" });
      io.observe(root);
    } else if (frame && initial) {
      select(initial, true);
    }
  }

  function init() {
    var canvas = document.getElementById("vol-surface");
    if (canvas) surface(canvas);
    scrollspy();
    resumePicker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
