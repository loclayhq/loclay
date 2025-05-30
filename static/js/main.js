let allProducts = [];
let selectedLocation = "";
let selectedStores = ["Target", "Marshalls", "Burlington"];

async function loadProducts() {
  try {
    const res = await fetch('/products.json');
    allProducts = await res.json();
  } catch (err) {
    console.error("Failed to load products.json:", err);
  }
}

function setLocation() {
  const zipInput = document.getElementById("zipcode");
  selectedLocation = zipInput.value.trim().toLowerCase();
}

function searchProducts() {
  const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();
  const listDiv = document.getElementById("product-list");

  const storeCheckboxes = document.querySelectorAll('input[type="checkbox"]');
  selectedStores = Array.from(storeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  listDiv.innerHTML = "";

  const filtered = allProducts.filter(product => {
    const titleMatch = product.title.toLowerCase().includes(searchInput);
    const storeMatch = selectedStores.length === 0 || selectedStores.some(store =>
      product.store.toLowerCase().includes(store.toLowerCase())
    );
    
    // New zip logic
    const locationMatch = selectedLocation === "" || product.store.toLowerCase().includes(selectedLocation);

    return titleMatch && locationMatch && storeMatch;
  });

  if (filtered.length === 0) {
    listDiv.innerHTML = "<p>No matching products found.</p>";
    return;
  }

  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}" />
      <h3>${product.title}</h3>
      <p class="price">${product.price}</p>
    `;
    listDiv.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadProducts);
