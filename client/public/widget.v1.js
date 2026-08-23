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

  if (window.__foxxnuts_widget_loaded) return;
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

  // ── Container ─────────────────────────────────────────────────
  var el = document.createElement("div");
  el.id = "foxxnuts-widget";
  applyCollapsed();

  function applyCollapsed() {
    isOpen = false;
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
      el.style.position = "fixed";
      el.style.top = "0px";
      el.style.bottom = "0px";
      el.style.left = "0px";
      el.style.right = "0px";
      el.style.width = "100vw";
      el.style.height = "100vh";
      el.style.maxHeight = "100vh";
      el.style.borderRadius = "0px";
    } else {
      el.style.position = "fixed";
      el.style.top = "16px";
      el.style.bottom = "16px";
      el.style.left = isLeft ? "16px" : "auto";
      el.style.right = isLeft ? "auto" : "16px";
      el.style.width = "min(440px, calc(100vw - 32px))";
      el.style.height = "calc(100vh - 32px)";
      el.style.maxHeight = "calc(100vh - 32px)";
      el.style.borderRadius = "16px";
    }
    el.style.boxShadow = "0 12px 48px rgba(0,0,0,0.35)";
  }

  // ── Iframe ────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/embed?workspace_id=" + encodeURIComponent(workspaceId);
  iframe.title = "FoxxNuts AI Chatbot";
  iframe.allow = "clipboard-write";
  iframe.style.cssText =
    "width:100%;height:100%;border:none;background:transparent;color-scheme:auto;";

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

  // ── Window Resize Handler (Keep mobile vs desktop responsive) ─
  window.addEventListener("resize", function () {
    if (isOpen) {
      applyExpanded();
    }
  });

  // ── PostMessage from iframe ───────────────────────────────────
  window.addEventListener("message", function (e) {
    try {
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
