/**
 * FoxxNuts AI Chatbot — Embeddable Widget Loader (v1)
 *
 * Usage:
 *   <script
 *     src="https://your-domain.com/widget.v1.js"
 *     data-workspace-id="YOUR_WORKSPACE_ID"
 *     data-position="bottom-right"
 *     async
 *   ></script>
 */
(function () {
  "use strict";

  if (window.__foxxnuts_widget_loaded && document.getElementById("foxxnuts-widget")) return;
  window.__foxxnuts_widget_loaded = true;

  var scriptTag =
    document.currentScript ||
    document.querySelector("script[data-workspace-id]");

  if (!scriptTag) return;

  var workspaceId = scriptTag.getAttribute("data-workspace-id");
  if (!workspaceId) return;

  var position = (scriptTag.getAttribute("data-position") || "bottom-right").toLowerCase().trim();
  var isLeft = position === "bottom-left";

  var scriptSrc = scriptTag.getAttribute("src") || "";
  var baseUrl = scriptSrc.replace(/\/widget\.v1\.js.*$/, "");
  if (!baseUrl) baseUrl = window.location.origin;

  var BUBBLE = 64;
  var M = 20;
  var isOpen = false;

  var originalHtmlOverflow = "";
  var originalBodyOverflow = "";
  var originalTouchAction = "";
  var isScrollLocked = false;

  function lockHostScroll() {
    if (isScrollLocked) return;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    originalTouchAction = document.body.style.touchAction;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    isScrollLocked = true;
  }

  function unlockHostScroll() {
    if (!isScrollLocked) return;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.touchAction = originalTouchAction;
    isScrollLocked = false;
  }

  // ── Container ─────────────────────────────────────────────────
  var el = document.createElement("div");
  el.id = "foxxnuts-widget";
  applyCollapsed();

  function syncMobileViewport() {
    if (!isOpen) return;
    var isMobile = window.innerWidth <= 640;
    if (!isMobile) return;

    var vv = window.visualViewport;
    var height = vv ? Math.round(vv.height) : (window.innerHeight || document.documentElement.clientHeight);
    var width = vv ? Math.round(vv.width) : (window.innerWidth || document.documentElement.clientWidth);
    var top = vv ? Math.round(vv.offsetTop) : 0;
    var left = vv ? Math.round(vv.offsetLeft) : 0;

    el.style.position = "fixed";
    el.style.top = top + "px";
    el.style.left = left + "px";
    el.style.bottom = "auto";
    el.style.right = "auto";
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.maxHeight = height + "px";
    el.style.borderRadius = "0px";
    el.style.boxShadow = "none";
    el.style.transition = "none";
  }

  function applyCollapsed() {
    isOpen = false;
    unlockHostScroll();
    el.style.position = "fixed";
    el.style.zIndex = "2147483647";
    el.style.border = "none";
    el.style.outline = "none";
    el.style.overflow = "hidden";
    el.style.top = "auto";
    el.style.bottom = M + "px";
    el.style.left = isLeft ? M + "px" : "auto";
    el.style.right = isLeft ? "auto" : M + "px";
    el.style.width = BUBBLE + "px";
    el.style.height = BUBBLE + "px";
    el.style.maxHeight = "none";
    el.style.borderRadius = "50%";
    el.style.background = "transparent";
    el.style.boxShadow = "none";
    el.style.transition =
      "width .3s cubic-bezier(0.16, 1, 0.3, 1), height .3s cubic-bezier(0.16, 1, 0.3, 1), top .3s cubic-bezier(0.16, 1, 0.3, 1), bottom .3s cubic-bezier(0.16, 1, 0.3, 1), border-radius .3s ease, box-shadow .3s ease";
  }

  function applyExpanded() {
    isOpen = true;
    var isMobile = window.innerWidth <= 640;
    if (isMobile) {
      lockHostScroll();
      syncMobileViewport();
    } else {
      unlockHostScroll();
      el.style.position = "fixed";
      el.style.top = "16px";
      el.style.bottom = "16px";
      el.style.left = isLeft ? "16px" : "auto";
      el.style.right = isLeft ? "auto" : "16px";
      el.style.width = "min(440px, calc(100vw - 32px))";
      el.style.height = "calc(100vh - 32px)";
      el.style.maxHeight = "calc(100vh - 32px)";
      el.style.borderRadius = "16px";
      el.style.boxShadow = "0 12px 48px rgba(0,0,0,0.35)";
      el.style.transition =
        "width .3s cubic-bezier(0.16, 1, 0.3, 1), height .3s cubic-bezier(0.16, 1, 0.3, 1), top .3s cubic-bezier(0.16, 1, 0.3, 1), bottom .3s cubic-bezier(0.16, 1, 0.3, 1), border-radius .3s ease, box-shadow .3s ease";
    }
  }

  // ── Iframe ────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/embed?workspace_id=" + encodeURIComponent(workspaceId);
  iframe.title = "FoxxNuts AI Chatbot";
  iframe.allow = "clipboard-write";
  iframe.style.cssText =
    "display:block;width:100%;height:100%;border:none;margin:0;padding:0;background:transparent;color-scheme:auto;";

  el.appendChild(iframe);

  // ── Mount ─────────────────────────────────────────────────────
  function mount() {
    document.body.appendChild(el);
  }
  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }

  var expectedOrigin = "";
  try {
    expectedOrigin = new URL(baseUrl, window.location.href).origin;
  } catch (_) {
    expectedOrigin = "";
  }

  // ── Window Viewport & Resize Handlers ─────────────────────────
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", function () {
      if (isOpen && window.innerWidth <= 640) {
        syncMobileViewport();
      }
    });
    window.visualViewport.addEventListener("scroll", function () {
      if (isOpen && window.innerWidth <= 640) {
        syncMobileViewport();
      }
    });
  }

  window.addEventListener("resize", function () {
    if (isOpen) {
      applyExpanded();
    }
  });

  window.addEventListener("scroll", function () {
    if (isOpen && window.innerWidth <= 640) {
      window.scrollTo(0, 0);
      syncMobileViewport();
    }
  }, { passive: true });

  // ── Global Controller API ──────────────────────────────────────
  window.FoxxNuts = {
    open: function () {
      applyExpanded();
      try {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "FOXXNUTS_OPEN" }, "*");
        }
      } catch (_) {}
    },
    close: function () {
      applyCollapsed();
      try {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "FOXXNUTS_CLOSE" }, "*");
        }
      } catch (_) {}
    },
    toggle: function () {
      if (isOpen) {
        window.FoxxNuts.close();
      } else {
        window.FoxxNuts.open();
      }
    },
  };

  // ── PostMessage from iframe & parent ───────────────────────────
  window.addEventListener("message", function (e) {
    try {
      if (e.data && e.data.type === "FOXXNUTS_OPEN_WIDGET") {
        window.FoxxNuts.open();
        return;
      }
      if (e.data && e.data.type === "FOXXNUTS_CLOSE_WIDGET") {
        window.FoxxNuts.close();
        return;
      }

      if (expectedOrigin && e.origin !== expectedOrigin) return;
      if (!e.data) return;

      // Dynamic position update from workspace DB config
      if (e.data.type === "SYNC_WIDGET_CONFIG" || e.data.type === "UPDATE_CONFIG") {
        if (e.data.position) {
          position = e.data.position.toLowerCase().trim();
          isLeft = position === "bottom-left";
          if (isOpen) {
            applyExpanded();
          } else {
            applyCollapsed();
          }
        }
      }

      if (e.data.type === "TOGGLE_WIDGET") {
        if (e.data.isOpen) {
          applyExpanded();
        } else {
          applyCollapsed();
        }
      }
    } catch (_) {}
  });
})();
