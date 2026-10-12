/* Progressive enhancement only; existing search/filter/sort/saved-guide code remains in place. */
(() => {
  "use strict";
  const init = () => {
    document.querySelectorAll("img").forEach(img => {
      if (!img.hasAttribute("decoding")) img.decoding = "async";
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight && !img.hasAttribute("loading")) img.loading = "lazy";
    });
    if (!document.documentElement.dataset.tsAffiliateTracking) {
      document.documentElement.dataset.tsAffiliateTracking = "true";
      document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");
        if (!link) return;
        const href = link.href || "";
        if (/try\.printify\.com|affiliate|ref=|utm_source=/i.test(href)) {
          const detail = { href, label: (link.textContent || "").trim().slice(0, 120) };
          window.dispatchEvent(new CustomEvent("toolscout:affiliate-click", { detail }));
          if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: "toolscout_affiliate_click", ...detail });
        }
      });
    }
    const nav = document.querySelector("header nav, .site-header nav, nav.site-nav");
    if (!nav || nav.dataset.tsEnhanced === "true") return;
    const header = nav.closest("header, .site-header") || nav.parentElement;
    if (!header || nav.querySelector("[data-ts-menu-toggle]") || header.querySelector("[data-ts-menu-toggle]")) return;
    nav.dataset.tsEnhanced = "true";
    nav.id = nav.id || "toolscout-primary-navigation";
    nav.setAttribute("aria-label", nav.getAttribute("aria-label") || "Primary");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tsMenuToggle = "true";
    button.className = "ts-menu-toggle";
    button.textContent = "Menu";
    button.setAttribute("aria-controls", nav.id);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Toggle primary navigation");
    header.insertBefore(button, nav);
    nav.dataset.tsMobileMenu = "true";
    nav.dataset.tsOpen = "false";
    const close = () => { nav.dataset.tsOpen = "false"; button.setAttribute("aria-expanded", "false"); };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      nav.dataset.tsOpen = String(open);
    });
    nav.addEventListener("click", event => { if (event.target.closest("a")) close(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
    window.addEventListener("resize", () => { if (window.matchMedia("(min-width: 761px)").matches) close(); });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
