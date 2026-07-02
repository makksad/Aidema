(function () {
  "use strict";

  const COLOR_DEFAULTS = {
    graphite: { id: "graphite", name: "Графит", hex: "#2b292a" },
    black: { id: "black", name: "Чёрный", hex: "#151515" },
    wine: { id: "wine", name: "Бордовый", hex: "#611b32" },
    cream: { id: "cream", name: "Молочный", hex: "#e8dfd2" },
    sand: { id: "sand", name: "Песочный", hex: "#b89a73" },
    olive: { id: "olive", name: "Оливковый", hex: "#6f7151" },
    terracotta: { id: "terracotta", name: "Терракотовый", hex: "#a6533d" },
    steel: { id: "steel", name: "Стальной", hex: "#a6aaab" }
  };

  let productsPromise = null;
  let activeDataSource = "local";

  function getLocalSource() {
    return Array.isArray(window.AIDEMA_PRODUCTS) ? window.AIDEMA_PRODUCTS : [];
  }

  function normalizeColor(color) {
    if (typeof color === "string") {
      return { ...(COLOR_DEFAULTS[color] || { id: color, name: color, hex: "#d8d2cc" }) };
    }

    const id = String(color && color.id || "").trim();
    const defaults = COLOR_DEFAULTS[id] || {};
    return {
      id,
      name: String(color && color.name || defaults.name || id),
      hex: String(color && color.hex || defaults.hex || "#d8d2cc")
    };
  }

  function normalizeProduct(product) {
    const source = product || {};
    const rawColors = Array.isArray(source.colors) ? source.colors : [];
    const rawSpecs = Array.isArray(source.specs)
      ? source.specs
      : Array.isArray(source.specifications) ? source.specifications : [];
    const imagesByColor = source.imagesByColor ?? source.images_by_color;

    return {
      ...source,
      id: source.id ?? source.slug,
      slug: String(source.slug || ""),
      brand: String(source.brand || ""),
      name: String(source.name || "Без названия"),
      category: String(source.category || "other"),
      categoryLabel: String(source.categoryLabel ?? source.category_label ?? source.category ?? "Другое"),
      description: String(source.description || ""),
      price: Number(source.price) || 0,
      oldPrice: source.oldPrice ?? source.old_price ?? null,
      inStock: source.inStock ?? source.in_stock ?? true,
      badges: Array.isArray(source.badges) ? [...source.badges] : [],
      image: String(source.image || "assets/product-placeholder.svg"),
      colors: rawColors.map(normalizeColor).filter((color) => color.id),
      gallery: Array.isArray(source.gallery) ? [...source.gallery].filter(Boolean) : [],
      imagesByColor: imagesByColor && typeof imagesByColor === "object" && !Array.isArray(imagesByColor)
        ? { ...imagesByColor }
        : {},
      specs: rawSpecs
        .filter((item) => item && typeof item === "object")
        .map((item) => ({ label: String(item.label || ""), value: String(item.value || "") })),
      imageAlt: String(source.imageAlt ?? source.image_alt ?? source.name ?? "Товар AIDEMA"),
      sortOrder: Number(source.sortOrder ?? source.sort_order) || 0,
      isPublished: source.isPublished ?? source.is_published ?? true
    };
  }

  function setDataSource(source) {
    activeDataSource = source;
    document.documentElement.dataset.catalogSource = source;
  }

  async function getProductsFromSupabase() {
    const supabaseLayer = window.AIDEMA_SUPABASE;
    if (!supabaseLayer || !supabaseLayer.isConfigured()) return [];

    const client = supabaseLayer.getClient();
    if (!client) return [];

    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase("ru-RU");
  }

  async function loadProducts() {
    try {
      const remoteProducts = await getProductsFromSupabase();
      if (remoteProducts.length) {
        setDataSource("supabase");
        return remoteProducts.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    } catch (error) {
      console.warn("[AIDEMA] Supabase недоступен, используется products.js.", error);
    }

    setDataSource("local");
    return getLocalSource()
      .map(normalizeProduct)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async function getProducts(options) {
    if (options && options.refresh) productsPromise = null;
    if (!productsPromise) productsPromise = loadProducts();
    return productsPromise;
  }

  function getDataSource() {
    return activeDataSource;
  }

  async function getCategories() {
    const products = await getProducts();
    const categories = new Map();

    products.forEach((product) => {
      if (product.category && !categories.has(product.category)) {
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
    return products.find((product) => String(product.id) === String(id)) || null;
  }

  window.ProductService = Object.freeze({
    getDataSource,
    getProducts,
    getProductsFromSupabase,
    getCategories,
    getBrands,
    findProducts,
    getProductById
  });
})();
