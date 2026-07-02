# Изображения товаров

Сохраняйте фотографии товаров в этой папке, желательно в формате WebP. Удобная схема имени: `product-slug-color-id.webp`.

Пример привязки изображения к цвету в `products.js`:

```js
image: "assets/products/chugunnyy-nabor-7-v-1.webp",
colors: createColors("graphite", "wine"),
imagesByColor: {
  graphite: "assets/products/chugunnyy-nabor-7-v-1-graphite.webp",
  wine: "assets/products/chugunnyy-nabor-7-v-1-wine.webp"
}
```

Ключ в `imagesByColor` должен совпадать с `id` цвета. Если файла для выбранного цвета нет, каталог покажет основное изображение из `image`.
