const express = require("express");
const cors = require("cors"); // Allow frontend to communicate with backend
const app = express();
const path = require('path');
const emailValidator = require("email-validator");
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Sample user database (Replace with real authentication in the future)
let users = [{ email: "admin@cardtrack.test", username: "admin", password: "password123" }];

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

// Register account
app.post("/register", (req, res) => {
    const { email, username, password, confirmPassword } = req.body;

    console.log(req.body);

    // Check if email address is valid
    if (!emailValidator.validate(email)) {
        return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    // Check if email is already in use
    if (users.some(acct => acct.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Email address is already in use." });
    }

    // Check if username meets requirements

    // Regex written by ChatGPT, it's verifying that the username has only:
    // Letters a-Z
    // Numbers 0-9
    // - and _
    // and is less than or equal to 16 characters
    if (!/^[a-zA-Z0-9\-_]{1,16}$/.test(username)) {
        return res.status(400).json({ success: false, message: "Invalid username." });
    }

    // Check if username is already in use
    if (users.some(acct => acct.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Username is already in use." });
    }

    // Check if entered passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // Check if password meets requirements
    // Length >= 10 charactesr
    // Letters a-Z
    // At least 1 special character
    if (!(password.length >= 10 && /[A-Z]/.test(password) && /[\W_]/.test(password))) {
        return res.status(400).json({ success: false, message: "Password doesn't meet requirements." });
    }

    // If all checks pass, create the account
    users.push({ email, username, password });
    return res.status(201).json({ success: true, message: "Account was created successfully." });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
