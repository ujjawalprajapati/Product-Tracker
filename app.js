const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const alertArea = document.getElementById("alertArea");
const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const productHistoryBody = document.getElementById("productHistoryBody");
const currentProductSection = document.getElementById("currentProductSection");
const historySection = document.getElementById("historySection");

let products = JSON.parse(localStorage.getItem("products") || "[]");
let history = JSON.parse(localStorage.getItem("history") || "[]");

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user && pass) {
    loginSection.classList.add("hide");
    dashboardSection.classList.remove("hide");
    checkExpiringProducts();
    renderProducts();
    renderHistory();
  } else {
    alert("Please enter username and password");
  }
}

function logout() {
  dashboardSection.classList.add("hide");
  loginSection.classList.remove("hide");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  document.body.classList.toggle("sidebar-open");
});

document.getElementById("alertDays").addEventListener("input", checkExpiringProducts);

function showSection(id) {
  currentProductSection.classList.add("hide");
  historySection.classList.add("hide");
  document.getElementById(id).classList.remove("hide");
  sidebar.classList.remove("open");
  document.body.classList.remove("sidebar-open");
}

productForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value;
  const expiry = document.getElementById("productExpiry").value;
  const quantity = document.getElementById("productQuantity").value;
  const price = document.getElementById("productPrice").value;
  const newProduct = { name, expiry, quantity, price, status: "active" };
  products.push(newProduct);
  localStorage.setItem("products", JSON.stringify(products));
  productForm.reset();
  renderProducts();
  checkExpiringProducts();
  showAlert("Product added successfully", "success");
});

function renderProducts() {
  productTableBody.innerHTML = "";
  let total = 0;
  let hasProduct = false;
  const today = new Date();
  const searchText = document.getElementById("searchInput").value.toLowerCase();

  products.forEach((p, index) => {
    const expiryDate = new Date(p.expiry);
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (p.status === "active" && p.name.toLowerCase().includes(searchText)) {
      hasProduct = true;
      total += parseFloat(p.price*p.quantity);
      const row = `
        <tr>
          <td class="notCenter">${p.name}</td>
          <td>${p.expiry}</td>
          <td>${diffDays >= 0 ? diffDays : 'Expired'}</td>
          <td>${p.quantity}</td>
          <td>₹${p.price}</td>
          <td>₹${p.price*p.quantity}</td>
          <td><button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${index})">Delete</button></td>
        </tr>`;
      productTableBody.innerHTML += row;
    }
  });

  document.getElementById("totalPrice").innerText = `₹${total.toFixed(2)}`;
  if (!hasProduct) {
    productTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No item available.</td></tr>';
  }
}

function deleteProduct(index) {
  const deleted = { ...products[index], status: "deleted" };
  history.push(deleted);
  products.splice(index, 1);
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("history", JSON.stringify(history));
  renderProducts();
  renderHistory();
  showAlert("Product deleted successfully", "danger");
}

function renderHistory() {
  productHistoryBody.innerHTML = "";
  if (history.length === 0) {
    productHistoryBody.innerHTML = '<tr><td colspan="4" class="text-center">No product history available.</td></tr>';
  } else {
    history.forEach((h) => {
      const row = `
        <tr>
          <td class="notCenter">${h.name}</td>
          <td>${h.expiry}</td>
          <td>${h.quantity}</td>
          <td>₹${h.price}</td>
          <td>₹${h.price*h.quantity}</td>
          <td>${h.status}</td>
        </tr>`;
      productHistoryBody.innerHTML += row;
    });
  }
}

function checkExpiringProducts() {
  const today = new Date();
  const alertDays = parseInt(document.getElementById("alertDays").value || "5");
  let hasChanges = false;

  alertArea.innerHTML = "";

  products.forEach((p) => {
    const expiryDate = new Date(p.expiry);
    const diff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diff <= alertDays && diff >= 0 && p.status === "active") {
      showAlert(`Product <strong>${p.name}</strong> will expire in ${diff} day(s)!`, "warning");
    }

    if (expiryDate < today && p.status === "active") {
      p.status = "expired";
      history.push(p);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    products = products.filter(p => p.status === "active");
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("history", JSON.stringify(history));
    renderProducts();
    renderHistory();
  }
}

function showAlert(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = "alert";
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertArea.appendChild(alert);
  setTimeout(() => { alert.classList.remove("show"); }, 60000);
}

function deleteHistory() {
  if (confirm("Are you sure you want to delete all product history?")) {
    history = [];
    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
    showAlert("Product history deleted.", "danger");
  }
}

function exportProductCSV() {
  if (products.length === 0) {
    alert("No Product to export.");
    return;
  }

  let csv = "Name,Expiry,Quantity,Price,TotalPrice\n";
  products.forEach(p => {
    csv += `${p.name},${p.expiry},${p.quantity},${p.price},${p.price*p.quantity}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportHistoryCSV() {
  if (history.length === 0) {
    alert("No history to export.");
    return;
  }

  let csv = "Name,Expiry,Quantity,Price,TotalPrice,Status\n";
  history.forEach(h => {
    csv += `${h.name},${h.expiry},${h.quantity},${h.price},${h.price*h.quantity},${h.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-history.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
