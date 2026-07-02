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
    sortOrder: 9
  };

  const form = document.querySelector("#product-form");
  const colorsGrid = document.querySelector("#colors-grid");
  const colorsError = document.querySelector("#colors-error");
  const colorImages = document.querySelector("#color-images");
  const specsList = document.querySelector("#specs-list");
  const output = document.querySelector("#code-output");
  const copyButton = document.querySelector("#copy-code");
  const copyStatus = document.querySelector("#copy-status");
  const imageValues = new Map();
  let slugWasEdited = false;

  function field(name) {
    return form.elements.namedItem(name);
  }

  function quote(value) {
    return JSON.stringify(String(value));
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

  function renderColorImages() {
    rememberImageValues();
    const selectedIds = selectedColorIds();

    if (!selectedIds.length) {
      colorImages.innerHTML = '<p class="empty-hint">Сначала выберите хотя бы один цвет.</p>';
      return;
    }

    colorImages.innerHTML = selectedIds.map((id) => {
      const color = COLORS.find((item) => item.id === id);
      return `
        <label class="color-image-row">
          <span class="color-dot" style="--color: ${color.hex}" aria-hidden="true"></span>
          <span class="color-image-name"><strong>${color.name}</strong><small>${color.id}</small></span>
          <input data-color-image="${color.id}" type="text" value="${imageValues.get(color.id) || ""}" placeholder="assets/products/...-${color.id}.webp">
        </label>`;
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

  function buildObjectCode() {
    rememberImageValues();
    const colors = selectedColorIds();
    const badges = Array.from(form.querySelectorAll('input[name="badges"]:checked'), (input) => input.value);
    const specs = collectSpecs();
    const colorImageEntries = colors
      .filter((id) => imageValues.get(id))
      .map((id) => `        ${id}: ${quote(imageValues.get(id))}`);

    const imagesByColorCode = colorImageEntries.length
      ? `{\n${colorImageEntries.join(",\n")}\n      }`
      : "{}";
    const specsCode = specs.length
      ? `[\n${specs.map((spec) => `        { label: ${quote(spec.label)}, value: ${quote(spec.value)} }`).join(",\n")}\n      ]`
      : "[]";

    return `    {
      id: ${Number(field("id").value)},
      slug: ${quote(field("slug").value.trim())},
      brand: ${quote(field("brand").value.trim())},
      name: ${quote(field("name").value.trim())},
      category: ${quote(field("category").value.trim())},
      categoryLabel: ${quote(field("categoryLabel").value.trim())},
      description: ${quote(field("description").value.trim())},
      price: ${Number(field("price").value)},
      oldPrice: ${field("oldPrice").value === "" ? "null" : Number(field("oldPrice").value)},
      inStock: ${field("inStock").checked},
      badges: ${JSON.stringify(badges)},
      image: ${quote(field("image").value.trim())},
      colors: createColors(${colors.map(quote).join(", ")}),
      imagesByColor: ${imagesByColorCode},
      specs: ${specsCode},
      imageAlt: ${quote(field("imageAlt").value.trim())},
      sortOrder: ${Number(field("sortOrder").value)}
    },`;
  }

  function fillExample() {
    form.reset();
    imageValues.clear();
    slugWasEdited = false;

    ["id", "slug", "brand", "name", "category", "categoryLabel", "description", "price", "oldPrice", "image", "imageAlt", "sortOrder"].forEach((name) => {
      field(name).value = EXAMPLE_PRODUCT[name];
    });
    field("inStock").checked = EXAMPLE_PRODUCT.inStock;

    form.querySelectorAll('input[name="badges"]').forEach((input) => {
      input.checked = EXAMPLE_PRODUCT.badges.includes(input.value);
    });
    form.querySelectorAll('input[name="colors"]').forEach((input) => {
      input.checked = EXAMPLE_PRODUCT.colors.includes(input.value);
    });
    Object.entries(EXAMPLE_PRODUCT.imagesByColor).forEach(([id, path]) => imageValues.set(id, path));

    specsList.innerHTML = "";
    EXAMPLE_PRODUCT.specs.forEach(addSpecRow);
    renderColorImages();
    validateColors();
    clearOutput();
  }

  function clearForm() {
    form.reset();
    imageValues.clear();
    slugWasEdited = false;
    specsList.innerHTML = "";
    addSpecRow();
    renderColorImages();
    colorsError.textContent = "";
    form.querySelector('input[name="colors"]').setCustomValidity("");
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

  specsList.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".remove-spec");
    if (!removeButton) return;
    removeButton.closest(".spec-row").remove();
  });

  document.querySelector("#add-spec").addEventListener("click", () => addSpecRow());
  document.querySelector("#fill-example").addEventListener("click", fillExample);
  document.querySelector("#clear-form").addEventListener("click", clearForm);
  copyButton.addEventListener("click", copyCode);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    validateColors();

    if (!form.reportValidity()) return;

    output.value = buildObjectCode();
    copyButton.disabled = false;
    copyStatus.textContent = "Объект готов";
    output.scrollTop = 0;
  });

  fillExample();
})();
