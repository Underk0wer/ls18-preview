/* ═══════════════════════════════════════════════════
   LIMÓN SODA ZERO — controlador de la landing
   Dos estancias, una pantalla cada una. Sin dependencias.
   ═══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* El logo late al menos este rato antes de abrir, aunque el video ya
     esté listo: si no, en conexiones rápidas la marca ni se ve. */
  var MIN_CARGA = 1000;
  /* Duración del scroll automático hacia la estancia 2. */
  var SALTO_DUR = REDUCED ? 0 : 900;

  var video    = document.getElementById('video');
  var hero     = document.getElementById('hero');
  var loader   = document.getElementById('loader');
  var e1       = document.getElementById('e1');
  var e1Lata   = document.getElementById('e1Lata');
  var prog     = document.getElementById('prog');
  var progFill = document.getElementById('progFill');
  var hdrLogo  = document.getElementById('hdrLogo');
  var ovTitular = document.getElementById('ovTitular');

  var running = false;
  var heroTop = 0;
  var progShown = -1;

  /* Cada etiqueta entra cuando su producto aparece en el video. */
  var marcas = [].slice.call(document.querySelectorAll('.ov[data-at]')).map(function (el) {
    return { el: el, at: parseFloat(el.dataset.at), on: false };
  });

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  function measure() { heroTop = hero.offsetTop; }


  /* ─────────── 1. Fuente: tamaño y códec ─────────── */

  function pickCodec() {
    var v = document.createElement('video');
    var hevc = v.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"')
            || v.canPlayType('video/mp4; codecs="hvc1"');
    return hevc === 'probably' ? 'hevc' : 'h264';
  }

  /* El video se elige por la forma de la pantalla, con el mismo umbral
     que usa el CSS para el layout vertical (max-aspect-ratio: 4/5). Antes
     dependía del tamaño en píxeles y por eso los teléfonos, que son
     grandes en píxeles, recibían el video apaisado. */
  function esVertical() {
    return (window.innerWidth / window.innerHeight) < 0.8;
  }

  function pickSource() {
    var base = esVertical() ? 'assets/video/hero-mobile' : 'assets/video/hero';
    return base + '.' + CODEC + '.mp4';
  }

  var CODEC = pickCodec();
  video.src = pickSource();
  video.load();

  var fellBack = false;
  video.addEventListener('error', function () {
    if (!fellBack && CODEC !== 'h264') {
      fellBack = true;
      CODEC = 'h264';
      video.src = pickSource();
      video.load();
      return;
    }
    ready();   /* ya no hay a qué caer: no dejar la página trabada */
  });


  /* ─────────── 2. Pantalla de carga ─────────── */

  document.documentElement.style.overflow = 'hidden';

  var loaded = false;
  var T0 = Date.now();

  function ready() {
    if (loaded) return;
    loaded = true;
    setTimeout(function () { enElMinimo(abrirCortina); },
               Math.max(0, MIN_CARGA - (Date.now() - T0)));
  }

  /* La apertura arranca justo cuando el latido toca su punto más bajo
     (escala 1), que es donde empieza el crecimiento: así el logo pasa de
     latir a crecer sin ningún salto. Se lee el reloj real de la animación
     en vez de suponerlo, porque el CSS y este script no arrancan a la vez. */
  function enElMinimo(cb) {
    var logo = document.querySelector('.loader__logo');
    var anim = logo && logo.getAnimations ? logo.getAnimations()[0] : null;
    if (!anim || !anim.effect) { cb(); return; }

    var ciclo = anim.effect.getTiming().duration;
    if (!ciclo || typeof anim.currentTime !== 'number') { cb(); return; }

    var enCiclo = anim.currentTime % ciclo;      /* el mínimo está en 0 */
    setTimeout(cb, enCiclo < 12 ? 0 : ciclo - enCiclo);
  }

  /* El logo crece desde su O mientras el iris se abre a la par, así el
     agujero parece salir de la propia letra. */
  function abrirCortina() {
    loader.classList.add('is-out');
    document.documentElement.style.overflow = '';
    measure();
    running = true;
    requestAnimationFrame(bucle);

    /* La estancia 1 arranca cuando el agujero ya deja verla */
    setTimeout(function () { e1.classList.add('is-on'); }, 360);

    setTimeout(function () {
      loader.hidden = true;
      loader.classList.add('is-done');
      loader.setAttribute('aria-hidden', 'true');
    }, 1250);
  }

  /* Con el video en reproducción basta con que haya buffer para arrancar:
     ya no hace falta tenerlo entero, como sí exigía el scrub. */
  video.addEventListener('canplaythrough', ready);
  video.addEventListener('loadeddata', function () {
    if (video.readyState >= 3) ready();
  });
  setTimeout(function () { if (video.readyState >= 2) ready(); }, 6000);
  setTimeout(ready, 12000);


  /* ─────────── 3. Desbloqueo iOS ─────────── */
  /* Safari en iOS no reproduce sin un gesto previo, aunque esté en silencio. */

  var EVTS = ['touchstart', 'pointerdown', 'click', 'wheel', 'keydown'];
  var unlocked = false;

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
    EVTS.forEach(function (e) { window.removeEventListener(e, unlock); });
  }
  EVTS.forEach(function (e) { window.addEventListener(e, unlock, { passive: true }); });


  /* ─────────── 4. El video corre al entrar en pantalla ─────────── */

  function reproducir() {
    if (video.ended) { try { video.currentTime = 0; } catch (e) {} }
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  if ('IntersectionObserver' in window) {
    /* El video arranca en cuanto la estancia asoma... */
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) reproducir(); else video.pause();
        /* En vertical el pie sólo acompaña a la estancia 2 */
        document.body.classList.toggle('en-e2', e.isIntersecting);
      });
    }, { threshold: 0.35 }).observe(hero);

    /* ...pero el titular espera a que la estancia esté de verdad en
       pantalla. Con un umbral bajo su entrada ocurriría a mitad del
       desplazamiento y se perdería antes de llegar. */
    new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) ovTitular.classList.add('is-on');
      });
    }, { threshold: 0.92 }).observe(hero);
  } else {
    video.addEventListener('canplay', reproducir);
    ovTitular.classList.add('is-on');
  }

  /* ─────────── 5. Bucle de pantalla ─────────── */

  function bucle() {
    /* Barra de progreso: mide el documento completo, o sea las dos
       estancias. Se toca el DOM sólo cuando cambia el entero. */
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? Math.round(clamp(window.scrollY / docH, 0, 1) * 100) : 0;
    if (pct !== progShown) {
      progShown = pct;
      progFill.style.transform = 'scaleY(' + (pct / 100) + ')';
      prog.setAttribute('aria-valuenow', pct);
    }

    /* La lata crece un poco al avanzar el scroll: gana presencia sin
       moverse de sitio. La pulsación va en la capa de dentro. */
    if (e1Lata) {
      var e1p = clamp(window.scrollY / Math.max(1, e1.offsetHeight), 0, 1);
      e1Lata.style.transform = 'scale(' + (1 + e1p * 0.09).toFixed(4) + ')';
    }

    /* Etiquetas: siguen el tiempo de reproducción del video. */
    var t = video.currentTime;
    for (var i = 0; i < marcas.length; i++) {
      var m = marcas[i];
      var vis = t >= m.at;
      if (vis !== m.on) {
        m.on = vis;
        m.el.classList.toggle('is-on', vis);
      }
    }

    if (saltando) pasoSalto();

    requestAnimationFrame(bucle);
  }


  /* ─────────── 6. Salto a la estancia 2 ─────────── */

  var saltando = false, saltoDe = 0, saltoA = 0, saltoT0 = 0;

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  /* Primer scroll hacia abajo estando en la estancia 1: en vez de dejar
     que se recorra a mano, baja entera hasta la estancia 2. */
  function quizaSaltar(dir) {
    if (saltando || !running) return;
    if (dir <= 0) return;
    if (window.scrollY >= heroTop - 2) return;

    if (!SALTO_DUR) { window.scrollTo(0, heroTop); return; }
    saltando = true;
    saltoDe = window.scrollY;
    saltoA  = heroTop;
    saltoT0 = 0;
  }

  function pasoSalto() {
    var now = performance.now();
    if (!saltoT0) saltoT0 = now;
    var e = Math.min((now - saltoT0) / SALTO_DUR, 1);
    window.scrollTo(0, Math.round(saltoDe + (saltoA - saltoDe) * easeOutCubic(e)));
    if (e >= 1) { saltando = false; lastY = window.scrollY; }
  }

  var lastY = 0, scrollDir = 1;

  window.addEventListener('wheel', function (e) {
    if (e.deltaY > 0) scrollDir = 1;
    else if (e.deltaY < 0) scrollDir = -1;
    quizaSaltar(scrollDir);
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || k === 'End' || k === ' ') quizaSaltar(1);
  });

  window.addEventListener('touchend', function () { quizaSaltar(scrollDir); }, { passive: true });

  window.addEventListener('scroll', function () {
    if (saltando) return;
    var y = window.scrollY;
    if (y > lastY) scrollDir = 1; else if (y < lastY) scrollDir = -1;
    lastY = y;
    quizaSaltar(scrollDir);
  }, { passive: true });


  /* ─────────── 7. Ventana del comercial ─────────── */

  /* ID del comercial en YouTube. Para cambiarlo, basta esta línea. */
  var YT_ID = '-eMA40Wb5Ek';
  var YT_SRC = 'https://www.youtube-nocookie.com/embed/' + YT_ID +
               '?autoplay=1&rel=0&modestbranding=1&playsinline=1';

  var lb      = document.getElementById('lb');
  var lbVideo = document.getElementById('lbVideo');
  var lbClose = document.getElementById('lbClose');
  var abrirLb = document.getElementById('verComercial');
  var scrollGuardado = 0;

  function abrir() {
    scrollGuardado = window.scrollY;
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    document.documentElement.style.overflow = 'hidden';
    lbClose.focus();
    lbVideo.src = YT_SRC;
    video.pause();          /* que no suenen los dos a la vez */
  }

  function cerrar() {
    lb.classList.remove('is-open');
    lbVideo.src = '';          /* corta la reproducción y libera el reproductor */
    document.documentElement.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 350);
    abrirLb.focus();
    window.scrollTo(0, scrollGuardado);
  }

  if (abrirLb) {
    abrirLb.addEventListener('click', abrir);
    lbClose.addEventListener('click', cerrar);
    lb.addEventListener('click', function (e) { if (e.target === lb) cerrar(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hidden) cerrar();
    });
  }


  /* ─────────── 8. Logo animado (carga diferida) ─────────── */

  var logoImg = hdrLogo.querySelector('img');
  var animSrc = logoImg.dataset.anim;
  if (animSrc) {
    var pre = new Image();
    pre.onload = function () { logoImg.src = animSrc; };
    pre.src = animSrc;
  }


  /* ─────────── 9. Resize ─────────── */

  var resizeTO;
  window.addEventListener('resize', function () {
    measure();
    clearTimeout(resizeTO);
    resizeTO = setTimeout(function () {
      measure();
      var want = pickSource();
      if (video.src.indexOf(want) === -1) {
        var t = video.currentTime;
        var corria = !video.paused;
        video.src = want;
        video.load();
        video.addEventListener('loadedmetadata', function once() {
          video.removeEventListener('loadedmetadata', once);
          try { video.currentTime = t; } catch (e) {}
          if (corria) reproducir();
        });
      }
    }, 300);
  }, { passive: true });

  window.addEventListener('orientationchange', measure);

})();
