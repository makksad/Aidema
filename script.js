(function () {
  "use strict";

  const WHATSAPP_NUMBER = "+996503455154";
  const state = {
    query: "",
    category: "all",
    brand: "all"
  };
  const selectedColorByProduct = new Map();

  const elements = {};

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(value) + " сом";
  }

  function getSelectedColor(product) {
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const selectedColorId = selectedColorByProduct.get(String(product.id));

    return colors.find((color) => color.id === selectedColorId) || colors[0] || null;
  }

  function getProductImage(product) {
    const selectedColor = getSelectedColor(product);
    const colorImage = selectedColor && product.imagesByColor
      ? product.imagesByColor[selectedColor.id]
      : null;

    return colorImage || product.image;
  }

  function makeWhatsAppUrl(product) {
    const selectedColor = product ? getSelectedColor(product) : null;
    const message = product
      ? `Здравствуйте! Хочу заказать товар:\nНазвание: ${product.name}\nБренд: ${product.brand}\nЦвет: ${selectedColor ? selectedColor.name : "Не указан"}\nЦена: ${formatPrice(product.price)}\nКатегория: ${product.categoryLabel || product.category}`
      : "Здравствуйте! Хочу узнать подробнее о посуде AIDEMA. Помогите, пожалуйста, подобрать подходящий вариант.";

    const phone = WHATSAPP_NUMBER.replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function makeBadge(label) {
    const className = label === "Акция" ? " badge-sale" : label === "Хит" ? " badge-hit" : "";
    return `<span class="badge${className}">${escapeHtml(label)}</span>`;
  }

  function getProductBadges(product) {
    return (product.badges || [])
      .filter((badge) => badge === "Хит" || badge === "Акция")
      .slice(0, 2);
  }

  function safeColor(value) {
    return /^#[0-9a-f]{3,8}$/i.test(String(value || "")) ? value : "#d8d2cc";
  }

  function renderColorSwatches(product, showAll) {
    const colors = Array.isArray(product.colors) ? product.colors : [];
    if (!colors.length) return "";

    const limit = showAll ? colors.length : 4;
    const visibleColors = colors.slice(0, limit);
    const hiddenCount = colors.length - visibleColors.length;
    const selectedColor = getSelectedColor(product);

    return `
      <div class="product-colors" aria-label="Доступные цвета">
        <div class="color-dots">
          ${visibleColors.map((color) => `
            <button class="color-swatch${selectedColor && selectedColor.id === color.id ? " is-active" : ""}" type="button" data-color-option data-product-id="${product.id}" data-color-id="${escapeHtml(color.id)}" style="--swatch-color: ${safeColor(color.hex)}" title="${escapeHtml(color.name)}" aria-label="Выбрать цвет: ${escapeHtml(color.name)}" aria-pressed="${selectedColor && selectedColor.id === color.id}"></button>`).join("")}
        </div>
        ${hiddenCount > 0 ? `<span class="more-colors">+${hiddenCount} цветов</span>` : ""}
      </div>`;
  }

  function renderSpecifications(product) {
    const specs = Array.isArray(product.specs) ? product.specs : [];
    if (!specs.length) return "";

    return `
      <section class="dialog-section" aria-labelledby="dialog-specifications-title">
        <h3 id="dialog-specifications-title">Характеристики</h3>
        <dl class="specifications-list">
          ${specs.map((item) => `
            <div>
              <dt>${escapeHtml(item.label)}</dt>
              <dd>${escapeHtml(item.value)}</dd>
            </div>`).join("")}
        </dl>
      </section>`;
  }

  function createProductCard(product) {
    const badges = getProductBadges(product).map(makeBadge).join("");

    const oldPrice = product.oldPrice
      ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>`
      : "";

    const buttonLabel = product.inStock ? "Заказать в WhatsApp" : "Уточнить в WhatsApp";
    const stockLabel = product.inStock ? "В наличии" : "Под заказ";
    const stockClass = product.inStock ? "is-available" : "is-order";

    return `
      <article class="product-card" data-product-card data-product-id="${product.id}" aria-labelledby="product-title-${product.id}">
        <div class="product-media">
          <img data-product-image data-product-id="${product.id}" src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(product.imageAlt || product.name)}" loading="lazy" width="520" height="520">
          ${badges ? `<div class="product-badges">${badges}</div>` : ""}
        </div>
        <div class="product-content">
          <div class="product-meta">
            <p class="product-brand">${escapeHtml(product.brand)}</p>
            <p class="product-category">${escapeHtml(product.categoryLabel)}</p>
          </div>
          <h3 id="product-title-${product.id}">${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description)}</p>
          ${renderColorSwatches(product, false)}
          <div class="product-footer">
            <div class="product-price-row">
              <p class="product-price">
                <span>${formatPrice(product.price)}</span>
                ${oldPrice}
              </p>
              <span class="stock-status ${stockClass}"><i aria-hidden="true"></i>${stockLabel}</span>
            </div>
            <div class="product-actions">
              <button class="details-link" type="button" aria-label="Подробнее о товаре: ${escapeHtml(product.name)}">
                <span>Подробнее</span>
                <span aria-hidden="true">→</span>
              </button>
              <a class="whatsapp-button" data-whatsapp-action data-product-id="${product.id}" href="${makeWhatsAppUrl(product)}" target="_blank" rel="noopener noreferrer" aria-label="${buttonLabel}: ${escapeHtml(product.name)}">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.4-4.4A8.4 8.4 0 1 1 20.5 11.7Z"></path>
                  <path d="M8.1 7.8c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6.5.9 1.2 1.7 2.1 2.2.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.5.2.5.4 0 .2-.1 1.2-.7 1.8-.5.5-1.3.8-2 .7-.5-.1-3.3-.8-5.4-3.2-1.7-1.9-2.1-3.6-2.1-4.2 0-.5.2-.8.4-1Z"></path>
                </svg>
                <span>${buttonLabel}</span>
              </a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function productWord(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "товар";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "товара";
    return "товаров";
  }

  function renderProductDialog(product) {
    const oldPrice = product.oldPrice
      ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>`
      : "";
    const stockLabel = product.inStock ? "В наличии" : "Под заказ";
    const stockClass = product.inStock ? "is-available" : "is-order";
    const selectedColor = getSelectedColor(product);

    elements.dialogContent.innerHTML = `
      <div class="dialog-product">
        <div class="dialog-media">
          <img data-product-image data-product-id="${product.id}" src="${escapeHtml(getProductImage(product))}" alt="${escapeHtml(product.imageAlt || product.name)}" width="520" height="520">
        </div>
        <div class="dialog-copy">
          <div class="dialog-scroll">
            <div class="dialog-meta">
              <span class="dialog-brand">${escapeHtml(product.brand)}</span>
              <span class="dialog-category">${escapeHtml(product.categoryLabel)}</span>
            </div>
            <h2 id="dialog-product-title">${escapeHtml(product.name)}</h2>
            <div class="dialog-price-row">
              <p class="product-price dialog-price">
                <span>${formatPrice(product.price)}</span>
                ${oldPrice}
              </p>
              <span class="stock-status ${stockClass}"><i aria-hidden="true"></i>${stockLabel}</span>
            </div>
            <p class="dialog-description">${escapeHtml(product.description)}</p>
            ${product.colors && product.colors.length ? `
              <section class="dialog-section" aria-labelledby="dialog-colors-title">
                <h3 id="dialog-colors-title">Доступные цвета</h3>
                ${renderColorSwatches(product, true)}
                <p class="selected-color" aria-live="polite">Выбран цвет: <strong data-selected-color-name data-product-id="${product.id}">${escapeHtml(selectedColor ? selectedColor.name : "Не указан")}</strong></p>
              </section>` : ""}
            ${renderSpecifications(product)}
          </div>
          <div class="dialog-actions">
            <p class="dialog-help">Текст заказа и данные товара уже будут заполнены.</p>
            <a class="whatsapp-button dialog-whatsapp" data-whatsapp-action data-product-id="${product.id}" href="${makeWhatsAppUrl(product)}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.4-4.4A8.4 8.4 0 1 1 20.5 11.7Z"></path>
                <path d="M8.1 7.8c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3 0 .5-.2.7l-.6.7c-.2.2-.1.4 0 .6.5.9 1.2 1.7 2.1 2.2.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.8.8c.3.1.5.2.5.4 0 .2-.1 1.2-.7 1.8-.5.5-1.3.8-2 .7-.5-.1-3.3-.8-5.4-3.2-1.7-1.9-2.1-3.6-2.1-4.2 0-.5.2-.8.4-1Z"></path>
              </svg>
              <span>Заказать в WhatsApp</span>
            </a>
          </div>
        </div>
      </div>`;
  }

  function updateProductSelection(product) {
    const selectedColor = getSelectedColor(product);
    const productId = String(product.id);

    document.querySelectorAll("[data-color-option]").forEach((button) => {
      if (button.dataset.productId !== productId) return;
      const isActive = selectedColor && button.dataset.colorId === selectedColor.id;
      button.classList.toggle("is-active", Boolean(isActive));
      button.setAttribute("aria-pressed", String(Boolean(isActive)));
    });

    document.querySelectorAll("[data-product-image]").forEach((image) => {
      if (image.dataset.productId === productId) {
        image.src = getProductImage(product);
      }
    });

    document.querySelectorAll("[data-whatsapp-action]").forEach((link) => {
      if (link.dataset.productId === productId) {
        link.href = makeWhatsAppUrl(product);
      }
    });

    document.querySelectorAll("[data-selected-color-name]").forEach((label) => {
      if (label.dataset.productId === productId) {
        label.textContent = selectedColor ? selectedColor.name : "Не указан";
      }
    });
  }

  async function selectProductColor(button) {
    const product = await window.ProductService.getProductById(button.dataset.productId);
    if (!product || !product.colors.some((color) => color.id === button.dataset.colorId)) return;

    selectedColorByProduct.set(String(product.id), button.dataset.colorId);
    updateProductSelection(product);
  }

  async function openProductDialog(productId) {
    const product = await window.ProductService.getProductById(productId);
    if (!product) return;

    renderProductDialog(product);
    document.body.classList.add("modal-open");
    if (!elements.dialog.open) {
      elements.dialog.showModal();
    }
  }

  function closeProductDialog() {
    elements.dialog.close();
  }

  async function renderProducts() {
    const products = await window.ProductService.findProducts(state);
    elements.grid.innerHTML = products.map(createProductCard).join("");
    elements.empty.hidden = products.length > 0;
    elements.grid.hidden = products.length === 0;
    elements.status.textContent = `Найдено ${products.length} ${productWord(products.length)}`;
  }

  async function renderCategories() {
    const categories = await window.ProductService.getCategories();
    elements.filters.insertAdjacentHTML(
      "beforeend",
      categories.map((category) => `
        <button class="filter-button" type="button" data-category="${escapeHtml(category.id)}" aria-pressed="false">
          ${escapeHtml(category.name)}
        </button>`).join("")
    );
  }

  async function renderBrands() {
    const brands = await window.ProductService.getBrands();
    elements.brands.insertAdjacentHTML(
      "beforeend",
      brands.map((brand) => `
        <button class="filter-button" type="button" data-brand="${escapeHtml(brand.id)}" aria-pressed="false">
          ${escapeHtml(brand.name)}
        </button>`).join("")
    );
  }

  function setActiveCategory(category) {
    state.category = category;
    elements.filters.querySelectorAll("[data-category]").forEach((button) => {
      const isActive = button.dataset.category === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setActiveBrand(brand) {
    state.brand = brand;
    elements.brands.querySelectorAll("[data-brand]").forEach((button) => {
      const isActive = button.dataset.brand === brand;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function resetFilters() {
    state.query = "";
    elements.search.value = "";
    setActiveCategory("all");
    setActiveBrand("all");
    renderProducts();
    elements.search.focus();
  }

  function bindEvents() {
    elements.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderProducts();
    });

    elements.filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;

      setActiveCategory(button.dataset.category);
      renderProducts();
    });

    elements.brands.addEventListener("click", (event) => {
      const button = event.target.closest("[data-brand]");
      if (!button) return;

      setActiveBrand(button.dataset.brand);
      renderProducts();
    });

    elements.reset.addEventListener("click", resetFilters);

    elements.grid.addEventListener("click", (event) => {
      const colorButton = event.target.closest("[data-color-option]");
      if (colorButton) {
        event.stopPropagation();
        selectProductColor(colorButton);
        return;
      }

      const whatsappLink = event.target.closest("[data-whatsapp-action]");
      if (whatsappLink) {
        event.stopPropagation();
        return;
      }

      const card = event.target.closest("[data-product-card]");
      if (!card) return;
      openProductDialog(card.dataset.productId);
    });

    elements.dialog.addEventListener("click", (event) => {
      const colorButton = event.target.closest("[data-color-option]");
      if (colorButton) {
        selectProductColor(colorButton);
        return;
      }

      if (event.target === elements.dialog || event.target.closest("[data-close-dialog]")) {
        closeProductDialog();
      }
    });

    elements.dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
    });
  }

  function setupGeneralWhatsAppLinks() {
    document.querySelectorAll("[data-general-whatsapp]").forEach((link) => {
      link.href = makeWhatsAppUrl();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  async function init() {
    elements.grid = document.querySelector("#products-grid");
    elements.filters = document.querySelector("#category-filters");
    elements.brands = document.querySelector("#brand-filters");
    elements.search = document.querySelector("#product-search");
    elements.status = document.querySelector("#catalog-status");
    elements.empty = document.querySelector("#empty-state");
    elements.reset = document.querySelector("#reset-filters");
    elements.dialog = document.querySelector("#product-dialog");
    elements.dialogContent = document.querySelector("#dialog-content");

    setupGeneralWhatsAppLinks();
    document.querySelector("#current-year").textContent = new Date().getFullYear();

    if (!window.ProductService) {
      elements.status.textContent = "Не удалось загрузить каталог.";
      return;
    }

    await Promise.all([renderCategories(), renderBrands()]);
    await renderProducts();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
