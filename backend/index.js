// =====================================================================
//  Backend: Express + Prisma + SQLite + อัปโหลดไฟล์ (multer)
//  รัน:  npm install  ->  npx prisma db push  ->  node index.js
//  เปิด: http://localhost:3000/books
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
//  ตารางที่ 1: BOOKS   (CRUD ครบ 5 แบบ)
// =====================================================================

// GET /books  ดึงทั้งหมด (พร้อม reviews)
app.get('/books', async (req, res) => {
  const books = await prisma.book.findMany({
    include: { reviews: true },
    orderBy: { id: 'desc' },
  });
  res.json(books); // 200
});

// GET /books/:id  ดึงเล่มเดียว
app.get('/books/:id', async (req, res) => {
  const book = await prisma.book.findUnique({
    where: { id: toId(req.params.id) },
    include: { reviews: true },
  });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  res.json(book);
});

// POST /books  เพิ่มใหม่ -> 201
app.post('/books', async (req, res) => {
  const { title, author, publishedYear, isAvailable, coverUrl } = req.body;
  if (!title || !author) return res.status(400).json({ message: 'ต้องมี title และ author' });

  const book = await prisma.book.create({
    data: {
      title,
      author,
      publishedYear: publishedYear ? Number(publishedYear) : null,
      isAvailable: isAvailable === undefined ? true : Boolean(isAvailable),
      coverUrl: coverUrl || null,
    },
  });
  res.status(201).json(book);
});

// PUT /books/:id  แก้ไข
app.put('/books/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.book.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Book not found' });

  const { title, author, publishedYear, isAvailable, coverUrl } = req.body;
  const book = await prisma.book.update({
    where: { id },
    data: {
      // ส่งมาเฉพาะ field ไหน ก็แก้เฉพาะ field นั้น (undefined = ไม่แก้)
      title,
      author,
      publishedYear: publishedYear === undefined ? undefined : publishedYear ? Number(publishedYear) : null,
      isAvailable: isAvailable === undefined ? undefined : Boolean(isAvailable),
      coverUrl,
    },
  });
  res.json(book);
});

// DELETE /books/:id  ลบ (reviews ของเล่มนี้ถูกลบตามเพราะ onDelete: Cascade)
app.delete('/books/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.book.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Book not found' });

  await prisma.book.delete({ where: { id } });
  res.json({ message: 'Deleted', id });
});

// =====================================================================
//  ตารางที่ 2: REVIEWS   (CRUD ครบ + ผูกกับ Book ผ่าน bookId)
// =====================================================================

// GET /reviews  ดึงทั้งหมด (แนบชื่อหนังสือมาด้วย)   ?bookId=1 = กรองเฉพาะเล่ม
app.get('/reviews', async (req, res) => {
  const where = req.query.bookId ? { bookId: toId(req.query.bookId) } : {};
  const reviews = await prisma.review.findMany({
    where,
    include: { book: { select: { id: true, title: true } } },
    orderBy: { id: 'desc' },
  });
  res.json(reviews);
});

// GET /reviews/:id
app.get('/reviews/:id', async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: toId(req.params.id) } });
  if (!review) return res.status(404).json({ message: 'Review not found' });
  res.json(review);
});

// POST /reviews   body: { bookId, rating, content }
// POST /books/:id/reviews   body: { rating, content }   (สองแบบนี้ทำงานเหมือนกัน)
async function createReview(req, res) {
  const bookId = toId(req.params.id ?? req.body.bookId);
  const { rating, content } = req.body;

  const book = await prisma.book.findUnique({ where: { id: bookId || 0 } });
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (!(Number(rating) >= 1 && Number(rating) <= 5)) {
    return res.status(400).json({ message: 'rating ต้องอยู่ระหว่าง 1-5' });
  }

  const review = await prisma.review.create({
    data: { rating: Number(rating), content: content || '', bookId },
  });
  res.status(201).json(review);
}
app.post('/reviews', createReview);
app.post('/books/:id/reviews', createReview);

// PUT /reviews/:id
app.put('/reviews/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.review.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Review not found' });

  const { rating, content } = req.body;
  const review = await prisma.review.update({
    where: { id },
    data: {
      rating: rating === undefined ? undefined : Number(rating),
      content,
    },
  });
  res.json(review);
});

// DELETE /reviews/:id
app.delete('/reviews/:id', async (req, res) => {
  const id = toId(req.params.id);
  const found = await prisma.review.findUnique({ where: { id } });
  if (!found) return res.status(404).json({ message: 'Review not found' });

  await prisma.review.delete({ where: { id } });
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
