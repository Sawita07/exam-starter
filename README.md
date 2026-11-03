# ชุดเริ่มต้นสอบ: CRUD 2 ตาราง + อัปโหลดไฟล์

Backend = Express + Prisma + SQLite + multer  |  Frontend = HTML + JavaScript ล้วน (fetch)

```
exam-starter/
├─ backend/
│  ├─ prisma/schema.prisma   ← หน้าตาตาราง (แก้ที่นี่ก่อนเสมอ)
│  ├─ index.js               ← API ทั้งหมด (routes)
│  └─ uploads/               ← ไฟล์ที่อัปโหลดมาอยู่ที่นี่
└─ frontend/
   ├─ index.html             ← หน้าเว็บ (ตอนสอบใช้ของอาจารย์แทน)
   ├─ api.js                 ← ฟังก์ชัน fetch คุยกับ backend
   └─ app.js                 ← โหลดข้อมูล → วาดตาราง → รับฟอร์ม
```

---

## 0. ภาพรวม (อ่าน 1 นาที)

```
หน้าเว็บ (app.js)  --เรียก-->  api.js  --fetch-->  Backend (index.js)  --Prisma-->  SQLite (dev.db)
```

- **หน้าเว็บ** กดปุ่ม → เรียกฟังก์ชันใน `api.js` เช่น `createBook(data)`
- **api.js** ยิง `fetch('http://localhost:3000/books', { method: 'POST', body: JSON })`
- **index.js** รับที่ `app.post('/books', ...)` → สั่ง `prisma.book.create(...)` → ตอบ JSON กลับ
- **อัปโหลดไฟล์**: เลือกไฟล์ → `uploadFile(file)` ส่ง FormData ไป `POST /upload` → ได้ `{ url: "/uploads/xxx.jpg" }` → เอา url นี้ไปเก็บใน field `coverUrl` ตอนบันทึก

| ทำอะไร | Method | Path | ตอบ |
| --- | --- | --- | --- |
| ดึงทั้งหมด | GET | `/books` | 200 |
| ดึงอันเดียว | GET | `/books/:id` | 200 / 404 |
| เพิ่ม | POST | `/books` | **201** |
| แก้ไข | PUT | `/books/:id` | 200 / 404 |
| ลบ | DELETE | `/books/:id` | 200 / 404 |
| อัปโหลด | POST | `/upload` (form-data field `file`) | 201 |

ตาราง `reviews` มีครบเหมือนกัน (`/reviews`, `/reviews/:id`, `POST /books/:id/reviews`)

---

## 1. วิธีรัน (ทำตามลำดับ)

เปิด Terminal 1 — backend
```bash
cd backend
npm install
npx prisma db push        # สร้างตารางใน dev.db
node index.js             # หรือ npm run dev (รีสตาร์ทเองเวลาแก้โค้ด)
```
ทดสอบ: เปิด http://localhost:3000/books ต้องเห็น `[]`

Frontend — ดับเบิลคลิกเปิด `frontend/index.html` ในเบราว์เซอร์ได้เลย
(หรือใช้ VS Code extension **Live Server** คลิกขวา → Open with Live Server)

---

## 2. ตอนสอบ: เปลี่ยนเป็นตารางตามโจทย์ (สมมติโจทย์คือ Category + Product)

### ขั้นที่ 1 — แก้ `backend/prisma/schema.prisma`
- เปลี่ยน `model Book` → `model Category`, `model Review` → `model Product` (หรือตามชื่อในโจทย์/Swagger)
- เปลี่ยนชื่อ field ให้ตรง Swagger เช่น `name String`, `price Float`, `imageUrl String?`
- ตารางลูกต้องมี `categoryId Int` + `category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)`
- ตารางแม่ต้องมี `products Product[]`
- แล้วรัน:
```bash
npx prisma db push
```
(ถ้า error ว่าข้อมูลเก่าชนกัน ให้ลบไฟล์ `prisma/dev.db` แล้ว push ใหม่)

ชนิดข้อมูลที่ใช้บ่อย: `String` ข้อความ, `Int` จำนวนเต็ม, `Float` ทศนิยม (ราคา), `Boolean` จริง/เท็จ, `DateTime` วันเวลา, เติม `?` = ไม่บังคับ

### ขั้นที่ 2 — แก้ `backend/index.js` ด้วย Find & Replace (Ctrl+H)
ทำทีละคำ เปิด "Match Case" (Aa) ด้วย:
| หา | แทนด้วย |
| --- | --- |
| `prisma.book` | `prisma.category` |
| `/books` | `/categories` |
| `Book not found` | `Category not found` |
| `prisma.review` | `prisma.product` |
| `/reviews` | `/products` |
| `bookId` | `categoryId` |
| `include: { reviews: true }` | `include: { products: true }` |

แล้วแก้รายชื่อ field ในบรรทัด `const { title, author, ... } = req.body;` และใน `data: { ... }` ให้ตรงกับ schema ใหม่ (มีอยู่ใน POST และ PUT ของแต่ละตาราง)

**ทดสอบทุก endpoint ด้วย Postman ก่อนไปทำหน้าเว็บ**

### ขั้นที่ 3 — ต่อหน้าเว็บของอาจารย์
1. เอา `api.js` กับ `app.js` ไปวางในโฟลเดอร์เดียวกับ HTML ของอาจารย์ แล้วใส่ท้าย `<body>`:
   ```html
   <script src="api.js"></script>
   <script src="app.js"></script>
   ```
2. `api.js`: เปลี่ยน path ให้ตรง Swagger (`/books` → `/categories` ฯลฯ)
3. `app.js`: เปลี่ยน id ใน `$('...')` ให้ตรงกับ `id="..."` ใน HTML ของอาจารย์ และเปลี่ยนชื่อ field
   - เปิด HTML ของอาจารย์ดูว่าช่องกรอก/ตาราง/ปุ่ม มี `id` อะไร
   - ถ้าไม่มี id ให้เติม `id="..."` เองใน HTML
4. กด F12 → แท็บ **Console** ดู error สีแดง, แท็บ **Network** ดูว่ายิง API ไปถูก path ไหม status อะไร

---

## 3. ใช้ Swagger ของอาจารย์ให้คุ้ม

**ดูสเปก**: ใน Swagger ดู (1) path + method ทั้งหมด (2) ชื่อ field ใน request body (3) response หน้าตาแบบไหน → ใช้แก้ขั้นที่ 1–2 ให้ตรง

**ทดสอบ backend**: ปุ่ม **Try it out** → **Execute** ใน Swagger (ถ้า server URL ชี้ localhost:3000) หรือใช้ Postman

**ให้ Postman เขียนโค้ด fetch ให้**:
1. Postman → **Import** → ลากไฟล์ swagger/openapi (`.json`/`.yaml`) หรือวางลิงก์ → ได้ทุก request เป็น Collection
2. เปิด request ไหนก็ได้ → กดไอคอน **`</>`** (Code) ด้านขวา → เลือก **JavaScript - Fetch**
3. คัดลอกโค้ดมาใช้ใน `api.js` (หรือแค่ดู path/body ให้ถูก)

**ทดสอบอัปโหลดใน Postman**: Body → **form-data** → Key = `file` เปลี่ยนชนิดเป็น **File** → เลือกรูป → Send

---

## 4. Error ที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| Console: `blocked by CORS policy` | backend ไม่มี `app.use(cors())` หรือยังไม่ได้รัน backend |
| `Failed to fetch` | backend ไม่ได้รัน หรือ API_URL / port ผิด |
| `req.body` เป็น undefined | ขาด `app.use(express.json())` หรือ frontend ไม่ได้ส่ง header `Content-Type: application/json` |
| อัปโหลดแล้ว `req.file` undefined | ชื่อ field ใน FormData ไม่ตรงกับ `upload.single('file')` |
| `The table ... does not exist` | ยังไม่ได้รัน `npx prisma db push` |
| `Unknown argument 'xxx'` จาก Prisma | ส่ง field ที่ไม่มีใน schema → เช็กชื่อ field ใน `data: {}` |
| `Argument ... Expected Int, provided String` | ค่าจาก form/URL เป็น string → ครอบ `Number(...)` / `parseInt(...)` |
| รูปไม่ขึ้น | `<img src>` ต้องเป็น `http://localhost:3000/uploads/...` (ใช้ฟังก์ชัน `imageUrl()`) |
| `EADDRINUSE :3000` | รัน backend ซ้อน 2 ตัว → ปิด Terminal เก่า |
| แก้โค้ด backend แล้วไม่เปลี่ยน | ต้องรีสตาร์ท (Ctrl+C แล้ว `node index.js`) หรือใช้ `npm run dev` |
