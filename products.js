(function () {
  "use strict";

  const COLOR_OPTIONS = Object.freeze({
    graphite: { id: "graphite", name: "Графит", hex: "#2b292a" },
    black: { id: "black", name: "Чёрный", hex: "#151515" },
    wine: { id: "wine", name: "Бордовый", hex: "#611b32" },
    cream: { id: "cream", name: "Молочный", hex: "#e8dfd2" },
    sand: { id: "sand", name: "Песочный", hex: "#b89a73" },
    olive: { id: "olive", name: "Оливковый", hex: "#6f7151" },
    terracotta: { id: "terracotta", name: "Терракотовый", hex: "#a6533d" },
    steel: { id: "steel", name: "Стальной", hex: "#a6aaab" }
  });

  function createColors(...ids) {
    return ids.map((id) => ({ ...COLOR_OPTIONS[id] }));
  }

  function createProductArtwork(kind, label, accent) {
    const shapes = {
      set: `
        <g transform="translate(86 112)">
          <ellipse cx="112" cy="102" rx="94" ry="22" fill="#171515" opacity=".12"/>
          <path d="M12 52h70l-7 65c-1 12-11 21-23 21H39c-12 0-22-9-23-21Z" fill="url(#metal)"/>
          <ellipse cx="47" cy="52" rx="36" ry="10" fill="#242020"/><path d="M31 43c2-12 30-12 32 0" fill="none" stroke="#242020" stroke-width="6"/>
          <path d="M84 34h88l-8 84c-1 13-12 23-25 23h-22c-13 0-24-10-25-23Z" fill="url(#metal2)"/>
          <ellipse cx="128" cy="34" rx="45" ry="12" fill="#181616"/><path d="M108 23c2-15 38-15 41 0" fill="none" stroke="#181616" stroke-width="7"/>
          <path d="M163 68h62l-6 55c-1 11-10 19-21 19h-7c-11 0-20-8-21-19Z" fill="url(#metal)"/>
          <ellipse cx="194" cy="68" rx="32" ry="9" fill="#2a2525"/>
        </g>`,
      pot: `
        <g transform="translate(88 98)">
          <ellipse cx="112" cy="149" rx="108" ry="22" fill="#171515" opacity=".13"/>
          <path d="M20 54h184l-15 91c-3 18-18 31-36 31H72c-18 0-33-13-36-31Z" fill="url(#metal)"/>
          <ellipse cx="112" cy="54" rx="93" ry="25" fill="#1c1919"/>
          <ellipse cx="112" cy="50" rx="76" ry="16" fill="url(#lid)"/>
          <path d="M89 33c3-20 43-20 46 0" fill="none" stroke="#211d1d" stroke-width="9"/>
          <path d="M25 75H2c-13 0-18 13-18 24M199 75h23c13 0 18 13 18 24" fill="none" stroke="#211d1d" stroke-width="11" stroke-linecap="round"/>
          <text x="112" y="119" text-anchor="middle" fill="#f4eee7" font-family="Georgia,serif" font-size="34">A</text>
        </g>`,
      cauldron: `
        <g transform="translate(65 92)">
          <ellipse cx="135" cy="166" rx="119" ry="22" fill="#171515" opacity=".14"/>
          <path d="M24 59h222c-8 96-43 128-111 128S32 155 24 59Z" fill="url(#metal2)"/>
          <ellipse cx="135" cy="59" rx="112" ry="28" fill="#171515"/>
          <ellipse cx="135" cy="54" rx="91" ry="18" fill="url(#lid)"/>
          <path d="M112 34c3-22 44-22 47 0" fill="none" stroke="#211d1d" stroke-width="9"/>
          <path d="M31 80H2M239 80h29" stroke="#211d1d" stroke-width="12" stroke-linecap="round"/>
          <text x="135" y="130" text-anchor="middle" fill="#f4eee7" font-family="Georgia,serif" font-size="38">A</text>
        </g>`,
      pan: `
        <g transform="translate(48 77) rotate(-8 160 125)">
          <ellipse cx="131" cy="185" rx="108" ry="20" fill="#171515" opacity=".12"/>
          <ellipse cx="127" cy="116" rx="111" ry="92" fill="#1b1818"/>
          <ellipse cx="127" cy="110" rx="91" ry="73" fill="url(#metal)"/>
          <ellipse cx="127" cy="110" rx="66" ry="51" fill="#262222" opacity=".92"/>
          <path d="M218 110h110c18 0 18 26 0 26H214Z" fill="url(#metal2)"/>
          <rect x="289" y="113" width="42" height="20" rx="10" fill="#191616"/>
          <text x="127" y="124" text-anchor="middle" fill="#f4eee7" font-family="Georgia,serif" font-size="36">A</text>
        </g>`,
      saucepan: `
        <g transform="translate(58 94)">
          <ellipse cx="125" cy="159" rx="106" ry="20" fill="#171515" opacity=".13"/>
          <path d="M24 57h189l-13 93c-2 17-17 30-34 30H71c-17 0-32-13-34-30Z" fill="url(#metal)"/>
          <ellipse cx="118" cy="57" rx="95" ry="25" fill="#191717"/>
          <ellipse cx="118" cy="53" rx="77" ry="16" fill="url(#lid)"/>
          <path d="M96 36c3-18 42-18 45 0" fill="none" stroke="#211d1d" stroke-width="8"/>
          <path d="M207 73h118c18 0 18 27 0 27H204Z" fill="url(#metal2)"/>
          <rect x="288" y="76" width="40" height="21" rx="10" fill="#181515"/>
          <text x="118" y="128" text-anchor="middle" fill="#f4eee7" font-family="Georgia,serif" font-size="34">A</text>
        </g>`,
      tool: `
        <g transform="translate(80 80)">
          <ellipse cx="122" cy="185" rx="112" ry="19" fill="#171515" opacity=".12"/>
          <path d="M24 56h176v98H24Z" rx="10" fill="url(#metal)"/>
          <rect x="12" y="45" width="199" height="32" rx="12" fill="url(#metal2)" stroke="#282323" stroke-width="5"/>
          <circle cx="56" cy="61" r="10" fill="#2a2525"/><circle cx="167" cy="61" r="10" fill="#2a2525"/>
          <rect x="45" y="83" width="135" height="45" rx="6" fill="#201c1c"/>
          <path d="M62 128v62M83 128v69M104 128v63M125 128v70M146 128v60M167 128v66" stroke="#d9b46e" stroke-width="7" stroke-linecap="round"/>
          <path d="M202 75h58v12h-58M260 81h28" stroke="#201c1c" stroke-width="12" stroke-linecap="round"/>
          <path d="M45 154v20M178 154v20" stroke="#201c1c" stroke-width="12"/>
        </g>`
    };

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f8f5f0"/><stop offset="1" stop-color="#e8e0d8"/>
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#484040"/><stop offset=".46" stop-color="#171515"/><stop offset="1" stop-color="#373131"/>
          </linearGradient>
          <linearGradient id="metal2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#655959"/><stop offset=".5" stop-color="#211d1d"/><stop offset="1" stop-color="#423a3a"/>
          </linearGradient>
          <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#393333"/><stop offset=".5" stop-color="#6a5f5f"/><stop offset="1" stop-color="#252121"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#bg)"/>
        <circle cx="337" cy="58" r="94" fill="${accent}" opacity=".08"/>
        <path d="M0 330C105 292 235 369 400 313v87H0Z" fill="#fff" opacity=".55"/>
        ${shapes[kind] || shapes.pot}
        <text x="374" y="368" text-anchor="end" fill="#554c4c" font-family="Arial,sans-serif" font-size="10" letter-spacing="2">${label}</text>
      </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  window.AIDEMA_PRODUCTS = Object.freeze([
    {
      id: 1,
      slug: "chugunnyy-nabor-7-v-1",
      brand: "AIDEMA",
      name: "Чугунный набор AIDEMA 7-в-1",
      category: "sets",
      categoryLabel: "Наборы",
      description: "Полный комплект литой посуды для первых блюд, жаркого, выпечки и блюд на компанию.",
      price: 12990,
      oldPrice: 14990,
      inStock: true,
      badges: ["Хит", "Акция"],
      image: "assets/products/cast-7in1-graphite/cast-7in1-graphite-main.webp",
      colors: createColors("graphite", "black", "wine", "cream", "sand", "olive"),
      imagesByColor: {
  graphite: "assets/products/cast-7in1-graphite/cast-7in1-graphite-main.webp",
  wine: createProductArtwork("set", "7 · 1 SET", "#6f1831")     
    },
      specs: [
        { label: "Материал", value: "Литой чугун" },
        { label: "Комплектация", value: "7 предметов" },
        { label: "Назначение", value: "Для дома и кафе" }
      ],
      imageAlt: "Чугунный набор AIDEMA 7-в-1",
      sortOrder: 1
    },
    {
      id: 2,
      slug: "nabor-3-v-1",
      brand: "AIDEMA",
      name: "Набор AIDEMA 3-в-1",
      category: "sets",
      categoryLabel: "Наборы",
      description: "Компактный базовый набор для повседневной готовки — ничего лишнего, всё необходимое.",
      price: 6990,
      oldPrice: null,
      inStock: true,
      badges: [],
      image: createProductArtwork("set", "3 · 1 SET", "#9a6d39"),
      colors: createColors("graphite", "wine", "cream"),
      imagesByColor: {},
      specs: [
        { label: "Комплектация", value: "3 предмета" },
        { label: "Формат", value: "Компактный набор" },
        { label: "Назначение", value: "Ежедневная готовка" }
      ],
      imageAlt: "Набор посуды AIDEMA 3-в-1",
      sortOrder: 2
    },
    {
      id: 3,
      slug: "nabor-5-v-1",
      brand: "AIDEMA",
      name: "Набор AIDEMA 5-в-1",
      category: "sets",
      categoryLabel: "Наборы",
      description: "Универсальный набор для семьи: несколько объёмов для ежедневных и праздничных блюд.",
      price: 9490,
      oldPrice: null,
      inStock: true,
      badges: ["Хит"],
      image: createProductArtwork("set", "5 · 1 SET", "#6f1831"),
      colors: createColors("graphite", "black", "wine", "sand", "terracotta"),
      imagesByColor: {
        wine: createProductArtwork("set", "5 · 1 SET", "#6f1831")
      },
      specs: [
        { label: "Комплектация", value: "5 предметов" },
        { label: "Формат", value: "Семейный набор" },
        { label: "Уход", value: "Ручная мойка" }
      ],
      imageAlt: "Набор посуды AIDEMA 5-в-1",
      sortOrder: 3
    },
    {
      id: 4,
      slug: "kastryulya-7-l",
      brand: "LUMERA",
      name: "Кастрюля LUMERA 7 л",
      category: "pots",
      categoryLabel: "Кастрюли и казаны",
      description: "Вместительная кастрюля с плотной крышкой для супов, тушения и домашних заготовок.",
      price: 4290,
      oldPrice: null,
      inStock: true,
      badges: [],
      image: createProductArtwork("pot", "POT · 7 L", "#9a6d39"),
      colors: createColors("graphite", "cream", "olive", "terracotta"),
      imagesByColor: {},
      specs: [
        { label: "Объём", value: "7 литров" },
        { label: "Комплектация", value: "Кастрюля и крышка" },
        { label: "Назначение", value: "Супы и тушение" }
      ],
      imageAlt: "Кастрюля LUMERA объёмом 7 литров",
      sortOrder: 4
    },
    {
      id: 5,
      slug: "kazan-10-l",
      brand: "AIDEMA",
      name: "Казан AIDEMA 10 л",
      category: "pots",
      categoryLabel: "Кастрюли и казаны",
      description: "Глубокий казан для ароматного плова, мяса и блюд, которые любят неспешное томление.",
      price: 5690,
      oldPrice: null,
      inStock: true,
      badges: ["Хит"],
      image: createProductArtwork("cauldron", "KAZAN · 10 L", "#6f1831"),
      colors: createColors("graphite", "black"),
      imagesByColor: {},
      specs: [
        { label: "Объём", value: "10 литров" },
        { label: "Форма", value: "Глубокая" },
        { label: "Назначение", value: "Плов и томление" }
      ],
      imageAlt: "Казан AIDEMA объёмом 10 литров",
      sortOrder: 5
    },
    {
      id: 6,
      slug: "skovoroda-28-sm",
      brand: "AIDEMA",
      name: "Сковорода AIDEMA 28 см",
      category: "pans",
      categoryLabel: "Сковороды и сотейники",
      description: "Универсальный диаметр для сочного мяса, овощей и быстрых завтраков на всю семью.",
      price: 3190,
      oldPrice: 3690,
      inStock: true,
      badges: ["Акция"],
      image: createProductArtwork("pan", "PAN · 28 CM", "#6f1831"),
      colors: createColors("graphite", "black", "wine", "cream", "olive", "terracotta"),
      imagesByColor: {
        wine: createProductArtwork("pan", "PAN · 28 CM", "#6f1831")
      },
      specs: [
        { label: "Диаметр", value: "28 см" },
        { label: "Тип", value: "Универсальная" },
        { label: "Назначение", value: "Жарка и обжаривание" }
      ],
      imageAlt: "Сковорода AIDEMA диаметром 28 сантиметров",
      sortOrder: 6
    },
    {
      id: 7,
      slug: "soteynik",
      brand: "AIDEMA",
      name: "Сотейник AIDEMA",
      category: "pans",
      categoryLabel: "Сковороды и сотейники",
      description: "Глубокая форма для соусов, тушения и обжарки. Удобен для блюд с большим количеством ингредиентов.",
      price: 3490,
      oldPrice: null,
      inStock: true,
      badges: [],
      image: createProductArtwork("saucepan", "SAUTE PAN", "#9a6d39"),
      colors: createColors("graphite", "cream", "sand"),
      imagesByColor: {},
      specs: [
        { label: "Тип", value: "Глубокий сотейник" },
        { label: "Комплектация", value: "Сотейник и крышка" },
        { label: "Назначение", value: "Соусы и тушение" }
      ],
      imageAlt: "Сотейник AIDEMA с крышкой",
      sortOrder: 7
    },
    {
      id: 8,
      slug: "lapsherezka",
      brand: "CASA NOVA",
      name: "Лапшерезка CASA NOVA",
      category: "tools",
      categoryLabel: "Кухонные аксессуары",
      description: "Механическая машинка для ровной домашней лапши и пасты разной толщины.",
      price: 3990,
      oldPrice: null,
      inStock: true,
      badges: [],
      image: createProductArtwork("tool", "PASTA MAKER", "#6f1831"),
      colors: createColors("steel", "black"),
      imagesByColor: {},
      specs: [
        { label: "Механизм", value: "Ручной" },
        { label: "Материал корпуса", value: "Металл" },
        { label: "Назначение", value: "Лапша и паста" }
      ],
      imageAlt: "Механическая лапшерезка CASA NOVA",
      sortOrder: 8
    }
  ]);
})();
