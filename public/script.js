let modified = {};

document.querySelectorAll(".input").forEach(input => {
  input.addEventListener("input", () => {
    let row = input.dataset.row;
    let col = input.dataset.col;

    if (!modified[row]) modified[row] = {};
    modified[row][col] = input.value;
  });
});

function save() {
  fetch("/admin/save", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(JSON.stringify(getUpdatedData()))
  })
    .then(r => r.text())
    .then(alert);
}

function getUpdatedData() {
  let rows = [];
  document.querySelectorAll("tr").forEach((tr, i) => {
    if (i === 0) return;
    let obj = {};
    tr.querySelectorAll(".input").forEach(input => {
      obj[input.dataset.col] = input.value;
    });
    rows.push(obj);
  });
  return rows;
}
