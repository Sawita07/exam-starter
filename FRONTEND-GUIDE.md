# คู่มือต่อหน้าเว็บ (HTML/CSS ของอาจารย์ + JS ของเรา)

ทำหลัง backend ผ่านแล้วเท่านั้น (เปิด `http://localhost:3000/ชื่อpath` ได้ `[]`)
ตัวอย่างเสร็จแล้ว: `examples/category-product/frontend/` (index.html ของอาจารย์ + api.js + app.js)

---

## ขั้น F1: เอาไฟล์อาจารย์มาวาง

1. ในโฟลเดอร์ `frontend` **ลบ** `index.html` กับ `style.css` ของเรา (เก็บ `api.js`, `app.js` ไว้)
2. ก๊อปไฟล์ HTML / CSS / รูป ของอาจารย์ทั้งหมดมาวางใน `frontend`
3. หน้าหลักต้องชื่อ `index.html` (ถ้าชื่ออื่นก็เข้า `http://localhost:3000/ชื่อไฟล์.html`)
4. เปิด HTML อาจารย์ ก่อน `</body>` ใส่:
   ```html
   <script src="api.js"></script>
   <script src="app.js"></script>
   ```
5. เปิด `http://localhost:3000` ต้องเห็นหน้าของอาจารย์ (ยังกดไม่ได้ ไม่เป็นไร)

---

## ขั้น F2: แก้ `frontend/api.js` (ง่ายสุด)

Ctrl+H แทนชื่อเหมือนฝั่ง backend:

| หา | แทนด้วย (ตัวอย่าง) |
| --- | --- |
| `'/books` | `'/categories` |
| `Books` | `Categories` |
| `Book` | `Category` |
| `'/reviews` | `'/products` |
| `Reviews` | `Products` |
| `Review` | `Product` |

ทำตามลำดับนี้ (`Books` ก่อน `Book`) แล้วเช็กว่ามีครบ 5 ฟังก์ชันต่อตาราง: `getXxxs`, `getXxx`, `createXxx`, `updateXxx`, `deleteXxx` ถ้าตารางลูกยังไม่มี `getProduct(id)` ให้เพิ่มเอง (ดูในตัวอย่าง)
`uploadFile` กับ `imageUrl` ไม่ต้องแก้

---

## ขั้น F3: จด id จาก HTML ของอาจารย์

เปิด HTML อาจารย์ Ctrl+F หา `id="` แล้วจดลงตารางนี้ (ถ้าไม่มี id ให้เติมเองใน HTML)

| ใช้ทำอะไร | ตารางแม่ | ตารางลูก |
| --- | --- | --- |
| `<form>` | `id=______` | `id=______` |
| `<input type="hidden">` เก็บ id ตอนแก้ไข (ไม่มีก็เติมเอง) | | |
| ช่องกรอกแต่ละ field | | |
| `<select>` เลือกตารางแม่ (อยู่ในฟอร์มลูก) | — | |
| `<input type="file">` | | |
| `<img>` แสดงตัวอย่างรูป | | |
| ปุ่มบันทึก / ยกเลิก | | |
| `<tbody>` ที่จะวางแถวข้อมูล | | |

ตัวอย่าง (HTML อาจารย์จำลอง):
`categoryForm, categoryId, categoryName, categorySubmitBtn, categoryCancelBtn, categoryTableBody`
`productForm, productId, productName, productPrice, productCategory, productImage, productImagePreview, productSubmitBtn, productCancelBtn, productTableBody`

---

## ขั้น F4: เขียน `frontend/app.js`

**วิธีที่เร็วที่สุด:** ก๊อป `examples/category-product/frontend/app.js` มาทับ แล้วแก้ 3 อย่าง:
1. id ใน `$('...')` ให้ตรงกับที่จดในขั้น F3
2. ชื่อ field (`name`, `price`, `categoryId`, `imageUrl`) ให้ตรง Swagger
3. ชื่อฟังก์ชัน API (`getCategories`, `createProduct` ...) ให้ตรงกับ api.js

### โครงที่ใช้ซ้ำทุกตาราง (เข้าใจ 4 ข้อนี้พอ)

```js
// 1) โหลด -> วาดแถวลง <tbody>
async function loadXxx() {
  const items = await getXxxs();
  $('xxxTableBody').innerHTML = items.map((x) => `
    <tr>
      <td>${x.field1}</td>
      <td>${x.field2}</td>
      <td>
        <button onclick="editXxx(${x.id})">แก้ไข</button>
        <button onclick="removeXxx(${x.id})">ลบ</button>
      </td>
    </tr>`).join('');
}

// 2) กดบันทึก: มี id = PUT, ไม่มี id = POST
$('xxxForm').addEventListener('submit', async (e) => {
  e.preventDefault();                         // กันหน้า refresh
  const id = $('xxxId').value;
  const data = { field1: $('xxxField1').value, field2: Number($('xxxField2').value) };
  if (id) await updateXxx(id, data);
  else await createXxx(data);
  $('xxxForm').reset(); $('xxxId').value = '';
  loadXxx();
});

// 3) กดแก้ไข: เอาค่าใส่ฟอร์ม
async function editXxx(id) {
  const x = await getXxx(id);
  $('xxxId').value = x.id;
  $('xxxField1').value = x.field1;
}

// 4) กดลบ
async function removeXxx(id) {
  if (!confirm('ลบ?')) return;
  await deleteXxx(id);
  loadXxx();
}

loadXxx();   // โหลดตอนเปิดหน้า
```

### ของเพิ่มสำหรับตารางลูก

**dropdown เลือกตารางแม่** (ใส่ใน loadแม่):
```js
$('productCategory').innerHTML = '<option value="">-- เลือก --</option>' +
  categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
```
ตอนบันทึกส่ง `categoryId: Number($('productCategory').value)`

**แสดงชื่อแม่ในตารางลูก:** `${p.category ? p.category.name : '-'}` (backend ส่ง `category` มาให้แล้วจาก include)

**อัปโหลดรูป:**
```js
let currentImageUrl = null;
$('productImage').addEventListener('change', async (e) => {
  const data = await uploadFile(e.target.files[0]);   // ส่งไป POST /upload
  currentImageUrl = data.url;                          // เก็บไว้
  $('productImagePreview').src = imageUrl(data.url);   // โชว์ตัวอย่าง
});
// ตอนบันทึกใส่ imageUrl: currentImageUrl ใน data
// ในตาราง: <img src="${imageUrl(p.imageUrl)}">
```

---

## ขั้น F5: ทดสอบ

เปิด `http://localhost:3000` → ลองเพิ่มแม่ → เพิ่มลูก (เลือกแม่ + รูป) → แก้ไข → ลบ

F12 → **Console** ดู error แดง / **Network** ดูว่ายิง path ไหน status อะไร

| อาการ | แก้ |
| --- | --- |
| `Cannot read properties of null (reading 'addEventListener')` | id ใน `$('...')` ไม่ตรงกับ HTML |
| `getXxx is not defined` | ชื่อฟังก์ชันใน app.js ไม่ตรงกับ api.js / ลืมใส่ `<script src="api.js">` |
| กดบันทึกแล้วหน้า refresh | ลืม `e.preventDefault()` หรือ id ของ form ผิด |
| 400 ตอนบันทึก | ชื่อ field ใน `data` ไม่ตรงกับที่ backend รับ / ไม่ได้เลือกแม่ |
| ตารางไม่ขึ้นแต่ไม่มี error | id ของ `<tbody>` ผิด / ไม่ได้เรียก `loadXxx()` ท้ายไฟล์ |
