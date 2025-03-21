document.addEventListener("DOMContentLoaded", () => {
    fetchMarketplaceCards();

    document.getElementById("listCardForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        await listCardForSale();
    });
});

async function fetchMarketplaceCards() {
    try {
        const response = await fetch("http://epurkun.it.pointpark.edu:3000/marketplace");
        const cards = await response.json();
        displayMarketplace(cards);
        generatePriceChart(cards);
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
            <p>Price: $${card.price}</p>
            <button onclick="buyCard(${card.id})">Buy Now</button>
        `;
        marketplace.appendChild(cardDiv);
    });
}

async function listCardForSale() {
    const cardData = {
        name: document.getElementById("card_name").value,
        category: document.getElementById("category").value,
        rarity: document.getElementById("rarity").value,
        price: document.getElementById("price").value,
    };

    try {
        const response = await fetch("http://eperkun.it.pointpark.edu:3000/marketplace", {
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
        const response = await fetch(`http://eperkun.it.pointpark.edu:3000/marketplace/${cardId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("purchase failed");
        alert("Card purchased successfully!");
        fetchMarketplaceCards();
    } catch (error) {
        console.error("Error buying card:", error);
    }
}

function generatePriceChart(cards) {
    const ctx = document.getElementById("priceChart").getContext("2d");
    const prices = cards.map(card => card.price);
    const names = card.map(card => card.name);

    new CharacterData(ctx, {
        type: "bar",
        data: {
            labels: names,
            datasets: [{
                label: "Card Prices",
                data: prices,
                baclgroundColor: "rgba(75, 192, 192, .06)",
                borderWidth: 1
            }]
        },
        options: {
            responsive:true,
            scales: { y: {beginAtZero: true } }
        }
    });
}