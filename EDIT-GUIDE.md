# คู่มือแก้ backend ให้เป็นตารางตามโจทย์ (ขั้น B–C)

ตัวอย่างที่ทำเสร็จแล้วเปิดเทียบได้ที่ `examples/category-product/` (schema.prisma, index.js, swagger.yaml)

---

## ขั้น A: อ่าน Swagger แล้วจด

เปิด Swagger (ลิงก์ของอาจารย์ / editor.swagger.io / เปิดไฟล์ yaml ใน VS Code) แล้วจด:

```
ตารางแม่:  ______   path /______   field: ______
ตารางลูก:  ______   path /______   field: ______ , ______Id
อัปโหลด:   POST /______   field ชื่อ ______
```

- ชื่อ path ดูที่รายการ GET/POST ด้านบน
- field ดูที่ **Schemas** ล่างสุด (ไม่ต้องจด `id`, ไม่ต้องจด field ที่เป็น `[ตารางอื่น]`)
- ตารางที่มี field `xxxId` = ตารางลูก

---

## ขั้น B: แก้ `backend/prisma/schema.prisma`

ลบ `model Book` กับ `model Review` (เก็บ `generator` กับ `datasource`) แล้วเขียนใหม่

| Swagger | Prisma |
| --- | --- |
| `id` | `id Int @id @default(autoincrement())` (ทุกตาราง) |
| `string` | `String` |
| `integer` | `Int` |
| `number` | `Float` |
| `boolean` | `Boolean` |
| `date-time` | `DateTime` |
| `nullable` / ไม่อยู่ใน required | เติม `?` เช่น `String?` |

**เติมเองเสมอ 2 บรรทัด (ความสัมพันธ์ 1 ต่อหลาย):**

ในตารางลูก (ใต้ `แม่Id Int`):
```prisma
แม่ตัวเล็ก   แม่ @relation(fields: [แม่Id], references: [id], onDelete: Cascade)
```
ในตารางแม่:
```prisma
ลูกตัวเล็กs   ลูก[]
```
ตัวอย่าง: `category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)` และ `products Product[]`

แล้วรัน `npx prisma db push`
- error `missing an opposite relation field` = ลืมบรรทัดฝั่งแม่
- error เรื่องข้อมูลเก่า = ลบ `prisma/dev.db` แล้ว push ใหม่

---

## ขั้น C1: Ctrl+H แทนชื่อตาราง ใน `backend/index.js`

กด Ctrl+H (หรือกดลูกศร `>` ข้างช่องค้นหา) → เปิดปุ่ม **Aa** → พิมพ์ 2 ช่อง → กด **Replace All** (ปุ่มขวาสุดของช่องล่าง หรือ Ctrl+Alt+Enter)

ชื่อตารางเก่าโผล่ในโค้ด 5 แบบ เปลี่ยนให้ครบทั้งตารางแม่และลูก:

| แบบ | หา (ตารางแม่) | แทนด้วย | หา (ตารางลูก) | แทนด้วย |
| --- | --- | --- | --- | --- |
| คำสั่ง Prisma (ชื่อ model ตัวเล็ก) | `prisma.book` | `prisma.____` | `prisma.review` | `prisma.____` |
| path จาก Swagger | `/books` | `/____` | `/reviews` | `/____` |
| ข้อความ error | `Book not found` | `____ not found` | `Review not found` | `____ not found` |
| ชื่อความสัมพันธ์ | `include: { reviews: true }` | `include: { ____s: true }` | | |
| Foreign Key | `bookId` | `____Id` | | |

ตัวอย่าง Category/Product: `prisma.book→prisma.category`, `/books→/categories`, `Book not found→Category not found`, `include: { reviews: true }→include: { products: true }`, `prisma.review→prisma.product`, `/reviews→/products`, `Review not found→Product not found`, `bookId→categoryId`

กด Ctrl+S → แท็บ index.js ต้องมีตัว **M**

> หลัง C1 ยังเจอคำว่า `book` / `review` ใน **ชื่อตัวแปร** (`const book = ...`) หรือ **คอมเมนต์** ได้ ไม่เป็นไร โค้ดยังทำงาน แต่ถ้าเจอใน `include: { book:` หรือ field อย่าง `title`, `rating` ต้องแก้ (ขั้น C2–C3)

---

## ขั้น C2: แก้ field ของตารางแม่ (2 จุด)

Ctrl+F หา `app.post('/ชื่อpathแม่'` และ `app.put('/ชื่อpathแม่/:id'` แล้วแก้ 2 ที่ในแต่ละก้อน:
1. บรรทัด `const { ... } = req.body;` → ใส่ชื่อ field ใหม่
2. ใน `data: { ... }` → ใส่ชื่อ field ใหม่ (ตัวเลขครอบ `Number(...)`, boolean ครอบ `Boolean(...)`)
3. บรรทัดเช็ก `if (!title || !author)` → เปลี่ยนเป็น field บังคับของโจทย์

ตัวอย่าง (Category มี name อย่างเดียว):
```js
app.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'ต้องมี name' });

  const category = await prisma.category.create({ data: { name } });
  res.status(201).json(category);
});

app.put('/categories/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.category.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Category not found' });

  const { name } = req.body;
  const category = await prisma.category.update({ where: { id }, data: { name } });
  res.json(category);
});
```

---

## ขั้น C3: แก้ field ของตารางลูก (3 จุด)

**จุด 1** — Ctrl+F หา `include: { book:` (ใน GET ของตารางลูก) แก้เป็นชื่อตารางแม่ + field ชื่อของแม่:
```js
    include: { category: { select: { id: true, name: true } } },
```

**จุด 2** — หา `async function createReview` แทนตั้งแต่บรรทัดนั้นถึง `app.post('/.../:id/...', createReview);`:
```js
async function createProduct(req, res) {
  const categoryId = toId(req.params.id ?? req.body.categoryId);
  const { name, price, imageUrl } = req.body;

  const category = await prisma.category.findUnique({ where: { id: categoryId || 0 } });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  if (!name || price === undefined) return res.status(400).json({ message: 'ต้องมี name และ price' });

  const product = await prisma.product.create({
    data: { name, price: Number(price), imageUrl: imageUrl || null, categoryId },
  });
  res.status(201).json(product);
}
app.post('/products', createProduct);
app.post('/categories/:id/products', createProduct);
```

**จุด 3** — หา `app.put('/pathลูก/:id'` แทนทั้งก้อน:
```js
app.put('/products/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.product.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Product not found' });

  const { name, price, imageUrl, categoryId } = req.body;
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      price: price === undefined ? undefined : Number(price),
      imageUrl,
      categoryId: categoryId === undefined ? undefined : Number(categoryId),
    },
  });
  res.json(product);
});
```

รูปแบบใน PUT: `field: field === undefined ? undefined : Number(field)` = "ส่งมาก็แก้ ไม่ส่งก็ไม่แก้"

---

## ขั้น D: รันและทดสอบ

```
cd backend
npm install
npx prisma db push
node index.js
```
เปิด `http://localhost:3000/ชื่อpathแม่` และ `/ชื่อpathลูก` ต้องเห็น `[]` → ทดสอบ POST/PUT/DELETE/upload ด้วย Postman
