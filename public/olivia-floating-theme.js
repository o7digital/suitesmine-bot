(() => {
  if (window.__oliviaFloatingTheme) return;
  window.__oliviaFloatingTheme = true;

  const style = document.createElement("style");
  style.textContent = `
    :is(.olivia-chat__panel,.sofia-panel,.olivia-panel,.cenote-olivia-panel,.sofia-cervantes-panel,.conchita-panel,[class*="olivia"][class*="panel"]) {
      border-radius: 26px !important;
      box-shadow: 0 46px 78px -28px rgba(0,0,0,.72),0 22px 38px -26px rgba(0,0,0,.58),inset 0 1px 0 rgba(255,255,255,.14) !important;
      transform: perspective(1200px) translateY(-6px) rotateX(.45deg) rotateY(-.45deg);
      animation: olivia-shared-float 5.5s ease-in-out infinite;
      will-change: transform;
    }
    :is(.olivia-chat__status,.sofia-status,.olivia-status,.cenote-olivia-status,.sofia-cervantes-status,.conchita-status,[class*="olivia"][class*="status"]) {
      display:inline-flex !important;align-items:center;gap:8px;width:max-content;
      border-radius:999px;padding:5px 10px;background:rgba(255,255,255,.08);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.1);
    }
    .olivia-presence-dot {width:9px;height:9px;flex:0 0 auto;border-radius:999px;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.14),0 0 14px rgba(34,197,94,.8);transition:.25s ease}
    .olivia-presence-inactive .olivia-presence-dot {background:#f59e0b;box-shadow:0 0 0 4px rgba(245,158,11,.14),0 0 14px rgba(245,158,11,.75)}
    :is(.olivia-chat__toggle,.sofia-toggle,.olivia-toggle,[class*="olivia"][class*="toggle"]) {border-radius:999px!important;box-shadow:0 24px 42px -18px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.16)!important}
    @keyframes olivia-shared-float {0%,100%{transform:perspective(1200px) translateY(-6px) rotateX(.45deg) rotateY(-.45deg)}50%{transform:perspective(1200px) translateY(-12px) rotateX(.65deg) rotateY(-.25deg)}}
    @media(prefers-reduced-motion:reduce){:is(.olivia-chat__panel,.sofia-panel,.olivia-panel,.cenote-olivia-panel,.sofia-cervantes-panel,.conchita-panel,[class*="olivia"][class*="panel"]){animation:none!important}}
  `;
  document.head.appendChild(style);

  let timer;
  const statusSelector = '.olivia-chat__status,.sofia-status,.olivia-status,.cenote-olivia-status,.sofia-cervantes-status,.conchita-status,[class*="olivia"][class*="status"]';
  const decorate = () => {
    document.querySelectorAll(statusSelector).forEach((status) => {
      if (!status.querySelector('.olivia-presence-dot')) {
        const dot = document.createElement('i');
        dot.className = 'olivia-presence-dot';
        dot.setAttribute('aria-hidden', 'true');
        status.prepend(dot);
      }
    });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest(
      '.olivia-consent a,.sofia-consent a,.conchita-consent a,[class*="consent"] a[href]',
    );
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    window.open(link.href, '_blank', 'noopener,noreferrer');
  }, true);
  const setInactive = (inactive) => {
    decorate();
    document.querySelectorAll(statusSelector).forEach((status) => status.classList.toggle('olivia-presence-inactive', inactive));
  };
  const markActive = () => {
    setInactive(false);
    clearTimeout(timer);
    timer = setTimeout(() => setInactive(true), 45000);
  };
  new MutationObserver(decorate).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
  ['pointerdown','keydown','scroll','touchstart'].forEach((event) => addEventListener(event, markActive, { passive: true }));
  markActive();
})();
