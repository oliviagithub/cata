// admin.js
let products = [];

function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k,v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k,v);
  });
  children.flat().forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
  return e;
}

async function doLogin() {
  const password = document.getElementById('password').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error('No autorizado');
    document.getElementById('loginSection').classList.add('oculto');
    document.getElementById('adminPanel').classList.remove('oculto');
    await loadProductsIntoEditor();
  } catch (err) {
    msg.textContent = 'Contraseña incorrecta';
  }
}

async function loadProductsIntoEditor() {
  const res = await fetch('/api/products');
  products = await res.json();
  renderTable();
}

function renderTable() {
  const tabla = document.getElementById('tabla');
  tabla.innerHTML = '';
  const header = el('tr', {}, 
    el('th', {}, 'Foto (ruta o /images/nombre.jpg)'),
    el('th', {}, 'Título'),
    el('th', {}, 'Precio'),
    el('th', {}, 'Dimensiones'),
    el('th', {}, 'Envío'),
    el('th', {}, 'Link'),
    el('th', {}, 'Acciones')
  );
  tabla.appendChild(header);

  products.forEach((p, idx) => {
    const tr = el('tr', {});
    const makeInput = (value, key) => {
      const input = el('input', { value: value || '' });
      input.addEventListener('input', () => { p[key] = input.value; });
      return el('td', {}, input);
    };
    tr.appendChild(makeInput(p.Foto, 'Foto'));
    tr.appendChild(makeInput(p.Título, 'Título'));
    tr.appendChild(makeInput(p.Precio, 'Precio'));
    tr.appendChild(makeInput(p.Dimensiones, 'Dimensiones'));
    tr.appendChild(makeInput(p['Envío'], 'Envío'));
    tr.appendChild(makeInput(p.Link, 'Link'));

    const delBtn = el('button', {}, 'Eliminar');
    delBtn.addEventListener('click', () => {
      products.splice(idx, 1);
      renderTable();
    });
    tr.appendChild(el('td', {}, delBtn));
    tabla.appendChild(tr);
  });
}

document.getElementById('loginBtn').addEventListener('click', doLogin);

document.getElementById('addRow').addEventListener('click', () => {
  products.push({ Foto: '', Título: '', Precio: '', Dimensiones: '', 'Envío': '', Link: '' });
  renderTable();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ products })
    });
    if (!res.ok) throw new Error('Error guardando');
    alert('Guardado correctamente en productos.xlsx');
  } catch (err) {
    console.error(err);
    alert('Error guardando (ver consola)');
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
});

document.getElementById('uploadImageBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('imageInput');
  if (!fileInput.files || fileInput.files.length === 0) { alert('Seleccioná una imagen'); return; }
  const file = fileInput.files[0];
  const form = new FormData();
  form.append('image', file);

  try {
    const res = await fetch('/api/upload-image', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Error subiendo');
    const data = await res.json();
    document.getElementById('uploadResult').textContent = `Subida: ${data.url}`;
  } catch (err) {
    console.error(err);
    alert('Error subiendo imagen (debe estar logueado)');
  }
});
