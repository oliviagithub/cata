// ===========================
//  SERVIDOR CATÁLOGO PRODUCTOS
// ===========================
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ===========================
// CONFIGURACIÓN BÁSICA
// ===========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// ===========================
// SESIÓN (compatible con Render)
// ===========================
app.set("trust proxy", 1);
app.use(
  session({
    secret: "clave-super-secreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60, // 1h
    },
  })
);

// ===========================
// CONFIGURACIÓN
// ===========================
const PASSWORD = process.env.ADMIN_PASSWORD || "1234";
const EXCEL_PATH = path.join(__dirname, "productos.xlsx");

// ===========================
// RUTAS API
// ===========================

// 🔹 Ruta pública: catálogo (cualquiera puede verla)
app.get("/api/products", async (req, res) => {
  try {
    if (!fs.existsSync(EXCEL_PATH))
      return res.status(404).json({ error: "Archivo productos.xlsx no encontrado" });

    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    res.json(data);
  } catch (err) {
    console.error("Error leyendo Excel:", err);
    res.status(500).json({ error: "Error leyendo archivo" });
  }
});

// 🔹 Login administrador
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Contraseña incorrecta" });
  }
});

// 🔹 Logout administrador
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// 🔹 Ruta protegida: guardar productos (solo admin)
app.post("/api/save", async (req, res) => {
  if (!req.session.loggedIn)
    return res.status(401).json({ error: "No autorizado" });

  try {
    const { products } = req.body;
    const ws = xlsx.utils.json_to_sheet(products);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Productos");
    xlsx.writeFile(wb, EXCEL_PATH);
    res.json({ success: true });
  } catch (err) {
    console.error("Error guardando Excel:", err);
    res.status(500).json({ error: "Error guardando archivo" });
  }
});

// ===========================
// RUTAS HTML
// ===========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ===========================
// SERVIDOR
// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
