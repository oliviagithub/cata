// Productos públicos (para catálogo y panel)
app.get('/api/products', async (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, 'productos.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    res.json(data);
  } catch (err) {
    console.error('Error leyendo Excel:', err);
    res.status(500).json({ error: 'Error leyendo archivo' });
  }
});
