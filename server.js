import express from "express";
import session from "express-session";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "clave123",
    resave: false,
    saveUninitialized: false
  })
);

// -------------------------------
// Cargar Drive Map (carpetas)
// -------------------------------
const driveMap = JSON.parse(fs.readFileSync("driveMap.json", "utf-8"));

function getDriveURL(folderId, fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// -------------------------------
// Leer Excel
// -------------------------------
function loadExcel() {
  const wb = xlsx.readFile("catalog.xlsx");
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws);
}

// -------------------------------
// Guardar Excel
// -------------------------------
function saveExcel(data) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Catalogo");
  xlsx.writeFile(wb, "catalog.xlsx");
}

// -------------------------------
// LOGIN
// -------------------------------
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  if (req.body.password === process.env.ADMIN) {
    req.session.logged = true;
    return res.redirect("/admin");
  }
  res.render("login", { error: "Contraseña incorrecta" });
});

// -------------------------------
// ADMIN
// -------------------------------
app.get("/admin", (req, res) => {
  if (!req.session.logged) return res.redirect("/login");

  const items = loadExcel();
  res.render("admin", { items, categories: Object.keys(driveMap) });
});

app.post("/admin/save", (req, res) => {
  if (!req.session.logged) return res.send("No autorizado");

  let data = JSON.parse(req.body.data);
  saveExcel(data);
  res.send("OK");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// -------------------------------
// CATÁLOGO
// -------------------------------
app.get("/", (req, res) => {
  const items = loadExcel();

  // Convertimos cada fila en una URL real de Drive
  items.forEach(item => {
    const folderId = driveMap[item.Categoria];
    if (folderId && item.ImagenID) {
      item.ImagenURL = getDriveURL(folderId, item.ImagenID);
    } else {
      item.ImagenURL = "/noimage.jpg";
    }
  });

  res.render("catalog", {
    items,
    categories: Object.keys(driveMap)
  });
});

// -------------------------------
app.listen(process.env.PORT || 3000, () =>
  console.log("Servidor iniciado")
);
