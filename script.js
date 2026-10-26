const WHATSAPP_NUMBER = "573235276719";
const MENSAJE_BASE = "Hola Ayura 👋 Quiero más información sobre Omnilife y Seytú.";

/* ---------- Tema ---------- */
const root = document.documentElement;
const THEME_KEY = "ayura-theme";
(function () {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wa = (msg) => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg || MENSAJE_BASE);

  /* Enlaces de WhatsApp y año del pie */
  $$("a.wa").forEach((a) => { a.href = wa(a.dataset.msg); });
  $("#anio").textContent = new Date().getFullYear();

  /* ---------- Botón de tema ---------- */
  const themeBtn = $("#theme");
  const themeMeta = $('meta[name="theme-color"]');
  const paintTheme = () => {
    const dark = root.dataset.theme === "dark";
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    if (themeMeta) themeMeta.content = dark ? "#14112a" : "#fcfaf4";
  };
  paintTheme();
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch (e) {}
    paintTheme();
  });

  /* ---------- Menú móvil ---------- */
  const burger = $("#burger"), menu = $("#menu");
  const setMenu = (open) => {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    burger.textContent = open ? "✕" : "☰";
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") setMenu(false); });

  /* ---------- Hero: "Quiero cuidarme" / "Quiero emprender" ---------- */
  const pathBtns = $$(".switch button");
  pathBtns.forEach((btn) => btn.addEventListener("click", () => {
    pathBtns.forEach((b) => b.setAttribute("aria-pressed", b === btn));
    $$("[data-for]").forEach((el) => { el.hidden = el.dataset.for !== btn.dataset.path; });
  }));

  /* ---------- Productos: filtros ---------- */
  const filterBtns = $$(".filters button");
  filterBtns.forEach((btn) => btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", b === btn));
    $$(".product").forEach((p) => {
      p.hidden = btn.dataset.f !== "todos" && p.dataset.brand !== btn.dataset.f;
    });
  }));

  /* ---------- Productos: lista "Me interesa" a mensaje de WhatsApp ---------- */
  const picked = new Set();
  const tray = $("#tray");
  const renderTray = () => {
    const names = [...picked];
    tray.hidden = names.length === 0;
    document.body.classList.toggle("has-tray", names.length > 0);
    $("#tray-text").textContent = names.length + (names.length === 1 ? " producto elegido: " : " productos elegidos: ") + names.join(", ");
    $("#tray-cta").href = wa("Hola Ayura. Me interesa recibir información de: " + names.join(", ") + ".");
  };
  const setPick = (btn, on) => {
    btn.setAttribute("aria-pressed", on);
    btn.closest(".product").classList.toggle("picked", on);
    $(".pick-label", btn).textContent = on ? "Agregado ✓" : "Me interesa";
  };
  $$(".pick").forEach((btn) => btn.addEventListener("click", () => {
    const name = btn.closest(".product").dataset.name;
    const on = !picked.has(name);
    on ? picked.add(name) : picked.delete(name);
    setPick(btn, on);
    renderTray();
  }));
  $("#tray-clear").addEventListener("click", () => {
    picked.clear();
    $$(".pick").forEach((btn) => setPick(btn, false));
    renderTray();
  });

  /* ---------- Formulario de contacto a WhatsApp ---------- */
  const form = $("#form"), err = $("#err");
  form.nombre.addEventListener("input", () => {
    err.hidden = true;
    form.nombre.removeAttribute("aria-invalid");
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    if (!nombre) {
      err.hidden = false;
      form.nombre.setAttribute("aria-invalid", "true");
      form.nombre.focus();
      return;
    }
    const pais = form.pais.value.trim();
    const mensaje = form.mensaje.value.trim();
    const texto = "Hola Ayura. Soy " + nombre + (pais ? " de " + pais : "") +
      ". Me interesa: " + form.interes.value + "." + (mensaje ? " " + mensaje : "");
    window.open(wa(texto), "_blank", "noopener");
  });
});
