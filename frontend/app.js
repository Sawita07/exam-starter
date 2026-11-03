// =====================================================================
//  app.js — ตรรกะหน้าเว็บ: ดึงข้อมูล -> วาดตาราง -> รับฟอร์ม -> เรียก api.js
//  รูปแบบที่ใช้ซ้ำทุกตาราง:
//    1) loadXxx()   ดึงข้อมูลแล้ววาดลง HTML ด้วย innerHTML
//    2) submit ฟอร์ม -> ถ้ามี id = แก้ไข (PUT), ไม่มี id = เพิ่ม (POST) -> loadXxx() ใหม่
//    3) ปุ่มแก้ไข = เอาค่าใส่ฟอร์ม, ปุ่มลบ = confirm แล้ว DELETE -> loadXxx() ใหม่
// =====================================================================

// ตัวช่วยสั้น ๆ
const $ = (id) => document.getElementById(id);

function showMessage(text) {
  const box = $('message');
  box.textContent = text;
  box.style.display = 'block';
  setTimeout(() => (box.style.display = 'none'), 2500);
}

// กัน HTML แปลก ๆ จากข้อมูลผู้ใช้ (เช่นพิมพ์ <script>)
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let currentCoverUrl = null;   // path รูปปกที่จะบันทึก
let selectedBook = null;      // หนังสือที่กำลังดูรีวิว

// =====================================================================
//  ตารางที่ 1: BOOKS
// =====================================================================
async function loadBooks() {
  try {
    const books = await getBooks();
    $('book-list').innerHTML = books.map((b) => `
      <tr>
        <td>${b.coverUrl ? `<img class="cover" src="${imageUrl(b.coverUrl)}">` : '<div class="cover"></div>'}</td>
        <td>${esc(b.title)}</td>
        <td>${esc(b.author)}</td>
        <td>${b.publishedYear ?? '-'}</td>
        <td>${b.isAvailable ? '✅ ว่าง' : '❌ ถูกยืม'}</td>
        <td>${b.reviews ? b.reviews.length : 0}</td>
        <td>
          <button onclick="showReviews(${b.id})" class="secondary">รีวิว</button>
          <button onclick="editBook(${b.id})">แก้ไข</button>
          <button onclick="removeBook(${b.id})" class="danger">ลบ</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="7">ยังไม่มีข้อมูล</td></tr>';
  } catch (err) {
    showMessage('โหลดข้อมูลไม่ได้: ' + err.message + ' (เปิด backend หรือยัง?)');
  }
}

// เลือกไฟล์ปก -> อัปโหลดทันที -> เก็บ url ไว้ใช้ตอนกดบันทึก
$('cover').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = await uploadFile(file);
    currentCoverUrl = data.url;
    $('cover-preview').src = imageUrl(data.url);
    $('cover-preview').hidden = false;
    showMessage('อัปโหลดรูปสำเร็จ');
  } catch (err) {
    showMessage(err.message);
  }
});

// กดบันทึกฟอร์มหนังสือ
$('book-form').addEventListener('submit', async (e) => {
  e.preventDefault();                       // กันหน้า refresh
  const id = $('book-id').value;
  const data = {
    title: $('title').value,
    author: $('author').value,
    publishedYear: $('publishedYear').value ? Number($('publishedYear').value) : null,
    isAvailable: $('isAvailable').checked,
    coverUrl: currentCoverUrl,
  };
  try {
    if (id) {
      await updateBook(id, data);           // มี id = แก้ไข
      showMessage('แก้ไขสำเร็จ');
    } else {
      await createBook(data);               // ไม่มี id = เพิ่มใหม่
      showMessage('เพิ่มสำเร็จ');
    }
    resetBookForm();
    loadBooks();
  } catch (err) {
    showMessage(err.message);
  }
});

// กดแก้ไข -> ดึงข้อมูลเล่มนั้นมาใส่ฟอร์ม
async function editBook(id) {
  const b = await getBook(id);
  $('book-id').value = b.id;
  $('title').value = b.title;
  $('author').value = b.author;
  $('publishedYear').value = b.publishedYear ?? '';
  $('isAvailable').checked = b.isAvailable;
  currentCoverUrl = b.coverUrl;
  $('cover-preview').src = imageUrl(b.coverUrl);
  $('cover-preview').hidden = !b.coverUrl;
  $('book-form-title').textContent = 'แก้ไขหนังสือ #' + b.id;
  $('book-cancel').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function removeBook(id) {
  if (!confirm('ลบหนังสือเล่มนี้?')) return;
  try {
    await deleteBook(id);
    showMessage('ลบแล้ว');
    if (selectedBook && selectedBook.id === id) $('review-section').hidden = true;
    loadBooks();
  } catch (err) {
    showMessage(err.message);
  }
}

function resetBookForm() {
  $('book-form').reset();
  $('book-id').value = '';
  currentCoverUrl = null;
  $('cover-preview').hidden = true;
  $('book-form-title').textContent = 'เพิ่มหนังสือ';
  $('book-cancel').hidden = true;
}
$('book-cancel').addEventListener('click', resetBookForm);

// =====================================================================
//  ตารางที่ 2: REVIEWS (ของหนังสือที่เลือก)
// =====================================================================
async function showReviews(bookId) {
  selectedBook = await getBook(bookId);
  $('review-book-title').textContent = selectedBook.title;
  $('review-section').hidden = false;
  resetReviewForm();
  loadReviews();
  $('review-section').scrollIntoView({ behavior: 'smooth' });
}

let reviews = [];             // เก็บรีวิวที่โหลดล่าสุด ไว้ใช้ตอนกดแก้ไข

async function loadReviews() {
  reviews = await getReviews(selectedBook.id);
  $('review-list').innerHTML = reviews.map((r) => `
    <li>
      ${'★'.repeat(r.rating)} — ${esc(r.content)}
      <button onclick="editReview(${r.id})">แก้ไข</button>
      <button onclick="removeReview(${r.id})" class="danger">ลบ</button>
    </li>`).join('') || '<li>ยังไม่มีรีวิว</li>';
}

$('review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('review-id').value;
  const data = { rating: Number($('rating').value), content: $('content').value };
  try {
    if (id) await updateReview(id, data);
    else await createReview({ ...data, bookId: selectedBook.id });
    resetReviewForm();
    loadReviews();
    loadBooks();                            // อัปเดตจำนวนรีวิวในตาราง
  } catch (err) {
    showMessage(err.message);
  }
});

function editReview(id) {
  const r = reviews.find((x) => x.id === id);
  $('review-id').value = r.id;
  $('rating').value = r.rating;
  $('content').value = r.content;
  $('review-submit').textContent = 'บันทึกการแก้ไข';
}

async function removeReview(id) {
  if (!confirm('ลบรีวิวนี้?')) return;
  await deleteReview(id);
  loadReviews();
  loadBooks();
}

function resetReviewForm() {
  $('review-form').reset();
  $('review-id').value = '';
  $('review-submit').textContent = 'เพิ่มรีวิว';
}

// เริ่มต้น: โหลดรายการหนังสือทันทีที่เปิดหน้า
loadBooks();
