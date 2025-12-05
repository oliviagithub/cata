# Catálogo Node.js + Excel

Repositorio generado automáticamente: contiene un servidor Express que sirve un catálogo público y un panel admin.

## Instrucciones rápidas

1. Copiar el contenido en una carpeta.
2. Renombrar `.env.example` a `.env` y ajustar PASSWORD_ADMIN y SESSION_SECRET.
3. Ejecutar:
   ```
   npm install
   npm start
   ```
4. Abrir `http://localhost:3000/` para ver el catálogo y `http://localhost:3000/admin.html` para el admin.

El servidor crea `productos.xlsx` si no existe.
