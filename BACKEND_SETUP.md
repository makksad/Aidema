# AIDEMA Catalog — настройка Supabase (Phase 1)

На этом этапе Supabase хранит товары и авторизует администратора. Публичный каталог читает только опубликованные товары. Если Supabase не настроен, недоступен или вернул пустой список, сайт автоматически использует `products.js`.

## 1. Создать проект Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) и создайте проект.
2. Дождитесь окончания подготовки базы.
3. Откройте **Project Settings / API Keys** или диалог **Connect**.
4. Скопируйте:
   - Project URL → `SUPABASE_URL`;
   - Publishable key (или legacy `anon` key) → `SUPABASE_ANON_KEY`.

Publishable/anon key предназначен для браузера и работает только в пределах разрешений RLS. **Никогда не используйте в frontend `service_role`, secret key или пароль базы.** Подробнее: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 2. Заполнить конфигурацию

В проекте уже есть `supabase-config.js`. Заполните только два клиентских значения:

```js
window.AIDEMA_SUPABASE_CONFIG = Object.freeze({
  SUPABASE_URL: "https://PROJECT_REF.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_..."
});
```

Шаблон без значений находится в `supabase-config.example.js`.

Для опубликованного статического сайта `supabase-config.js` должен попасть в GitHub и Netlify. Publishable/anon key не является серверным секретом; безопасность обеспечивают Auth и RLS. Service role в этот файл добавлять нельзя.

## 3. Создать таблицы и RLS

1. В Supabase откройте **SQL Editor**.
2. Создайте новый запрос.
3. Скопируйте туда весь файл `supabase/schema.sql`.
4. Нажмите **Run**.

Скрипт создаёт:

- `public.products`;
- `public.admin_users`;
- автоматическое обновление `updated_at`;
- публичное чтение только строк `is_published = true`;
- INSERT/UPDATE/DELETE только для авторизованного пользователя из `admin_users`.

Официальное описание механизма: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Создать администратора

1. Откройте **Authentication → Users**.
2. Создайте пользователя с email и паролем.
3. Вернитесь в **SQL Editor** и выполните, заменив email:

```sql
insert into public.admin_users (user_id, email)
select id, email
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set email = excluded.email;
```

Успешного Auth-входа недостаточно: без этой записи RLS запретит изменение товаров. Вход в коде выполняется через `signInWithPassword`: [Supabase Auth documentation](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).

## 5. Открыть проект локально

Не открывайте страницы через `file://`. Из корня проекта запустите:

```powershell
python -m http.server 8000
```

Затем откройте:

- каталог: `http://localhost:8000/index.html`;
- admin-lite: `http://localhost:8000/admin.html`.

## 6. Добавить или обновить товар

1. Откройте `admin.html`.
2. Убедитесь, что статус Supabase — «Подключён».
3. Войдите email/password созданного администратора.
4. Заполните форму товара.
5. Для изображения используйте:
   - путь вида `assets/products/...`; или
   - публичный URL объекта из Supabase Storage.
6. Нажмите **Сохранить в Supabase**.

Сохранение выполняется по уникальному `slug`: новый slug создаёт товар, существующий slug обновляет его. Checkbox «Опубликован» управляет `is_published`.

Режим **Сгенерировать товар** остаётся независимым fallback: он формирует объект для ручной вставки в `products.js` и работает даже без Supabase.

## 7. Storage bucket `product-images`

Повторно выполните актуальный `supabase/schema.sql` в SQL Editor. Он автоматически:

- создаёт публичный bucket `product-images`;
- ограничивает размер файла до 1 МБ;
- разрешает JPG/JPEG, PNG и WebP;
- разрешает публичное чтение;
- разрешает INSERT/UPDATE/DELETE только authenticated-пользователю из `admin_users`.

Публичность bucket относится только к товарным изображениям. Загрузка и удаление всё равно защищены RLS. Официальная справка: [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).

Проверка загрузки:

1. Войдите в `admin.html` как администратор.
2. Выберите JPG/PNG/WebP до 1 МБ.
3. Нажмите «Загрузить фото».
4. Убедитесь, что появился preview и публичный URL автоматически попал в поле изображения.
5. Сохраните товар и откройте его в каталоге.

Для изображения цвета выберите цвет, затем используйте кнопку «Загрузить для цвета». URL попадёт в `images_by_color[colorId]`.

HEIC намеренно не конвертируется в браузере: предварительно преобразуйте его в WebP/JPG.

## 8. Проверить источник товаров

После добавления опубликованного товара перезагрузите `index.html` и выполните в DevTools Console:

```js
ProductService.getDataSource()
```

Ожидаемый результат:

- `"supabase"` — загружены строки из базы;
- `"local"` — используется fallback `products.js`.

Дополнительно источник записывается в атрибут `<html data-catalog-source="...">`.

Проверка fallback:

1. Временно очистите значения в `supabase-config.js` или отключите сеть.
2. Перезагрузите каталог.
3. Убедитесь, что старые товары, фильтры, цвета, модалка и WhatsApp продолжают работать.

Если таблица Supabase существует, но в ней нет опубликованных товаров, каталог также использует локальный список.

## 9. Обновить GitHub и Netlify

Проверьте, что в файлах нет `service_role`, secret key, паролей или пароля базы. Затем:

```powershell
git status
git add .
git commit -m "Add Supabase phase 2 storage and catalog management"
git push
```

Если Netlify уже подключён к этому GitHub-репозиторию, push в production branch запустит новый deploy автоматически. После deploy проверьте:

- главную страницу;
- источник через `ProductService.getDataSource()`;
- вход на `/admin.html`;
- создание тестового опубликованного товара;
- запрет сохранения для пользователя, которого нет в `admin_users`.

## 10. Управление товарами

После входа раздел «Товары из Supabase» показывает все товары, включая скрытые.

- **Редактировать** — заполняет текущую форму и переключает сохранение на UPDATE по UUID.
- **Скрыть** — устанавливает `is_published = false`.
- **Показать** — устанавливает `is_published = true`.
- **Удалить** — физически удаляет строку только после `confirm`.

После каждой операции список обновляется. Публичный каталог запрашивает только `is_published = true`.

## 11. WhatsApp-заявки

Актуальный SQL создаёт `public.order_requests`. Публичному клиенту разрешён только INSERT с `source = 'whatsapp'`; прочитать последние записи может только администратор.

При клике на товарную WhatsApp-кнопку сайт начинает сохранение события и в любом случае открывает WhatsApp. В admin-lite раздел «Заявки / WhatsApp-клики» показывает последние 50 записей.

Проверка RLS:

1. Выйдите из admin-lite и попробуйте выполнить `select` из `order_requests` с anon-клиентом — запрос должен быть запрещён.
2. Нажмите WhatsApp на публичном сайте — новая строка должна появиться.
3. Войдите администратором и нажмите «Обновить заявки» — строка должна отображаться.
4. Войдите Auth-пользователем, которого нет в `admin_users` — управление товарами, Storage и чтение заявок должны быть запрещены.

## 12. Обновление Phase 2

```powershell
git status
git add .
git commit -m "Add Supabase phase 2 storage and catalog management"
git push
```

После deploy проверьте загрузку фото, create/edit/hide/show/delete, WhatsApp-клик и мобильный каталог.

Пока не реализованы оплата, CRM, 1С, сложные роли, аудит действий и автоматическая конвертация HEIC.
