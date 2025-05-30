let allProducts = [];

async function loadProducts() {
  try {
    const res = await fetch('/products.json');
    allProducts = await res.json();
  } catch (err) {
    console.error("Failed to load products.json:", err);
  }
}

async function smartSearch() {
  const query = document.getElementById("searchInput").value.trim();
  const zipInput = document.getElementById("zipcode").value.trim().toLowerCase();
  const listDiv = document.getElementById("product-list");

  listDiv.innerHTML = "<p>Searching with AI...</p>";

  // If no query at all, fallback to ZIP or show all
  if (!query) {
    const filtered = allProducts.filter(product => {
      const store = product.store.toLowerCase();
      return zipInput === "" || store.includes(zipInput);
    });

    return renderResults(filtered);
  }

  try {
    const gptResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You're a shopping assistant. Extract structured product filters from a user query. Respond ONLY with a JSON object including: brand, category, price_limit, zip."
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    const gptData = await gptResponse.json();
    const content = gptData.choices[0].message.content;

    const filters = JSON.parse(content);
    const zip = filters.zip?.toLowerCase() || zipInput;
    const category = filters.category?.toLowerCase() || "";
    const brand = filters.brand?.toLowerCase() || "";
    const priceLimit = parseFloat(filters.price_limit) || 9999;

    const filtered = allProducts.filter(product => {
      const title = product.title.toLowerCase();
      const store = product.store.toLowerCase();
      const price = parseFloat(product.price.replace('$', '')) || 0;

      return (
        (brand === "" || title.includes(brand)) &&
        (category === "" || title.includes(category)) &&
        (zip === "" || store.includes(zip)) &&
        price <= priceLimit
      );
    });

    renderResults(filtered);

  } catch (err) {
    console.error("AI search failed:", err);
    listDiv.innerHTML = "<p>Something went wrong with AI search.</p>";
  }
}

function renderResults(products) {
  const listDiv = document.getElementById("product-list");
  listDiv.innerHTML = "";

  if (products.length === 0) {
    listDiv.innerHTML = "<p>No matching products found.</p>";
    return;
  }

  products.forEach((product, i) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <a href="/product.html?id=${i}" style="text-decoration: none; color: inherit;">
        <img src="${product.image}" alt="${product.title}" />
        <h3>${product.title}</h3>
        <p class="price">${product.price}</p>
      </a>
    `;
    listDiv.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadProducts);
