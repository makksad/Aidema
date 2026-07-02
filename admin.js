(function () {
  "use strict";

  const COLORS = [
    { id: "graphite", name: "Графит", hex: "#2b292a" },
    { id: "black", name: "Чёрный", hex: "#151515" },
    { id: "wine", name: "Бордовый", hex: "#611b32" },
    { id: "cream", name: "Молочный", hex: "#e8dfd2" },
    { id: "sand", name: "Песочный", hex: "#b89a73" },
    { id: "olive", name: "Оливковый", hex: "#6f7151" },
    { id: "terracotta", name: "Терракотовый", hex: "#a6533d" },
    { id: "steel", name: "Стальной", hex: "#a6aaab" }
  ];

  const EXAMPLE_PRODUCT = {
    id: 9,
    slug: "kastryulya-aidema-5-l",
    brand: "AIDEMA",
    name: "Кастрюля AIDEMA 5 л",
    category: "pots",
    categoryLabel: "Кастрюли и казаны",
    description: "Универсальная кастрюля для супов, гарниров и ежедневной домашней готовки.",
    price: 3890,
    oldPrice: 4290,
    inStock: true,
    badges: ["Хит"],
    image: "assets/products/kastryulya-aidema-5-l/kastryulya-aidema-5-l-main.webp",
    colors: ["graphite", "cream", "wine"],
    imagesByColor: {
      graphite: "assets/products/kastryulya-aidema-5-l/kastryulya-aidema-5-l-graphite.webp",
      cream: "assets/products/kastryulya-aidema-5-l/kastryulya-aidema-5-l-cream.webp"
    },
    specs: [
      { label: "Объём", value: "5 литров" },
      { label: "Материал", value: "Литой чугун" },
      { label: "Комплектация", value: "Кастрюля и крышка" }
    ],
    imageAlt: "Кастрюля AIDEMA объёмом 5 литров",
    sortOrder: 9,
    isPublished: true
  };

  const form = document.querySelector("#product-form");
  const colorsGrid = document.querySelector("#colors-grid");
  const colorsError = document.querySelector("#colors-error");
  const colorImages = document.querySelector("#color-images");
  const specsList = document.querySelector("#specs-list");
  const output = document.querySelector("#code-output");
  const copyButton = document.querySelector("#copy-code");
  const copyStatus = document.querySelector("#copy-status");
  const saveButton = document.querySelector("#save-supabase");
  const saveStatus = document.querySelector("#save-status");
  const connectionBadge = document.querySelector("#connection-badge");
  const backendMessage = document.querySelector("#backend-message");
  const loginForm = document.querySelector("#login-form");
  const authUser = document.querySelector("#auth-user");
  const authEmail = document.querySelector("#auth-email");
  const productsManager = document.querySelector("#products-manager");
  const productsTableBody = document.querySelector("#products-table-body");
  const productsStatus = document.querySelector("#products-status");
  const requestsManager = document.querySelector("#requests-manager");
  const requestsTableBody = document.querySelector("#requests-table-body");
  const requestsStatus = document.querySelector("#requests-status");
  const mainImageFile = document.querySelector("#main-image-file");
  const uploadMainButton = document.querySelector("#upload-main-image");
  const uploadStatus = document.querySelector("#upload-status");
  const imagePreview = document.querySelector("#image-preview");
  const imageValues = new Map();
  let slugWasEdited = false;
  let supabaseClient = null;
  let isCurrentUserAdmin = false;
  let editingProductId = null;
  let supabaseProducts = [];

  function field(name) {
    return form.elements.namedItem(name);
  }

  function quote(value) {
    return JSON.stringify(String(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(Number(value) || 0) + " сом";
  }

  function slugify(value) {
    const transliteration = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
      з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
      п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
      ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
    };

    return String(value)
      .trim()
      .toLocaleLowerCase("ru-RU")
      .split("")
      .map((letter) => transliteration[letter] ?? letter)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  }

  function renderColorChoices() {
    colorsGrid.innerHTML = COLORS.map((color) => `
      <label class="color-choice">
        <input name="colors" type="checkbox" value="${color.id}">
        <span class="color-dot" style="--color: ${color.hex}" aria-hidden="true"></span>
        <span>${color.name}</span>
        <small>${color.id}</small>
      </label>`).join("");
  }

  function selectedColorIds() {
    return Array.from(form.querySelectorAll('input[name="colors"]:checked'), (input) => input.value);
  }

  function rememberImageValues() {
    colorImages.querySelectorAll("[data-color-image]").forEach((input) => {
      imageValues.set(input.dataset.colorImage, input.value.trim());
    });
  }

  function renderColorImages(rememberCurrentValues = true) {
    if (rememberCurrentValues) rememberImageValues();
    const selectedIds = selectedColorIds();

    if (!selectedIds.length) {
      colorImages.innerHTML = '<p class="empty-hint">Сначала выберите хотя бы один цвет.</p>';
      return;
    }

    colorImages.innerHTML = selectedIds.map((id) => {
      const color = COLORS.find((item) => item.id === id);
      const imageUrl = imageValues.get(color.id) || "";
      return `
        <div class="color-image-row">
          <span class="color-dot" style="--color: ${color.hex}" aria-hidden="true"></span>
          <span class="color-image-name"><strong>${color.name}</strong><small>${color.id}</small></span>
          <input data-color-image="${color.id}" type="text" value="${escapeAttribute(imageUrl)}" placeholder="assets/products/...-${color.id}.webp" aria-label="URL изображения: ${escapeAttribute(color.name)}">
          <div class="color-upload-controls">
            <input data-color-file="${color.id}" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" ${isCurrentUserAdmin ? "" : "disabled"} aria-label="Файл изображения: ${escapeAttribute(color.name)}">
            <button class="button button-small button-outline" data-upload-color="${color.id}" type="button" ${isCurrentUserAdmin ? "" : "disabled"}>Загрузить для цвета</button>
            ${imageUrl ? `<img class="color-image-preview" src="${escapeAttribute(imageUrl)}" alt="Предпросмотр: ${escapeAttribute(color.name)}">` : ""}
          </div>
        </div>`;
    }).join("");
  }

  function addSpecRow(spec = { label: "", value: "" }) {
    const row = document.createElement("div");
    row.className = "spec-row";
    row.innerHTML = `
      <label class="field">
        <span>Название</span>
        <input data-spec-label type="text" value="${escapeAttribute(spec.label)}" placeholder="Например, Материал" required>
      </label>
      <label class="field">
        <span>Значение</span>
        <input data-spec-value type="text" value="${escapeAttribute(spec.value)}" placeholder="Например, Литой чугун" required>
      </label>
      <button class="remove-spec" type="button" aria-label="Удалить характеристику">×</button>`;
    specsList.append(row);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function clearOutput() {
    output.value = "";
    copyButton.disabled = true;
    copyStatus.textContent = "";
  }

  function validateColors() {
    const isValid = selectedColorIds().length > 0;
    const firstColor = form.querySelector('input[name="colors"]');
    firstColor.setCustomValidity(isValid ? "" : "Выберите хотя бы один цвет");
    colorsError.textContent = isValid ? "" : "Выберите хотя бы один цвет.";
    return isValid;
  }

  function collectSpecs() {
    return Array.from(specsList.querySelectorAll(".spec-row"), (row) => ({
      label: row.querySelector("[data-spec-label]").value.trim(),
      value: row.querySelector("[data-spec-value]").value.trim()
    }));
  }

  function collectProductForm() {
    rememberImageValues();
    const colors = selectedColorIds();
    const imagesByColor = {};

    colors.forEach((id) => {
      const path = imageValues.get(id);
      if (path) imagesByColor[id] = path;
    });

    return {
      id: Number(field("id").value),
      slug: field("slug").value.trim(),
      brand: field("brand").value.trim(),
      name: field("name").value.trim(),
      category: field("category").value.trim(),
      categoryLabel: field("categoryLabel").value.trim(),
      description: field("description").value.trim(),
      price: Number(field("price").value),
      oldPrice: field("oldPrice").value === "" ? null : Number(field("oldPrice").value),
      inStock: field("inStock").checked,
      badges: Array.from(form.querySelectorAll('input[name="badges"]:checked'), (input) => input.value),
      image: field("image").value.trim(),
      colors,
      imagesByColor,
      specs: collectSpecs(),
      imageAlt: field("imageAlt").value.trim(),
      sortOrder: Number(field("sortOrder").value),
      isPublished: field("isPublished").checked
    };
  }

  function validateProductForm() {
    validateColors();
    return form.reportValidity();
  }

  function buildObjectCode() {
    const product = collectProductForm();
    const colorImageEntries = Object.entries(product.imagesByColor)
      .map(([id, path]) => `        ${id}: ${quote(path)}`);

    const imagesByColorCode = colorImageEntries.length
      ? `{\n${colorImageEntries.join(",\n")}\n      }`
      : "{}";
    const specsCode = product.specs.length
      ? `[\n${product.specs.map((spec) => `        { label: ${quote(spec.label)}, value: ${quote(spec.value)} }`).join(",\n")}\n      ]`
      : "[]";

    return `    {
      id: ${product.id},
      slug: ${quote(product.slug)},
      brand: ${quote(product.brand)},
      name: ${quote(product.name)},
      category: ${quote(product.category)},
      categoryLabel: ${quote(product.categoryLabel)},
      description: ${quote(product.description)},
      price: ${product.price},
      oldPrice: ${product.oldPrice === null ? "null" : product.oldPrice},
      inStock: ${product.inStock},
      badges: ${JSON.stringify(product.badges)},
      image: ${quote(product.image)},
      colors: createColors(${product.colors.map(quote).join(", ")}),
      imagesByColor: ${imagesByColorCode},
      specs: ${specsCode},
      imageAlt: ${quote(product.imageAlt)},
      sortOrder: ${product.sortOrder},
      isPublished: ${product.isPublished}
    },`;
  }

  function buildSupabasePayload() {
    const product = collectProductForm();
    return {
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      category: product.category,
      category_label: product.categoryLabel,
      description: product.description,
      price: product.price,
      old_price: product.oldPrice,
      in_stock: product.inStock,
      badges: product.badges,
      image: product.image,
      colors: product.colors.map((id) => ({ ...COLORS.find((color) => color.id === id) })),
      images_by_color: product.imagesByColor,
      specs: product.specs,
      image_alt: product.imageAlt,
      sort_order: product.sortOrder,
      is_published: product.isPublished
    };
  }

  function setBackendMessage(message, isError) {
    backendMessage.textContent = message;
    backendMessage.classList.toggle("is-error", Boolean(isError));
  }

  function setSaveStatus(message, type) {
    saveStatus.textContent = message;
    saveStatus.classList.toggle("is-error", type === "error");
    saveStatus.classList.toggle("is-success", type === "success");
  }

  function setElementStatus(element, message, type) {
    element.textContent = message;
    element.classList.toggle("is-error", type === "error");
    element.classList.toggle("is-success", type === "success");
  }

  function renderMainImagePreview(url) {
    const imageUrl = String(url || "").trim();
    imagePreview.hidden = !imageUrl;
    if (imageUrl) imagePreview.src = imageUrl;
    else imagePreview.removeAttribute("src");
  }

  function validateImageFile(file) {
    if (!file) return { error: "Сначала выберите файл." };
    const extension = String(file.name).split(".").pop().toLowerCase();
    if (extension === "heic" || extension === "heif" || /heic|heif/i.test(file.type)) {
      return { error: "HEIC лучше заранее конвертировать в WebP/JPG." };
    }
    if (!(["jpg", "jpeg", "png", "webp"].includes(extension))) {
      return { error: "Поддерживаются только JPG, JPEG, PNG и WebP." };
    }
    if (file.size > 1024 * 1024) {
      return { error: "Файл больше 1 МБ. Уменьшите или сожмите изображение." };
    }
    return { warning: file.size > 500 * 1024 ? "Файл больше 500 КБ, но укладывается в лимит 1 МБ." : "" };
  }

  async function uploadImageToStorage(file, colorId) {
    const validation = validateImageFile(file);
    if (validation.error) {
      setElementStatus(uploadStatus, validation.error, "error");
      return;
    }
    if (!supabaseClient || !isCurrentUserAdmin) {
      setElementStatus(uploadStatus, "Войдите как администратор для загрузки фото.", "error");
      return;
    }

    const extension = String(file.name).split(".").pop().toLowerCase().replace("jpeg", "jpg");
    const productFolder = slugify(field("slug").value) || "new-product";
    const suffix = colorId || "main";
    const uniquePart = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const objectPath = `products/${productFolder}/${Date.now()}-${suffix}-${uniquePart}.${extension}`;

    setElementStatus(uploadStatus, validation.warning || "Загружаем изображение…");
    const { data, error } = await supabaseClient.storage
      .from("product-images")
      .upload(objectPath, file, { cacheControl: "3600", upsert: false, contentType: file.type || undefined });

    if (error) {
      setElementStatus(uploadStatus, `Ошибка Storage: ${error.message}`, "error");
      return;
    }

    const { data: publicData } = supabaseClient.storage.from("product-images").getPublicUrl(data.path);
    const publicUrl = publicData && publicData.publicUrl;
    if (!publicUrl) {
      setElementStatus(uploadStatus, "Файл загружен, но public URL не получен. Проверьте, что bucket публичный.", "error");
      return;
    }

    if (colorId) {
      imageValues.set(colorId, publicUrl);
      renderColorImages(false);
    } else {
      field("image").value = publicUrl;
      renderMainImagePreview(publicUrl);
    }
    setElementStatus(uploadStatus, `Фото загружено: ${data.path}`, "success");
  }

  function setAdminControls(enabled) {
    productsManager.hidden = !enabled;
    requestsManager.hidden = !enabled;
    mainImageFile.disabled = !enabled;
    uploadMainButton.disabled = !enabled;
    if (!enabled) {
      productsTableBody.innerHTML = "";
      requestsTableBody.innerHTML = "";
    }
    renderColorImages();
  }

  function renderProductsTable() {
    if (!supabaseProducts.length) {
      productsTableBody.innerHTML = '<tr><td colspan="5">Товаров в Supabase пока нет.</td></tr>';
      return;
    }

    productsTableBody.innerHTML = supabaseProducts.map((product) => `
      <tr>
        <td class="table-product"><strong>${escapeHtml(product.name || "Без названия")}</strong><small>${escapeHtml(product.brand || "—")}</small></td>
        <td>${escapeHtml(product.category_label || product.category || "—")}</td>
        <td>${escapeHtml(formatPrice(product.price))}</td>
        <td>
          <span class="status-pill${product.is_published ? "" : " is-hidden"}">${product.is_published ? "Опубликован" : "Скрыт"}</span>
          <small>${product.in_stock ? "В наличии" : "Под заказ"}</small>
        </td>
        <td><div class="table-actions">
          <button class="table-button" type="button" data-product-action="edit" data-product-id="${escapeAttribute(product.id)}">Редактировать</button>
          <button class="table-button" type="button" data-product-action="toggle" data-product-id="${escapeAttribute(product.id)}">${product.is_published ? "Скрыть" : "Показать"}</button>
          <button class="table-button is-danger" type="button" data-product-action="delete" data-product-id="${escapeAttribute(product.id)}">Удалить</button>
        </div></td>
      </tr>`).join("");
  }

  async function loadSupabaseProducts() {
    if (!supabaseClient || !isCurrentUserAdmin) return;
    setElementStatus(productsStatus, "Загружаем товары…");
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setElementStatus(productsStatus, `Не удалось загрузить товары: ${error.message}`, "error");
      return;
    }
    supabaseProducts = Array.isArray(data) ? data : [];
    renderProductsTable();
    setElementStatus(productsStatus, `Загружено товаров: ${supabaseProducts.length}.`, "success");
  }

  function fillProductForEditing(product) {
    editingProductId = product.id;
    slugWasEdited = true;
    imageValues.clear();
    const values = {
      id: Number(product.sort_order) || 1,
      slug: product.slug || "",
      brand: product.brand || "",
      name: product.name || "",
      category: product.category || "",
      categoryLabel: product.category_label || "",
      description: product.description || "",
      price: product.price ?? 0,
      oldPrice: product.old_price ?? "",
      image: product.image || "",
      imageAlt: product.image_alt || "",
      sortOrder: product.sort_order ?? 0
    };
    Object.entries(values).forEach(([name, value]) => { field(name).value = value; });
    field("inStock").checked = product.in_stock !== false;
    field("isPublished").checked = product.is_published !== false;
    const badges = Array.isArray(product.badges) ? product.badges : [];
    form.querySelectorAll('input[name="badges"]').forEach((input) => { input.checked = badges.includes(input.value); });
    const colorIds = (Array.isArray(product.colors) ? product.colors : []).map((color) => typeof color === "string" ? color : color.id);
    form.querySelectorAll('input[name="colors"]').forEach((input) => { input.checked = colorIds.includes(input.value); });
    Object.entries(product.images_by_color || {}).forEach(([id, url]) => imageValues.set(id, url));
    specsList.innerHTML = "";
    const specs = Array.isArray(product.specs) ? product.specs : [];
    if (specs.length) specs.forEach(addSpecRow);
    else addSpecRow();
    renderColorImages(false);
    renderMainImagePreview(product.image);
    saveButton.textContent = "Обновить в Supabase";
    setSaveStatus(`Редактируется: ${product.name}.`, "success");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleProductAction(button) {
    const product = supabaseProducts.find((item) => String(item.id) === button.dataset.productId);
    if (!product) return;
    const action = button.dataset.productAction;
    if (action === "edit") {
      fillProductForEditing(product);
      return;
    }

    button.disabled = true;
    let result;
    if (action === "toggle") {
      result = await supabaseClient.from("products").update({ is_published: !product.is_published }).eq("id", product.id);
    } else if (action === "delete") {
      if (!window.confirm("Точно удалить товар? Это действие нельзя отменить.")) {
        button.disabled = false;
        return;
      }
      result = await supabaseClient.from("products").delete().eq("id", product.id);
    }

    if (result && result.error) setElementStatus(productsStatus, `Операция не выполнена: ${result.error.message}`, "error");
    else {
      if (action === "delete" && editingProductId === product.id) clearForm();
      await loadSupabaseProducts();
    }
    button.disabled = false;
  }

  function renderRequestsTable(requests) {
    if (!requests.length) {
      requestsTableBody.innerHTML = '<tr><td colspan="6">WhatsApp-кликов пока нет.</td></tr>';
      return;
    }
    requestsTableBody.innerHTML = requests.map((request) => `
      <tr>
        <td>${escapeHtml(new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.created_at)))}</td>
        <td>${escapeHtml(request.product_name || request.product_slug || "—")}</td>
        <td>${escapeHtml(request.brand || "—")}</td>
        <td>${escapeHtml(request.selected_color || "—")}</td>
        <td>${escapeHtml(formatPrice(request.price))}</td>
        <td>${escapeHtml(request.source || "whatsapp")}</td>
      </tr>`).join("");
  }

  async function loadOrderRequests() {
    if (!supabaseClient || !isCurrentUserAdmin) return;
    setElementStatus(requestsStatus, "Загружаем заявки…");
    const { data, error } = await supabaseClient
      .from("order_requests")
      .select("id, product_name, product_slug, brand, selected_color, price, source, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      setElementStatus(requestsStatus, `Не удалось загрузить заявки: ${error.message}`, "error");
      return;
    }
    renderRequestsTable(Array.isArray(data) ? data : []);
    setElementStatus(requestsStatus, `Показано заявок: ${(data || []).length}.`, "success");
  }

  async function updateAuthInterface(session) {
    const user = session && session.user;
    isCurrentUserAdmin = false;
    saveButton.disabled = true;
    setAdminControls(false);

    if (!user) {
      loginForm.hidden = false;
      authUser.hidden = true;
      authEmail.textContent = "";
      setBackendMessage("Войдите через Supabase Auth, чтобы сохранять товары. Генератор JS доступен без входа.");
      return;
    }

    loginForm.hidden = true;
    authUser.hidden = false;
    authEmail.textContent = user.email || user.id;
    setBackendMessage("Проверяем права администратора…");

    const { data, error } = await supabaseClient
      .from("admin_users")
      .select("user_id, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      setBackendMessage("Вход выполнен, но пользователь не добавлен в public.admin_users. Сохранение запрещено RLS.", true);
      return;
    }

    isCurrentUserAdmin = true;
    saveButton.disabled = false;
    setAdminControls(true);
    connectionBadge.textContent = "Администратор";
    connectionBadge.className = "connection-badge is-connected";
    setBackendMessage("Supabase подключён. Можно создавать и обновлять товары по slug.");
    await Promise.all([loadSupabaseProducts(), loadOrderRequests()]);
  }

  async function initializeSupabase() {
    const supabaseLayer = window.AIDEMA_SUPABASE;
    const configurationError = supabaseLayer ? supabaseLayer.getConfigurationError() : "Supabase client не загружен.";

    if (configurationError) {
      connectionBadge.textContent = "Не настроен";
      connectionBadge.className = "connection-badge is-error";
      setBackendMessage(`${configurationError} Локальный генератор продолжает работать.`, true);
      loginForm.hidden = true;
      saveButton.disabled = true;
      return;
    }

    supabaseClient = supabaseLayer.getClient();
    connectionBadge.textContent = "Подключён";
    connectionBadge.className = "connection-badge is-connected";

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      setBackendMessage(`Не удалось проверить сессию: ${error.message}`, true);
      return;
    }

    await updateAuthInterface(data.session);
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => updateAuthInterface(session), 0);
    });
  }

  async function login(event) {
    event.preventDefault();
    if (!supabaseClient) return;

    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setBackendMessage("Выполняем вход…");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: document.querySelector("#admin-email").value.trim(),
      password: document.querySelector("#admin-password").value
    });

    submitButton.disabled = false;
    if (error) {
      setBackendMessage(`Не удалось войти: ${error.message}`, true);
      return;
    }

    document.querySelector("#admin-password").value = "";
    await updateAuthInterface(data.session);
  }

  async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    connectionBadge.textContent = "Подключён";
    connectionBadge.className = "connection-badge is-connected";
  }

  async function saveToSupabase() {
    if (!supabaseClient) {
      setSaveStatus("Supabase не настроен. Заполните supabase-config.js.", "error");
      return;
    }
    if (!isCurrentUserAdmin) {
      setSaveStatus("Сначала войдите как пользователь из таблицы admin_users.", "error");
      return;
    }
    if (!validateProductForm()) return;

    saveButton.disabled = true;
    setSaveStatus("Сохраняем товар…");

    const payload = buildSupabasePayload();
    const query = editingProductId
      ? supabaseClient.from("products").update(payload).eq("id", editingProductId)
      : supabaseClient.from("products").upsert(payload, { onConflict: "slug" });
    const { data, error } = await query.select("id, slug, name").single();

    saveButton.disabled = false;
    if (error) {
      setSaveStatus(`Supabase отклонил сохранение: ${error.message}`, "error");
      return;
    }

    editingProductId = data.id;
    saveButton.textContent = "Обновить в Supabase";
    setSaveStatus(`Сохранено: ${data.name} (${data.slug}).`, "success");
    await loadSupabaseProducts();
  }

  function fillExample() {
    form.reset();
    imageValues.clear();
    slugWasEdited = false;
    editingProductId = null;
    saveButton.textContent = "Сохранить в Supabase";

    ["id", "slug", "brand", "name", "category", "categoryLabel", "description", "price", "oldPrice", "image", "imageAlt", "sortOrder"].forEach((name) => {
      field(name).value = EXAMPLE_PRODUCT[name];
    });
    field("inStock").checked = EXAMPLE_PRODUCT.inStock;
    field("isPublished").checked = EXAMPLE_PRODUCT.isPublished;

    form.querySelectorAll('input[name="badges"]').forEach((input) => {
      input.checked = EXAMPLE_PRODUCT.badges.includes(input.value);
    });
    form.querySelectorAll('input[name="colors"]').forEach((input) => {
      input.checked = EXAMPLE_PRODUCT.colors.includes(input.value);
    });
    Object.entries(EXAMPLE_PRODUCT.imagesByColor).forEach(([id, path]) => imageValues.set(id, path));

    specsList.innerHTML = "";
    EXAMPLE_PRODUCT.specs.forEach(addSpecRow);
    renderColorImages(false);
    renderMainImagePreview(EXAMPLE_PRODUCT.image);
    validateColors();
    clearOutput();
  }

  function clearForm() {
    form.reset();
    imageValues.clear();
    slugWasEdited = false;
    editingProductId = null;
    saveButton.textContent = "Сохранить в Supabase";
    specsList.innerHTML = "";
    addSpecRow();
    renderColorImages(false);
    colorsError.textContent = "";
    form.querySelector('input[name="colors"]').setCustomValidity("");
    field("isPublished").checked = true;
    mainImageFile.value = "";
    renderMainImagePreview("");
    setElementStatus(uploadStatus, "");
    clearOutput();
    field("name").focus();
  }

  async function copyCode() {
    if (!output.value) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(output.value);
      } else {
        output.focus();
        output.select();
        const copied = document.execCommand("copy");
        if (!copied) throw new Error("copy command failed");
        window.getSelection()?.removeAllRanges();
      }
      copyStatus.textContent = "Скопировано";
    } catch (error) {
      copyStatus.textContent = "Не удалось скопировать — выделите код вручную";
    }
  }

  renderColorChoices();

  field("name").addEventListener("input", () => {
    if (!slugWasEdited) field("slug").value = slugify(field("name").value);
  });
  field("slug").addEventListener("input", () => {
    slugWasEdited = true;
  });

  colorsGrid.addEventListener("change", () => {
    validateColors();
    renderColorImages();
  });
  colorImages.addEventListener("input", rememberImageValues);
  colorImages.addEventListener("click", (event) => {
    const button = event.target.closest("[data-upload-color]");
    if (!button) return;
    const fileInput = colorImages.querySelector(`[data-color-file="${button.dataset.uploadColor}"]`);
    uploadImageToStorage(fileInput && fileInput.files[0], button.dataset.uploadColor);
  });

  specsList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-spec");
    if (!removeButton) return;
    removeButton.closest(".spec-row").remove();
  });

  document.querySelector("#add-spec").addEventListener("click", () => addSpecRow());
  document.querySelector("#fill-example").addEventListener("click", fillExample);
  document.querySelector("#clear-form").addEventListener("click", clearForm);
  document.querySelector("#save-supabase").addEventListener("click", saveToSupabase);
  document.querySelector("#logout-button").addEventListener("click", logout);
  document.querySelector("#refresh-products").addEventListener("click", loadSupabaseProducts);
  document.querySelector("#refresh-requests").addEventListener("click", loadOrderRequests);
  productsTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-action]");
    if (button) handleProductAction(button);
  });
  uploadMainButton.addEventListener("click", () => uploadImageToStorage(mainImageFile.files[0]));
  mainImageFile.addEventListener("change", () => {
    const validation = validateImageFile(mainImageFile.files[0]);
    setElementStatus(uploadStatus, validation.error || validation.warning || "Файл готов к загрузке.", validation.error ? "error" : "");
  });
  field("image").addEventListener("input", () => renderMainImagePreview(field("image").value));
  loginForm.addEventListener("submit", login);
  copyButton.addEventListener("click", copyCode);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateProductForm()) return;

    output.value = buildObjectCode();
    copyButton.disabled = false;
    copyStatus.textContent = "Объект готов";
    output.scrollTop = 0;
  });

  fillExample();
  initializeSupabase();
})();
