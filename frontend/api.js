// =====================================================================
//  api.js — ฟังก์ชันคุยกับ backend ทั้งหมดอยู่ที่นี่
//  ตอนสอบ: แก้ API_URL และ path ให้ตรงกับ Swagger ของอาจารย์
//  (ทุกฟังก์ชันใช้ fetch แบบเดียวกัน แค่เปลี่ยน method / path / body)
// =====================================================================
const API_URL = 'http://localhost:3000';

// ตัวกลางเรียก API: ส่ง JSON ไป แล้วแปลงคำตอบเป็น JSON กลับมา
// ถ้า status ไม่ใช่ 2xx จะ throw error พร้อมข้อความจาก backend
async function request(path, method = 'GET', body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(API_URL + path, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || 'Error ' + res.status);
  return data;
}

// ---------- ตารางที่ 1: Books ----------
const getBooks   = ()         => request('/books');
const getBook    = (id)       => request('/books/' + id);
const createBook = (data)     => request('/books', 'POST', data);
const updateBook = (id, data) => request('/books/' + id, 'PUT', data);
const deleteBook = (id)       => request('/books/' + id, 'DELETE');

// ---------- ตารางที่ 2: Reviews ----------
const getReviews   = (bookId)   => request('/reviews' + (bookId ? '?bookId=' + bookId : ''));
const createReview = (data)     => request('/reviews', 'POST', data); // data = { bookId, rating, content }
const updateReview = (id, data) => request('/reviews/' + id, 'PUT', data);
const deleteReview = (id)       => request('/reviews/' + id, 'DELETE');

// ---------- อัปโหลดไฟล์ ----------
// ไฟล์ต้องส่งแบบ FormData (ห้ามใส่ Content-Type เอง browser จะใส่ให้)
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);               // ชื่อ "file" ต้องตรงกับ upload.single('file') ฝั่ง backend
  const res = await fetch(API_URL + '/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || 'อัปโหลดไม่สำเร็จ');
  return data;                             // { url: "/uploads/xxx.jpg" }
}

// แปลง path รูปเป็น URL เต็ม เพื่อใส่ใน <img src>
function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : API_URL + path;
}
