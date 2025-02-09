const express = require("express");
const cors = require("cors"); // Allow frontend to communicate with backend
const app = express();
const path = require('path');
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sample user database (Replace with real authentication in the future)
let users = [{ username: "admin", password: "password123" }];

// Simulated session storage
let loggedInUser = null;

// Sample Database (Pokémon Cards)
let cards = [
    { id: 1, name: "Pikachu", type: "Electric", rarity: "Common", favorite: false },
    { id: 2, name: "Charizard", type: "Fire", rarity: "Rare", favorite: true },
    { id: 3, name: "Bulbasaur", type: "Grass", rarity: "Uncommon", favorite: false }
];

// Get All Cards (Requires Login)
app.get("/cards", checkAuth, (req, res) => {
    res.json(cards);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/cards.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cards.html'));
});



// Login Route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        loggedInUser = username;
        res.json({ success: true, message: "Login successful!" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials!" });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Logout Route
app.post("/logout", (req, res) => {
    loggedInUser = null;
    res.json({ success: true, message: "Logged out successfully!" });
});

// Middleware to check authentication
function checkAuth(req, res, next) {
    if (!loggedInUser) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    next();
}

// Get Card by ID (Protected)
app.get("/cards/:id", checkAuth, (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
});

// Add a New Card 
app.post("/cards", checkAuth, (req, res) => {
    const { name, type, rarity, favorite } = req.body;
    if (!name || !type || !rarity) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const newCard = {
        id: cards.length + 1,
        name,
        type,
        rarity,
        favorite: favorite || false
    };

    cards.push(newCard);
    res.status(201).json(newCard);
});

// Delete a Card 
app.delete("/cards/:id", checkAuth, (req, res) => {
    const cardIndex = cards.findIndex(c => c.id === parseInt(req.params.id));
    if (cardIndex === -1) return res.status(404).json({ message: "Card not found" });

    cards.splice(cardIndex, 1);
    res.json({ message: "Card deleted successfully" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
