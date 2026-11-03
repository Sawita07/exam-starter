// =====================================================================
//  app.js (ตัวอย่าง Category + Product) ต่อกับ HTML ของอาจารย์
//  id ทุกตัวใน $('...') มาจาก id="..." ใน index.html ของอาจารย์
// =====================================================================
const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// =====================================================================
//  ตารางที่ 1: CATEGORIES
// =====================================================================
async function loadCategories() {
  try {
    const categories = await getCategories();

    // 1) วาดตาราง  (HTML อาจารย์: <tbody id="categoryTableBody">, 4 คอลัมน์)
    $('categoryTableBody').innerHTML = categories.map((c) => `
      <tr>
        <td>${c.id}</td>
        <td>${esc(c.name)}</td>
        <td>${c.products ? c.products.length : 0}</td>
        <td>
          <button class="btn small" onclick="editCategory(${c.id})">แก้ไข</button>
          <button class="btn small danger" onclick="removeCategory(${c.id})">ลบ</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="4">ยังไม่มีข้อมูล</td></tr>';

    // 2) เติมตัวเลือกใน dropdown หมวดหมู่ของฟอร์มสินค้า  (<select id="productCategory">)
    const selected = $('productCategory').value;
    $('productCategory').innerHTML = '<option value="">-- เลือกหมวดหมู่ --</option>' +
      categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('productCategory').value = selected;
  } catch (err) {
    alert('โหลดหมวดหมู่ไม่ได้: ' + err.message);
  }
}

$('categoryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('categoryId').value;
  const data = { name: $('categoryName').value };
  try {
    if (id) await updateCategory(id, data);
    else await createCategory(data);
    resetCategoryForm();
    loadCategories();
    loadProducts();          // ชื่อหมวดในตารางสินค้าอาจเปลี่ยน
  } catch (err) {
    alert(err.message);
  }
});

async function editCategory(id) {
  const c = await getCategory(id);
  $('categoryId').value = c.id;
  $('categoryName').value = c.name;
  $('categorySubmitBtn').textContent = 'บันทึกการแก้ไข';
}

async function removeCategory(id) {
  if (!confirm('ลบหมวดหมู่นี้? (สินค้าในหมวดจะถูกลบด้วย)')) return;
  try {
    await deleteCategory(id);
    loadCategories();
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

function resetCategoryForm() {
  $('categoryForm').reset();
  $('categoryId').value = '';
  $('categorySubmitBtn').textContent = 'บันทึก';
}
$('categoryCancelBtn').addEventListener('click', resetCategoryForm);

// =====================================================================
//  ตารางที่ 2: PRODUCTS (มีรูป)
// =====================================================================
let currentImageUrl = null;   // url รูปที่อัปโหลดแล้ว รอบันทึก

async function loadProducts() {
  try {
    const products = await getProducts();
    // HTML อาจารย์: <tbody id="productTableBody">, 5 คอลัมน์ (รูป, ชื่อ, ราคา, หมวด, จัดการ)
    $('productTableBody').innerHTML = products.map((p) => `
      <tr>
        <td>${p.imageUrl ? `<img src="${imageUrl(p.imageUrl)}">` : '<div class="thumb"></div>'}</td>
        <td>${esc(p.name)}</td>
        <td>${Number(p.price).toFixed(2)}</td>
        <td>${p.category ? esc(p.category.name) : '-'}</td>
        <td>
          <button class="btn small" onclick="editProduct(${p.id})">แก้ไข</button>
          <button class="btn small danger" onclick="removeProduct(${p.id})">ลบ</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="5">ยังไม่มีข้อมูล</td></tr>';
  } catch (err) {
    alert('โหลดสินค้าไม่ได้: ' + err.message);
  }
}

// เลือกรูป -> อัปโหลดทันที -> เก็บ url ไว้  (<input type="file" id="productImage">)
$('productImage').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = await uploadFile(file);
    currentImageUrl = data.url;
    $('productImagePreview').src = imageUrl(data.url);
  } catch (err) {
    alert(err.message);
  }
});

$('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('productId').value;
  const data = {
    name: $('productName').value,
    price: Number($('productPrice').value),
    categoryId: Number($('productCategory').value),
    imageUrl: currentImageUrl,
  };
  try {
    if (id) await updateProduct(id, data);
    else await createProduct(data);
    resetProductForm();
    loadProducts();
    loadCategories();        // จำนวนสินค้าในตารางหมวดเปลี่ยน
  } catch (err) {
    alert(err.message);
  }
});

async function editProduct(id) {
  const p = await getProduct(id);
  $('productId').value = p.id;
  $('productName').value = p.name;
  $('productPrice').value = p.price;
  $('productCategory').value = p.categoryId;
  currentImageUrl = p.imageUrl;
  $('productImagePreview').src = imageUrl(p.imageUrl);
  $('productSubmitBtn').textContent = 'บันทึกการแก้ไข';
}

async function removeProduct(id) {
  if (!confirm('ลบสินค้านี้?')) return;
  try {
    await deleteProduct(id);
    loadProducts();
    loadCategories();
  } catch (err) {
    alert(err.message);
  }
}

function resetProductForm() {
  $('productForm').reset();
  $('productId').value = '';
  currentImageUrl = null;
  $('productImagePreview').removeAttribute('src');
  $('productSubmitBtn').textContent = 'บันทึก';
}
$('productCancelBtn').addEventListener('click', resetProductForm);

// เริ่มต้น
loadCategories();
loadProducts();
