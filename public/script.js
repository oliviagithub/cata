// script.js
async function loadCatalog() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const container = document.getElementById('catalogo');
    container.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';

      const imgSrc = p.Foto ? p.Foto : '/images/placeholder.png';

      card.innerHTML = `
        <img src="${imgSrc}" alt="${p.Título}">
        <h3>${p.Título || 'Sin título'}</h3>
        <p><strong>Precio:</strong> ${p.Precio || '-'}</p>
        <p><strong>Dimensiones:</strong> ${p.Dimensiones || '-'}</p>
        <p><strong>Envío:</strong> ${p['Envío'] || '-'}</p>
        <p><a href="${p.Link || '#'}" target="_blank">Ver más</a></p>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    document.getElementById('catalogo').innerText = 'Error cargando productos.';
  }
}

document.addEventListener('DOMContentLoaded', loadCatalog);
