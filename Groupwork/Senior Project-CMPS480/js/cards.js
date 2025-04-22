// Dark mode toggle
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const icon = themeToggleBtn.querySelector('i');
  const text = themeToggleBtn.querySelector('span');

  const currentTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-mode', currentTheme === 'dark');
  updateThemeToggle(currentTheme === 'dark');

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggle(isDark);
  });

  function updateThemeToggle(isDark) {
    icon.className = `fas ${isDark ? 'fa-sun' : 'fa-moon'}`;
    text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
});

async function fetchCards() {
  try {
    const response = await fetch("http://localhost:3000/cards", {
      headers: {
        Authorization: "Bearer " + (localStorage.getItem("token") || "fake-token"),
      },
    });

    if (!response.ok) {
      alert("Please log in first.");
      window.location.href = "login.html";
      return;
    }

    const cards = await response.json();
    const cardList = document.getElementById("cardList");
    cardList.innerHTML = "";

    cards.forEach((card) => {
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");

      cardDiv.innerHTML = `
        <p class="card-name">${card.name}</p>
        <p class="card-info">Rarity: ${card.rarity}</p>
        <p class="card-info">Category: ${card.category}</p>
        <button class="delete-button" onclick="deleteCard(${card.card_id})">Delete</button>
        <button class="sell-button" onclick="listForSale(${card.card_id}, '${card.name}', '${card.category}', '${card.rarity}')">List for Sale</button>
      `;
      cardList.appendChild(cardDiv);
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
  }
}

async function deleteCard(cardId) {
  try {
    const response = await fetch(`http://localhost:3000/cards/${cardId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + (localStorage.getItem("token") || "fake-token"),
      },
    });

    if (response.ok) {
      fetchCards();
    } else {
      alert("Error deleting card");
    }
  } catch (error) {
    console.error("Error deleting card:", error);
  }
}

function listForSale(cardId, name, category, rarity) {
  localStorage.setItem("cardToSell", JSON.stringify({ cardId, name, category, rarity }));
  window.location.href = "marketplace.html#sell";
}

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", fetchCards);