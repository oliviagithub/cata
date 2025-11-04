// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const XLSX_PATH = path.join(__dirname, 'productos.xlsx');

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// session
app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret_dev',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hora
}));

// multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const upload = multer({ storage });

// utilidad: leer productos desde xlsx (devuelve array de objetos)
function readProducts() {
  if (!fs.existsSync(XLSX_PATH)) {
    const wb = XLSX.utils.book_new();
    const aoa = [['Foto', 'Título', 'Precio', 'Dimensiones', 'Envío', 'Link']];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, XLSX_PATH);
  }

  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return json;
}

// utilidad: escribir productos (array de objetos) en xlsx
function writeProducts(productsArray) {
  const ws = XLSX.utils.json_to_sheet(productsArray, { header: ['Foto','Título','Precio','Dimensiones','Envío','Link'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, XLSX_PATH);
}

// auth middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

// rutas API

// obtener productos (público)
app.get('/api/products', (req, res) => {
  try {
    const prods = readProducts();
    res.json(prods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo productos' });
  }
});

// login (simple)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Falta password' });

  if (password === process.env.PASSWORD_ADMIN) {
    req.session.authenticated = true;
    return res.json({ ok: true });
  } else {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
});

// logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// subir imagen (admin)
app.post('/api/upload-image', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const relPath = '/images/' + path.basename(req.file.path);
  res.json({ url: relPath, filename: path.basename(req.file.path) });
});

// guardar productos (admin) — espera array de objetos
app.post('/api/save', requireAuth, (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) return res.status(400).json({ error: 'products debe ser un array' });

  const normalized = products.map(p => ({
    Foto: p.Foto || '',
    Título: p.Título || '',
    Precio: p.Precio || '',
    Dimensiones: p.Dimensiones || '',
    Envío: p.Envío || '',
    Link: p.Link || ''
  }));

  try {
    writeProducts(normalized);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando' });
  }
});

// iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
