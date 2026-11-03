// =====================================================================
//  api.js (ตัวอย่าง Category + Product)
//  เทียบกับ frontend/api.js ต้นฉบับ: เปลี่ยนแค่ชื่อฟังก์ชันกับ path
// =====================================================================
const API_URL = 'http://localhost:3000';

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

// ---------- ตารางที่ 1: Categories ----------   (เดิม: Books, /books)
const getCategories  = ()         => request('/categories');
const getCategory    = (id)       => request('/categories/' + id);
const createCategory = (data)     => request('/categories', 'POST', data);
const updateCategory = (id, data) => request('/categories/' + id, 'PUT', data);
const deleteCategory = (id)       => request('/categories/' + id, 'DELETE');

// ---------- ตารางที่ 2: Products ----------     (เดิม: Reviews, /reviews)
const getProducts   = ()         => request('/products');
const getProduct    = (id)       => request('/products/' + id);
const createProduct = (data)     => request('/products', 'POST', data);
const updateProduct = (id, data) => request('/products/' + id, 'PUT', data);
const deleteProduct = (id)       => request('/products/' + id, 'DELETE');

// ---------- อัปโหลดไฟล์ (ไม่ต้องแก้) ----------
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(API_URL + '/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || 'อัปโหลดไม่สำเร็จ');
  return data; // { url: "/uploads/xxx.jpg" }
}

function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : API_URL + path;
}
