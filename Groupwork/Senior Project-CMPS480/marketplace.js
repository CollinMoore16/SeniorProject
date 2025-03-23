let marketplaceData=[];
const API_URL = "http://ccmoore.it.pointpark.edu:3000/marketplace";

document.addEventListener("DOMContentLoaded", () => {
    fetchMarketplaceCards();

    document.getElementById("listCardForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await listCardForSale();
    });

    document.getElementById("search").addEventListener("input", applyFilters);
    document.getElementById("filter").addEventListener("change", applyFilters);
    document.getElementById("priceFilter").addEventListener("change", applyFilters);
});

async function fetchMarketplaceCards() {
    try {
        const response = await fetch(API_URL);
        const cards = await response.json();
        marketplaceData = cards;
        displayMarketplace(cards);
        generateListingTrendChart(cards);
    } catch (error) {
        console.error("Error fetching marketplace cards:", error);
    }
}

function displayMarketplace(cards) {
    const marketplace = document.getElementById("marketplace");
    marketplace.innerHTML = "";

    cards.forEach(card => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("card");
        cardDiv.innerHTML = `
            <p><strong>${card.name}</strong> (${card.rarity}) - ${card.category}</p>
            <p>Price: $${parseFloat(card.price).toFixed(2)}</p>
            <button onclick="buyCard(${card.id})">Buy Now</button>
        `;
        marketplace.appendChild(cardDiv);
    });
}

function applyFilters() {
    const searchText = document.getElementById("search").value.toLowerCase();
    const selectedRarity = document.getElementById("filter").value.toLowerCase();
    const selectedPrice = document.getElementById("priceFilter").value;

    const filtered = marketplaceData.filter(card => {
        const name = card.name?.toLowerCase() || "";
        const rarity = card.rarity?.toLowerCase() || "";
        const matchesSearch = card.name.toLowerCase().includes(searchText);
        const matchesRarity = selectedRarity === "" || card.rarity.toLowerCase() === selectedRarity.toLowerCase();

        let matchesPrice = true;
        const price = parseFloat(card.price);
        if (selectedPrice === "low") matchesPrice = price < 10;
        else if (selectedPrice === "mid") matchesPrice = price >= 10 && price <= 50;
        else if (selectedPrice === "high") matchesPrice = price > 50;

        return matchesSearch && matchesRarity && matchesPrice;
    });

    displayMarketplace(filtered);
    generateListingTrendChart(filtered);
}

async function listCardForSale() {
    const cardData = {
        name: document.getElementById("card_name").value,
        category: document.getElementById("category").value,
        rarity: document.getElementById("rarity").value,
        price: parseFloat(document.getElementById("price").value),
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cardData)
        });
        if (!response.ok) throw new Error("failed to list card");
        alert("Card listed successfully!");
        fetchMarketplaceCards();
    } catch (error) {
        console.error("Error listing card:", error);
        alert("failed to list card: " + error.message);
    }
}

async function buyCard(cardId) {
    try {
        const response = await fetch(`${API_URL}/${cardId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("purchase failed");
        alert("Card purchased successfully!");
        fetchMarketplaceCards();
    } catch (error) {
        console.error("Error buying card:", error);
    }
}

const themeToggle = document.getElementById("toggleTheme");
const userPrefersDark = localStorage.getItem("theme") === "dark";

if (userPrefersDark) {
    document.body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
});



function generateListingTrendChart(cards) {
    const canvas = document.getElementById("priceChart");
    if (!canvas) {
        console.warn("Canvas element #priceChart not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const countByDate = {};
    cards.forEach(card => {
        const date = new Date(card.date_listed).toISOString().split("T")[0];
        countByDate[date] = (countByDate[date] || 0) + 1;
    });

    const sortedDates = Object.keys(countByDate).sort();
    const counts = sortedDates.map(date => countByDate[date]);

    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }

    window.priceChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: sortedDates,
            datasets: [{
                label: "Cards Listed per Day",
                data: counts,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: "Number of Cards"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Date"
                    }
                }
            }
        }
    });
}
