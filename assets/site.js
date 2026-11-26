(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- project layer ---------------- */
  const sheet = $('#sheet');
  if (sheet) {
    const panel = $('.sheet__panel', sheet);
    const scroller = $('.sheet__scroll', sheet);
    const titleEl = $('.sheet__title', sheet);
    const countEl = $('.sheet__count', sheet);
    const arts = $$('.proj', sheet);
    const slugs = arts.map(a => a.dataset.slug);
    const main = $('#main > .wrap');
    let current = null, opener = null, pushed = false;

    const show = (slug) => {
      const i = slugs.indexOf(slug);
      if (i < 0) return false;
      arts.forEach((a, k) => { a.hidden = k !== i; });
      current = i;
      const art = arts[i];
      titleEl.textContent = art.dataset.title;
      countEl.textContent = `${i + 1} / ${slugs.length}`;
      $$('[data-step="-1"]', sheet).forEach(b => { b.disabled = i === 0; });
      $$('[data-step="1"]', sheet).forEach(b => { b.disabled = i === slugs.length - 1; });
      const prev = $('.step--prev', sheet), next = $('.step--next', sheet);
      prev.hidden = i === 0; next.hidden = i === slugs.length - 1;
      if (i > 0) $('b', prev).textContent = arts[i - 1].dataset.title;
      if (i < slugs.length - 1) $('b', next).textContent = arts[i + 1].dataset.title;
      scroller.scrollTop = 0;
      sheet.classList.remove('scrolled');
      document.title = `${art.dataset.title} | 포트폴리오`;
      return true;
    };

    const open = (slug, how) => {
      if (!show(slug)) return;
      if (window.gtag) gtag('event', 'project_open', { project: slug });
      if (sheet.hidden) {
        sheet.hidden = false;
        document.body.classList.add('lock');
        if (main) main.inert = true;
        panel.focus({ preventScroll: true });
      }
      if (how === 'push') { history.pushState({ p: slug }, '', '#' + slug); pushed = true; }
      else if (how === 'replace') history.replaceState({ p: slug }, '', '#' + slug);
    };

    const hide = () => {
      if (sheet.hidden) return;
      sheet.hidden = true;
      document.body.classList.remove('lock');
      if (main) main.inert = false;
      document.title = document.title.replace(/^.* \| 포트폴리오$/, '김 미 | 포트폴리오');
      if (opener) { opener.focus({ preventScroll: true }); opener = null; }
      current = null;
    };

    const close = () => {
      if (pushed && history.state && history.state.p) { history.back(); }  // popstate가 닫음
      else { history.replaceState(null, '', location.pathname); hide(); }
      pushed = false;
    };

    const step = (d) => {
      if (current == null) return;
      const n = current + d;
      if (n < 0 || n >= slugs.length) return;
      open(slugs[n], 'replace');
    };

    document.addEventListener('click', (e) => {
      const card = e.target.closest('[data-open]');
      if (card) { e.preventDefault(); opener = card; open(card.dataset.open, 'push'); return; }
      if (e.target.closest('[data-close]')) { close(); return; }
      const st = e.target.closest('[data-step]');
      if (st && sheet.contains(st)) step(+st.dataset.step);
    });

    scroller.addEventListener('scroll', () => {
      sheet.classList.toggle('scrolled', scroller.scrollTop > 120);
    }, { passive: true });

    window.addEventListener('popstate', () => {
      const slug = decodeURIComponent(location.hash.slice(1));
      if (slug && slugs.includes(slug)) open(slug, null);
      else { pushed = false; hide(); }
    });

    document.addEventListener('keydown', (e) => {
      if (sheet.hidden || !viewer.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft' && !e.target.closest('input,textarea,video')) step(-1);
      else if (e.key === 'ArrowRight' && !e.target.closest('input,textarea,video')) step(1);
    });

    // 주소에 프로젝트가 있으면 바로 연다 (이력서의 관련 프로젝트 링크)
    const initial = decodeURIComponent(location.hash.slice(1));
    if (initial && slugs.includes(initial)) open(initial, null);
  }

  /* ---------------- image viewer ---------------- */
  const viewer = $('#viewer') || { hidden: true };
  if (viewer.nodeType) {
    const stage = $('.viewer__stage', viewer);
    const img = $('img', stage);
    const cnt = $('.viewer__count', viewer);
    const orig = $('.viewer__orig', viewer);
    let list = [], idx = 0, back = null;

    const render = () => {
      const b = list[idx];
      const w = +b.dataset.w, h = +b.dataset.h;
      img.removeAttribute('src');
      img.src = b.dataset.full;
      img.alt = $('img', b).alt;
      img.width = w; img.height = h;
      stage.classList.toggle('fit', h / w < 1.6);   // 긴 이미지는 세로 스크롤로 본다
      stage.scrollTop = 0;
      cnt.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
      orig.href = b.dataset.full;
      $$('[data-vstep]', viewer).forEach(x => { x.hidden = list.length < 2; });
    };
    const vopen = (btn) => {
      const scope = btn.closest('.proj') || document;
      list = $$('.zoom', scope); idx = list.indexOf(btn); back = btn;
      render(); viewer.hidden = false; document.body.classList.add('lock');
      $('[data-vclose]', viewer).focus();
    };
    const vclose = () => {
      viewer.hidden = true;
      if (!sheet || sheet.hidden) document.body.classList.remove('lock');
      if (back) back.focus({ preventScroll: true });
    };
    const vstep = (d) => { idx = (idx + d + list.length) % list.length; render(); };

    document.addEventListener('click', (e) => {
      const z = e.target.closest('.zoom');
      if (z) { vopen(z); return; }
      const more = e.target.closest('.more');
      if (more) { vopen($('.zoom', more.closest('.fig'))); return; }
      if (e.target.closest('[data-vclose]') || e.target === stage) { vclose(); return; }
      const vs = e.target.closest('[data-vstep]');
      if (vs) vstep(+vs.dataset.vstep);
    });
    document.addEventListener('keydown', (e) => {
      if (viewer.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); vclose(); }
      else if (e.key === 'ArrowLeft') vstep(-1);
      else if (e.key === 'ArrowRight') vstep(1);
    });
  }

  /* 인쇄나 PDF 저장 때는 경력을 모두 펼친다 */
  window.addEventListener('beforeprint', () => { $$('details.job').forEach(d => { d.dataset.wasOpen = d.open; d.open = true; }); });
  window.addEventListener('afterprint', () => { $$('details.job').forEach(d => { d.open = d.dataset.wasOpen === 'true'; }); });
})();
