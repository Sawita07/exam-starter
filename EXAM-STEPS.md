# ขั้นตอนตอนสอบ (ทำตามลำดับ)

> พิมพ์คำสั่งใน Terminal **ทีละบรรทัด** แล้วกด Enter ทีละครั้ง

## 0. เช็กเครื่อง
```
node -v
```
```
git --version
```
ขึ้นเลขเวอร์ชันทั้งคู่ = พร้อม

## 1. Clone โค้ดมา
```
cd D:\
```
(ถ้าเครื่องไม่มีไดรฟ์ D ใช้ `cd Desktop` แทน)
```
git clone https://github.com/Sawita07/exam-starter.git 67160453
```
(เปลี่ยน `67160453` เป็นชื่อโฟลเดอร์ที่อาจารย์สั่ง)

## 2. เปิดโฟลเดอร์
VS Code → **File → Open Folder** → เลือกโฟลเดอร์ `67160453`

## 3. ดู Swagger ของอาจารย์
จดไว้: ชื่อตาราง 2 ตาราง / ชื่อ field + ชนิด / path ทั้งหมด / field อัปโหลดไฟล์ชื่ออะไร

## 4. แก้ `backend/prisma/schema.prisma`
เปลี่ยน model + field ให้ตรงโจทย์ (ดู README ข้อ 2)
ชนิด: `String` ข้อความ, `Int` จำนวนเต็ม, `Float` ทศนิยม, `Boolean`, `DateTime`, เติม `?` = ไม่บังคับ

## 5. แก้ `backend/index.js`
Ctrl+H (เปิด Aa) แทนที่ชื่อตาราง/path ตาม README ข้อ 2
แล้วแก้ชื่อ field ใน `req.body` และ `data: { }` ของ POST กับ PUT ทั้ง 2 ตาราง

## 6. รัน backend
```
cd backend
```
```
npm install
```
```
npx prisma db push
```
```
node index.js
```
ต้องขึ้น `API พร้อมแล้ว: http://localhost:3000`
- แก้ schema.prisma → รัน `npx prisma db push` ใหม่
- แก้ index.js → Ctrl+C แล้ว `node index.js` ใหม่
- ถ้า db push error เรื่องข้อมูลเก่า → ลบไฟล์ `backend/prisma/dev.db` แล้ว push ใหม่

## 7. ทดสอบด้วย Postman
- GET `http://localhost:3000/ชื่อตาราง` ต้องได้ `[]`
- POST: Body → raw → JSON
- อัปโหลด: Body → form-data → Key `file` เปลี่ยนเป็น File → เลือกรูป
- Swagger → Postman: Import ไฟล์ swagger แล้วกด `</>` → JavaScript - Fetch ได้โค้ด fetch

## 8. หน้าเว็บ
1. เอา HTML/CSS ของอาจารย์ไปวางในโฟลเดอร์ `frontend` (หน้าหลักตั้งชื่อ `index.html`)
2. ท้าย `<body>` ใส่
   ```html
   <script src="api.js"></script>
   <script src="app.js"></script>
   ```
3. `api.js` แก้ path ให้ตรง Swagger
4. `app.js` แก้ `$('...')` ให้ตรงกับ `id` ใน HTML ของอาจารย์ + แก้ชื่อ field
5. เปิด Chrome → **http://localhost:3000**

## 9. ติด error
F12 → **Console** (ข้อความแดง) และ **Network** (ยิง path ไหน status อะไร)
ดูตาราง error ใน README ข้อ 4

## Terminal ค้างอยู่กับ backend จะพิมพ์คำสั่งอื่น?
กด **+** ที่แผง Terminal เปิดอันใหม่ (อย่าปิด backend)
