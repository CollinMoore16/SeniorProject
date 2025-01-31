const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

//Defines route
app.get("/", (req, res) => {
    res.send("Server is Up");
});

//Sample Database

let cards = [
    { id: 1, name: "Pikachu", type: "Electric", rarity: "Common", favorite: false },
    { id: 2, name: "Charizard", type: "Fire", rarity: "Rare", favorite: true },
    { id: 3, name: "Bulbasaur", type: "Grass", rarity: "Uncommon", favorite: false }
];

//Get Cards

app.get("/cards", (req, res) => {
    res.json(cards);
});

//Get Card by Id

app.get("/cards/:id", (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
});

//Add new card(Not final, may use teammates version)

app.post("/cards", (req, res) => {
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

//Add|Unadd from Favorite
app.patch("/cards/:id/favorite", (req, res) => {
    const card = cards.find(c => c.id === parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });

    card.favorite = !card.favorite;
    res.json({ message: "Favorite status updated", card });
});

//Delete card(Not final, may use teammates version)
app.delete("/cards/:id", (req, res) => {
    const cardIndex = cards.findIndex(c => c.id === parseInt(req.params.id));
    if (cardIndex === -1) return res.status(404).json({ message: "Card not found" });

    cards.splice(cardIndex, 1);
    res.json({ message: "Card deleted successfully" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});