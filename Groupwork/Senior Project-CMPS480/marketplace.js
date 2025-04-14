// marketplace.js - Fixed chart creation and destruction
let marketplaceData = [];
const API_BASE_URL = "http://localhost:3000";
const API_URL = `${API_BASE_URL}/marketplace`;
// Chart references
let priceChart = null;
let rarityPriceChart = null;
let priceDistributionChart = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await fetchMarketplaceCards();
        setupEventListeners();
        checkForCardToSell();
        applySavedTheme();
        
        // Generate analytics after data is loaded
        generateAnalytics();
    } catch (error) {
        console.error("Initialization error:", error);
        showErrorToUser("Failed to initialize marketplace");
    }
});

async function fetchMarketplaceCards() {
    try {
        showLoading(true);
        const response = await fetch(API_URL, {
            headers: { "Authorization": "Bearer " + (localStorage.getItem("token") || "") }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cards = await response.json();
        marketplaceData = cards.map(card => ({
            ...card,
            id: card.id || card.card_id,
            price: parseFloat(card.price),
            date_listed: card.date_listed || new Date().toISOString()
        }));
        
        displayMarketplace(marketplaceData);
    } catch (error) {
        console.error("Error fetching cards:", error);
        showErrorToUser("Failed to load marketplace data");
        
        // Try to fetch from local storage as backup
        const localCards = JSON.parse(localStorage.getItem("myCards") || "[]");
        if (localCards.length > 0) {
            marketplaceData = localCards.map(card => ({
                ...card,
                id: card.id || card.card_id || Date.now(),
                price: card.price || Math.floor(Math.random() * 50) + 10,
                date_listed: card.date_listed || new Date().toISOString()
            }));
            displayMarketplace(marketplaceData);
        } else {
            // Last resort - create minimal mock data
            marketplaceData = [
                { id: 1, name: "Charizard", category: "Fire", rarity: "Rare", price: 75.99, date_listed: new Date().toISOString() },
                { id: 2, name: "Pikachu", category: "Electric", rarity: "Common", price: 15.50, date_listed: new Date().toISOString() },
                { id: 3, name: "Mewtwo", category: "Psychic", rarity: "Legendary", price: 120.00, date_listed: new Date().toISOString() }
            ];
            displayMarketplace(marketplaceData);
        }
    } finally {
        showLoading(false);
    }
}

function displayMarketplace(cards) {
    const marketplace = document.getElementById("marketplaceCards");
    if (!marketplace) return;

    marketplace.innerHTML = cards.length > 0 
        ? cards.map(card => `
            <div class="card">
                <p class="card-name"><strong>${escapeHtml(card.name)}</strong></p>
                <p class="card-info">Rarity: ${escapeHtml(card.rarity || "Unknown")}</p>
                <p class="card-info">Category: ${escapeHtml(card.category || "Unknown")}</p>
                <p class="card-info">Price: $${card.price.toFixed(2)}</p>
                <button class="buy-button" data-card-id="${card.id}">Buy Now</button>
            </div>
        `).join("")
        : `<p>No cards available in the marketplace.</p>`;
}

function setupEventListeners() {
    // List card form submission
    const listForm = document.getElementById("listCardForm");
    if (listForm) {
        listForm.addEventListener("submit", (e) => {
            e.preventDefault();
            listCardForSale();
        });
    }
    
    // Buy buttons click events using delegation
    const marketplace = document.getElementById("marketplaceCards");
    if (marketplace) {
        marketplace.addEventListener("click", (e) => {
            if (e.target.classList.contains("buy-button")) {
                const cardId = e.target.getAttribute("data-card-id");
                buyCard(cardId);
            }
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-theme");
            localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
        });
    }
}

function checkForCardToSell() {
    const cardToSell = JSON.parse(localStorage.getItem("cardToSell") || "null");
    
    if (cardToSell) {
        const form = document.getElementById("listCardForm");
        if (form) {
            // Populate the form with the card details
            if (form.card_id) form.card_id.value = cardToSell.cardId || "";
            if (form.card_name) form.card_name.value = cardToSell.name || "";
            if (form.category) form.category.value = cardToSell.category || "";
            if (form.rarity) form.rarity.value = cardToSell.rarity || "";
            if (form.price) form.price.focus();
            
            // Clear the localStorage item after using it
            localStorage.removeItem("cardToSell");
            
            // Scroll to the form
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

async function listCardForSale() {
    const form = document.getElementById("listCardForm");
    if (!form) return;

    const cardData = {
        name: form.card_name.value.trim(),
        category: form.category.value.trim(),
        rarity: form.rarity.value.trim(),
        price: parseFloat(form.price.value),
        date_listed: new Date().toISOString()
    };

    if (!cardData.name || !cardData.category || !cardData.rarity || isNaN(cardData.price) || cardData.price <= 0) {
        showErrorToUser("Please fill all fields with valid values");
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || "")
            },
            body: JSON.stringify(cardData)
        });

        const responseData = await parseResponse(response);
        
        if (!response.ok) {
            throw new Error(responseData.message || "Failed to list card");
        }

        showSuccessMessage("Card listed successfully!");
        form.reset();
        await fetchMarketplaceCards();
        generateAnalytics(); // Regenerate analytics after new listing
    } catch (error) {
        console.error("Listing error:", error);
        showErrorToUser(error.message || "Failed to list card");
        
        // Add to local data for demo purposes
        const newCard = {
            ...cardData,
            id: Date.now(),
        };
        marketplaceData.push(newCard);
        displayMarketplace(marketplaceData);
        generateAnalytics();
    } finally {
        showLoading(false);
    }
}

async function buyCard(cardId) {
    if (!cardId) {
        showErrorToUser("Invalid card selected");
        return;
    }

    if (!confirm("Are you sure you want to buy this card?")) return;

    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/${cardId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + (localStorage.getItem("token") || "")
            }
        });

        const responseData = await parseResponse(response);
        
        if (!response.ok) {
            throw new Error(responseData.message || "Purchase failed");
        }

        showSuccessMessage("Card purchased successfully!");
        await fetchMarketplaceCards();
        generateAnalytics(); // Regenerate analytics after purchase
    } catch (error) {
        console.error("Purchase error:", error);
        showErrorToUser(error.message || "Failed to complete purchase");
        
        // For demo: remove from local data
        marketplaceData = marketplaceData.filter(card => card.id.toString() !== cardId.toString());
        displayMarketplace(marketplaceData);
        generateAnalytics();
    } finally {
        showLoading(false);
    }
}

// Business Analytics Functions
function generateAnalytics() {
    generatePriceChart();
    generateRarityPriceChart();
    generatePriceDistributionChart();
    generateMarketInsights();
}

function generatePriceChart() {
    const ctx = document.getElementById('priceChart')?.getContext('2d');
    if (!ctx || !marketplaceData.length) return;
    
    // Sort by date and get last 7 days of data
    const sortedData = [...marketplaceData].sort((a, b) => 
        new Date(a.date_listed) - new Date(b.date_listed));
    
    // Group by day and calculate average prices
    const dailyPrices = {};
    const today = new Date();
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        dailyPrices[dateStr] = { total: 0, count: 0 };
    }
    
    // Fill with actual data
    sortedData.forEach(card => {
        const cardDate = new Date(card.date_listed);
        // Only include if within last 7 days
        const daysDiff = Math.floor((today - cardDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 6) {
            const dateStr = cardDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (!dailyPrices[dateStr]) {
                dailyPrices[dateStr] = { total: 0, count: 0 };
            }
            dailyPrices[dateStr].total += card.price;
            dailyPrices[dateStr].count++;
        }
    });
    
    // Calculate averages
    const labels = Object.keys(dailyPrices);
    const data = labels.map(day => {
        return dailyPrices[day].count > 0 
            ? dailyPrices[day].total / dailyPrices[day].count 
            : 0;
    });
    
    // Destroy existing chart if it exists
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Create new chart
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg. Card Price ($)',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function generateRarityPriceChart() {
    const ctx = document.getElementById('rarityPriceChart')?.getContext('2d');
    if (!ctx || !marketplaceData.length) return;
    
    // Group by rarity
    const rarityGroups = {};
    marketplaceData.forEach(card => {
        const rarity = card.rarity || 'Unknown';
        if (!rarityGroups[rarity]) {
            rarityGroups[rarity] = { total: 0, count: 0 };
        }
        rarityGroups[rarity].total += card.price;
        rarityGroups[rarity].count++;
    });
    
    // Calculate averages
    const labels = Object.keys(rarityGroups);
    const data = labels.map(rarity => rarityGroups[rarity].total / rarityGroups[rarity].count);
    
    // Define colors based on rarity level
    const backgroundColors = labels.map(rarity => {
        switch(rarity.toLowerCase()) {
            case 'common': return 'rgba(75, 192, 192, 0.5)';
            case 'uncommon': return 'rgba(54, 162, 235, 0.5)';
            case 'rare': return 'rgba(153, 102, 255, 0.5)';
            case 'ultra rare': return 'rgba(255, 159, 64, 0.5)';
            case 'legendary': return 'rgba(255, 99, 132, 0.5)';
            default: return 'rgba(201, 203, 207, 0.5)';
        }
    });
    
    // Destroy existing chart if it exists
    if (rarityPriceChart) {
        rarityPriceChart.destroy();
    }
    
    // Create new chart
    rarityPriceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg. Price by Rarity',
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function generatePriceDistributionChart() {
    const ctx = document.getElementById('priceDistributionChart')?.getContext('2d');
    if (!ctx || !marketplaceData.length) return;
    
    // Define price ranges
    const priceRanges = {
        '$0-10': 0,
        '$10-25': 0,
        '$25-50': 0,
        '$50-100': 0,
        '$100+': 0
    };
    
    // Count cards in each price range
    marketplaceData.forEach(card => {
        if (card.price <= 10) priceRanges['$0-10']++;
        else if (card.price <= 25) priceRanges['$10-25']++;
        else if (card.price <= 50) priceRanges['$25-50']++;
        else if (card.price <= 100) priceRanges['$50-100']++;
        else priceRanges['$100+']++;
    });
    
    // Prepare data for chart
    const labels = Object.keys(priceRanges);
    const data = Object.values(priceRanges);
    
    // Define colors
    const backgroundColors = [
        'rgba(75, 192, 192, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)',
        'rgba(255, 99, 132, 0.5)'
    ];
    
    // Destroy existing chart if it exists
    if (priceDistributionChart) {
        priceDistributionChart.destroy();
    }
    
    // Create new chart
    priceDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price Distribution',
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} cards (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generateMarketInsights() {
    const insightsContainer = document.getElementById('marketInsights');
    if (!insightsContainer || !marketplaceData.length) return;
    
    // Calculate various insights
    // 1. Most common card category
    const categoryCount = {};
    marketplaceData.forEach(card => {
        const category = card.category || 'Unknown';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    // 2. Average card price
    const avgPrice = marketplaceData.reduce((sum, card) => sum + card.price, 0) / marketplaceData.length;
    
    // 3. Most expensive card
    const mostExpensive = [...marketplaceData].sort((a, b) => b.price - a.price)[0];
    
    // 4. Price trend calculation (simple comparison to determine if market is trending up or down)
    const oldestCards = [...marketplaceData]
        .sort((a, b) => new Date(a.date_listed) - new Date(b.date_listed))
        .slice(0, Math.max(1, Math.floor(marketplaceData.length / 3)));
    
    const newestCards = [...marketplaceData]
        .sort((a, b) => new Date(b.date_listed) - new Date(a.date_listed))
        .slice(0, Math.max(1, Math.floor(marketplaceData.length / 3)));
    
    const oldAvg = oldestCards.reduce((sum, card) => sum + card.price, 0) / oldestCards.length;
    const newAvg = newestCards.reduce((sum, card) => sum + card.price, 0) / newestCards.length;
    
    const priceTrend = newAvg > oldAvg 
        ? `up ${Math.round((newAvg - oldAvg) / oldAvg * 100)}%` 
        : `down ${Math.round((oldAvg - newAvg) / oldAvg * 100)}%`;
    
    // Display insights
    insightsContainer.innerHTML = `
        <h3>Market Insights</h3>
        <ul>
            <li>${topCategory}-type cards are the most listed (${categoryCount[topCategory]} cards)</li>
            <li>The average card price is $${avgPrice.toFixed(2)}</li>
            <li>Most expensive card: ${mostExpensive.name} ($${mostExpensive.price.toFixed(2)})</li>
            <li>Market prices are trending ${priceTrend} recently</li>
            <li>Total marketplace value: $${marketplaceData.reduce((sum, card) => sum + card.price, 0).toFixed(2)}</li>
        </ul>
        <div id="recommendationSection">
            <h4>Recommendations</h4>
            <p>Based on current market data:</p>
            <ul id="marketRecommendations">
                ${generateRecommendations()}
            </ul>
        </div>
    `;
}

function generateRecommendations() {
    if (!marketplaceData.length) return "<li>Not enough data for recommendations</li>";
    
    const recommendations = [];
    
    // Group by category for analysis
    const categoryGroups = {};
    marketplaceData.forEach(card => {
        const category = card.category || 'Unknown';
        if (!categoryGroups[category]) {
            categoryGroups[category] = [];
        }
        categoryGroups[category].push(card);
    });
    
    // Find underrepresented categories
    const categories = Object.keys(categoryGroups);
    if (categories.length > 1) {
        const minCategory = categories
            .map(cat => ({ name: cat, count: categoryGroups[cat].length }))
            .sort((a, b) => a.count - b.count)[0];
        
        recommendations.push(`Consider listing more ${minCategory.name}-type cards as they are in demand (only ${minCategory.count} available)`);
    }
    
    // Identify high-margin opportunities
    const rarityGroups = {};
    marketplaceData.forEach(card => {
        const rarity = card.rarity || 'Unknown';
        if (!rarityGroups[rarity]) {
            rarityGroups[rarity] = [];
        }
        rarityGroups[rarity].push(card);
    });
    
    const rarities = Object.keys(rarityGroups);
    if (rarities.length > 1) {
        const highestAvgPrice = rarities.map(rarity => {
            const cards = rarityGroups[rarity];
            const avgPrice = cards.reduce((sum, card) => sum + card.price, 0) / cards.length;
            return { rarity, avgPrice, count: cards.length };
        }).sort((a, b) => b.avgPrice - a.avgPrice)[0];
        
        recommendations.push(`${highestAvgPrice.rarity} cards have the highest average price ($${highestAvgPrice.avgPrice.toFixed(2)})`);
    }
    
    // Price ranges with low competition
    const priceRanges = [
        { name: "$0-10", min: 0, max: 10, count: 0 },
        { name: "$10-25", min: 10, max: 25, count: 0 },
        { name: "$25-50", min: 25, max: 50, count: 0 },
        { name: "$50-100", min: 50, max: 100, count: 0 },
        { name: "$100+", min: 100, max: Infinity, count: 0 }
    ];
    
    marketplaceData.forEach(card => {
        const range = priceRanges.find(r => card.price > r.min && card.price <= r.max);
        if (range) range.count++;
    });
    
    const lowestCompetitionRange = [...priceRanges]
        .sort((a, b) => a.count - b.count)[0];
    
    recommendations.push(`The ${lowestCompetitionRange.name} price range has the least competition (${lowestCompetitionRange.count} cards)`);
    
    return recommendations.map(rec => `<li>${rec}</li>`).join("");
}

async function parseResponse(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function showLoading(show) {
    const loader = document.getElementById("loadingOverlay") || createLoader();
    loader.style.display = show ? "flex" : "none";
}

function createLoader() {
    const loader = document.createElement("div");
    loader.id = "loadingOverlay";
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    loader.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(loader);
    return loader;
}

function showErrorToUser(message) {
    alert(message);
}

function showSuccessMessage(message) {
    alert(message);
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applySavedTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark-theme", theme === "dark");
}