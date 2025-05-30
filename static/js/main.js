let allProducts = [];

async function loadProducts() {
  try {
    const res = await fetch('/products.json');
    allProducts = await res.json();
  } catch (err) {
    console.error("Failed to load products.json:", err);
  }
}

function normalize(value) {
  if (!value) return "";
  const val = value.toString().toLowerCase().trim();
  return val === "none" || val === "null" ? "" : val;
}

async function smartSearch() {
  const query = document.getElementById("searchInput").value.trim();
  const zipInput = document.getElementById("zipcode").value.trim().toLowerCase();
  const listDiv = document.getElementById("product-list");

  listDiv.innerHTML = "<p>Searching with AI...</p>";

  if (!query) {
    const fallback = allProducts.filter(product => {
      return zipInput === "" || product.store.toLowerCase().includes(zipInput);
    });
    return renderResults(fallback);
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
    console.log("🧠 GPT Raw:", content);

    const filters = JSON.parse(content);
    const brand = normalize(filters.brand);
    const category = normalize(filters.category);
    const zip = normalize(filters.zip) || zipInput;
    const priceLimit = parseFloat(filters.price_limit) || 9999;

    console.log("✅ Parsed Filters:", { brand, category, zip, priceLimit });

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
    console.error("❌ GPT Search Error:", err);
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
