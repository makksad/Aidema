(function () {
  "use strict";

  /*
   * Интерфейс каталога работает только с ProductService.
   * Позже содержимое getSource() можно заменить запросом к API,
   * не меняя разметку карточек, поиск и фильтры в script.js.
   */
  function getSource() {
    return Array.isArray(window.AIDEMA_PRODUCTS) ? window.AIDEMA_PRODUCTS : [];
  }

  function copyProduct(product) {
    return {
      ...product,
      badges: Array.isArray(product.badges) ? [...product.badges] : [],
      colors: Array.isArray(product.colors)
        ? product.colors.map((color) => ({ ...color }))
        : [],
      gallery: Array.isArray(product.gallery) ? [...product.gallery] : [],
      imagesByColor: product.imagesByColor ? { ...product.imagesByColor } : {},
      specs: Array.isArray(product.specs)
        ? product.specs.map((item) => ({ ...item }))
        : Array.isArray(product.specifications)
          ? product.specifications.map((item) => ({ ...item }))
          : []
    };
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("ru-RU");
  }

  async function getProducts() {
    return getSource()
      .map(copyProduct)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async function getCategories() {
    const products = await getProducts();
    const categories = new Map();

    products.forEach((product) => {
      if (!categories.has(product.category)) {
        categories.set(product.category, product.categoryLabel);
      }
    });

    return Array.from(categories, ([id, name]) => ({ id, name }));
  }

  async function getBrands() {
    const products = await getProducts();
    return [...new Set(products.map((product) => product.brand).filter(Boolean))]
      .map((brand) => ({ id: brand, name: brand }));
  }

  async function findProducts(options) {
    const { query = "", category = "all", brand = "all" } = options || {};
    const products = await getProducts();
    const normalizedQuery = normalizeText(query);

    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      const searchableText = normalizeText([
        product.brand,
        product.name,
        product.description,
        product.categoryLabel
      ].join(" "));
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesCategory && matchesBrand && matchesQuery;
    });
  }

  async function getProductById(id) {
    const products = await getProducts();
    return products.find((product) => product.id === Number(id)) || null;
  }

  window.ProductService = Object.freeze({
    getProducts,
    getCategories,
    getBrands,
    findProducts,
    getProductById
  });
})();
