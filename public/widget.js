(function () {
  const script =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();
  
  const domain = script.dataset.domain || ""  
  const tenant = script.dataset.tenant || "default";
  const title = script.dataset.title || "AIアシスタント";
  const apiBase = script.dataset.apiBase || "";
  const lang = script.dataset.lang || "ja";

  const width = script.dataset.width || "380px";
  const height = script.dataset.height || "640px";

  // widget.html nằm cùng thư mục với widget.js
  const baseUrl = new URL(script.src, window.location.href);
  const widgetHtmlUrl = new URL("./widget.html", baseUrl);
  widgetHtmlUrl.searchParams.set("domain", domain);
  widgetHtmlUrl.searchParams.set("tenant", tenant);
  widgetHtmlUrl.searchParams.set("title", title);
  widgetHtmlUrl.searchParams.set("apiBase", apiBase);
  widgetHtmlUrl.searchParams.set("lang", lang);

  // container id có thể custom
  const containerId = script.dataset.containerId || "med-widget-container";
  if (document.getElementById(containerId)) return; // tránh nhúng 2 lần

  const container = document.createElement("div");
  container.id = containerId;

  // vị trí mặc định góc phải dưới
  container.style.position = "fixed";
  container.style.right = script.dataset.right || "16px";
  container.style.bottom = script.dataset.bottom || "16px";
  container.style.zIndex = "2147483647";
  container.style.fontFamily = "system-ui,-apple-system,Segoe UI,Roboto,sans-serif";

  // panel
  const panel = document.createElement("div");
  panel.style.width = width;
  panel.style.height = height;
  panel.style.boxShadow = "0 12px 32px rgba(0,0,0,.18)";
  panel.style.borderRadius = "16px";
  panel.style.overflow = "hidden";
  panel.style.background = "#fff";
  panel.style.border = "1px solid rgba(0,0,0,.08)";

  // header nhỏ với nút đóng/mở
  const header = document.createElement("div");
  header.style.height = "44px";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "0 10px 0 12px";
  header.style.borderBottom = "1px solid #eee";
  header.style.background = "#fff";

  const headerTitle = document.createElement("div");
  headerTitle.textContent = title;
  headerTitle.style.fontWeight = "700";
  headerTitle.style.fontSize = "13px";
  headerTitle.style.whiteSpace = "nowrap";
  headerTitle.style.overflow = "hidden";
  headerTitle.style.textOverflow = "ellipsis";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "×";
  btn.setAttribute("aria-label", "close");
  btn.style.width = "32px";
  btn.style.height = "32px";
  btn.style.borderRadius = "10px";
  btn.style.border = "0";
  btn.style.cursor = "pointer";
  btn.style.background = "#111";
  btn.style.color = "#fff";
  btn.style.fontSize = "18px";
  btn.style.lineHeight = "32px";

  header.appendChild(headerTitle);
  header.appendChild(btn);

  // iframe
  const iframe = document.createElement("iframe");
  iframe.src = widgetHtmlUrl.toString();
  iframe.title = title;
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.height = `calc(${height} - 44px)`;
  iframe.setAttribute("allow", "clipboard-write");

  panel.appendChild(header);
  panel.appendChild(iframe);

  // nút mở lại khi đóng
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.textContent = "💬";
  launcher.setAttribute("aria-label", "open chat");
  launcher.style.width = "52px";
  launcher.style.height = "52px";
  launcher.style.borderRadius = "16px";
  launcher.style.border = "0";
  launcher.style.cursor = "pointer";
  launcher.style.background = "#111";
  launcher.style.color = "#fff";
  launcher.style.boxShadow = "0 12px 32px rgba(0,0,0,.18)";
  launcher.style.display = "none";

  function open() {
    panel.style.display = "block";
    launcher.style.display = "none";
  }
  function close() {
    panel.style.display = "none";
    launcher.style.display = "block";
  }

  btn.addEventListener("click", close);
  launcher.addEventListener("click", open);

  container.appendChild(panel);
  container.appendChild(launcher);

  // gắn vào DOM: nếu user chỉ định container, nhét vào đó; không thì body
  const mountSelector = script.dataset.mount; // ví dụ "#someDiv"
  if (mountSelector) {
    const mount = document.querySelector(mountSelector);
    if (mount) {
      container.style.position = "relative";
      container.style.right = "auto";
      container.style.bottom = "auto";
      mount.appendChild(container);
    } else {
      document.body.appendChild(container);
    }
  } else {
    document.body.appendChild(container);
  }
})();
