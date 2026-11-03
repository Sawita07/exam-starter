// =====================================================================
//  Backend: Express + Prisma + SQLite + อัปโหลดไฟล์ (multer)
//  รัน:  npm install  ->  npx prisma db push  ->  node index.js
//  เปิด: http://localhost:3000/categories
// =====================================================================
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors());            // ให้หน้าเว็บ (คนละ port/เปิดไฟล์ html ตรง ๆ) เรียก API ได้
app.use(express.json());    // อ่าน JSON ใน req.body (ไม่มีบรรทัดนี้ req.body = undefined)
app.use(express.static(path.join(__dirname, '../frontend')));  // เปิดหน้าเว็บที่ http://localhost:3000

// ---------------------------------------------------------------------
//  อัปโหลดไฟล์ (multer) — ไฟล์ไปอยู่ในโฟลเดอร์ uploads/
// ---------------------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำ และเก็บนามสกุลเดิมไว้ (.jpg .png)
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // ไม่เกิน 5 MB

// เปิดให้เข้าดูไฟล์ที่อัปโหลดได้ เช่น http://localhost:3000/uploads/123.jpg
app.use('/uploads', express.static(UPLOAD_DIR));

// POST /upload  (form-data, field ชื่อ "file")  -> คืน { url: "/uploads/xxx.jpg" }
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'ไม่พบไฟล์ (field ต้องชื่อ file)' });
  res.status(201).json({ url: '/uploads/' + req.file.filename, name: req.file.originalname });
});

// ตัวช่วย: แปลง id จาก URL (เป็น string) ให้เป็นตัวเลข
const toId = (v) => parseInt(v, 10);

// =====================================================================
//  ตารางที่ 1: CATEGORIES   (CRUD ครบ 5 แบบ)
// =====================================================================

// GET /categories  ดึงทั้งหมด (พร้อม products)
app.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    include: { products: true },
    orderBy: { id: 'desc' },
  });
  res.json(categories); // 200
});

// GET /categories/:id  ดึงเล่มเดียว
app.get('/categories/:id', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: toId(req.params.id) },
    include: { products: true },
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
});

// POST /categories  เพิ่มใหม่ -> 201
app.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'ต้องมี name' });

  const category = await prisma.category.create({ data: { name } });
  res.status(201).json(category);
});

// PUT /categories/:id  แก้ไข
app.put('/categories/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.category.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Category not found' });

  const { name } = req.body;
  const category = await prisma.category.update({ where: { id }, data: { name } });
  res.json(category);
});

// DELETE /categories/:id  ลบ (products ในหมวดนี้ถูกลบตามเพราะ onDelete: Cascade)
app.delete('/categories/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.category.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Category not found' });

  await prisma.category.delete({ where: { id } });
  res.json({ message: 'Deleted', id });
});

// =====================================================================
//  ตารางที่ 2: PRODUCTS   (CRUD ครบ + ผูกกับ Category ผ่าน categoryId)
// =====================================================================

// GET /products  ดึงทั้งหมด (แนบชื่อหนังสือมาด้วย)   ?categoryId=1 = กรองเฉพาะเล่ม
app.get('/products', async (req, res) => {
  const where = req.query.categoryId ? { categoryId: toId(req.query.categoryId) } : {};
  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { id: true, name: true } } },
    orderBy: { id: 'desc' },
  });
  res.json(products);
});

// GET /products/:id
app.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: toId(req.params.id) } });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// POST /products   body: { categoryId, name, price, imageUrl }
// POST /categories/:id/products   body: { name, price, imageUrl }   (สองแบบนี้ทำงานเหมือนกัน)
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

// PUT /products/:id
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

// DELETE /products/:id
app.delete('/products/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.product.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Product not found' });

  await prisma.product.delete({ where: { id } });
  res.json({ message: 'Deleted', id });
});

// =====================================================================
//  404 + Error handler (ต้องอยู่ท้ายสุดเสมอ)
// =====================================================================
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`API พร้อมแล้ว: http://localhost:${PORT}`));
