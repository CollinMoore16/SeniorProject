const express = require("express");
const cors = require("cors"); // Allow frontend to communicate with backend
const app = express();
const path = require('path');

const emailValidator = require("email-validator");

const bcrypt = require('bcryptjs');
const saltValue = 10;

//Database connection
const db = require("mysql");
var con = db.createConnection({
    host: "db.it.pointpark.edu",
    user: "cardtrack",
    password: "cardtrack",
    database: "cardtrack"
});
con.connect((err) => {
    if (err) throw err;
    console.log('Database connection successful');
});
  
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Simulated session storage
let loggedInUser = null;
var loggedInUserID = -1;

// Get All Cards (Requires Login)
app.get("/cards", checkAuth, (req, res) => {
    const sql = "SELECT * FROM cards WHERE user_id = ?";
    con.query(sql, [loggedInUserID], (err, data) => {
        if(err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(data);
        }
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/cards.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'cards.html'));
});



// Login Route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";

    con.query(sql, [username], (err, result) => {
        if(err) {
            return res.status(500).json({ error: err.message });
        }

        if(result.length === 0) {
            return res.status(401).json({ success: false, message: "Username or password is incorrect." });
        }

        const hashedPw = result[0].password;
        bcrypt.compare(password, hashedPw, (err, match) => {
            if(err) {
                console.log(err.message);
                return res.status(500).json({ success: false, message: "Error verifying password" });
            }
            
            if(!match) {
                return res.status(401).json({ success: false, message: "Username or password is incorrect." });
            }

            loggedInUser = result[0].username;
            loggedInUserID = result[0].user_id;
            res.json({ success: true, message: "Login successful." });
        });
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Logout Route
app.post("/logout", (req, res) => {
    loggedInUser = null;
    loggedInUserID = -1;
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
    const id = req.params.id;
    const sql = "SELECT * FROM cards WHERE card_id = ?";

    con.query(sql, [id], (err, data) => {
        if(err) {
            return res.status(500).json({ error: err.message });
        }

        if(data.length === 0) {
            return res.status(404).json({ message: "Card not found" });
        }

        res.json(data);
    });
});

// Add a New Card 
app.post("/cards", checkAuth, (req, res) => {
    console.log(req.body);
    const { name, category, set_name, rarity, condition, value } = req.body;
    if (!name || !category || !rarity) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    sql = "INSERT INTO cards (`name`, category, set_name, rarity, `condition`, value, user_id, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())"
    con.query(sql, [name, category, set_name, rarity, condition, value, loggedInUserID], (err, result) => {
        if(err) {
            console.log("Insert query failed " + err.message);
            return res.status(500).json({ error: err.message });
        }
        return res.status(201).json({ success: true, message: "Card was added successfully" });
    });
});

// Delete a Card 
app.delete("/cards/:id", checkAuth, (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM cards WHERE card_id = ?";
    con.query(sql, [id], (err, result) => {
        if(err) {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "Card deleted successfully" });
    });
});

//Fetch all cards in the marketplace
app.get("/marketplace", (req, res) => {
    const sql = "SELECT * FROM marketplace";
    con.query(sql, (err, data) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(data);
        }
    });
});

//List a card for sale
app.post("/marketplace", (req, res) => {
    const { name, category, rarity, price } = req.body;
    if (!name || !category || !rarity || !price) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = "INSERT INTO marketplace (name, category, rarity, price, date_listed) VALUES (?, ?, ?, ?, NOW())";
    con.query(sql, [name, category, rarity, price], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ success: true, message: "Card listed for sale" });
        }
    });
});

//Purchase a card (remove from marketplace)
app.delete("/marketplace/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM marketplace WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, message: "Card purchased successfully" });
        }
    });
});

// Register account
app.post("/register", (req, res) => {
    const { email, username, password, confirmPassword } = req.body;

    console.log(req.body);

    // Check if email address is valid
    if (!emailValidator.validate(email)) {
        console.log("Invalid email address");
        return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    // Check if email is already in use
    var sql = 'SELECT * FROM users WHERE email = ? ';
    con.query(sql, [email], (err, data) => {
        if(err) {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
        }

        if(data.length > 0) {
            console.log("Email address in use");
            return res.status(400).json({ success: false, message: "Email address is already in use." });
        }
    });

    // Check if username meets requirements

    // Regex written by ChatGPT, it's verifying that the username has only:
    // Letters a-Z
    // Numbers 0-9
    // - and _
    // and is less than or equal to 16 characters
    if (!/^[a-zA-Z0-9\-_]{1,16}$/.test(username)) {
        console.log("Invalid username")
        return res.status(400).json({ success: false, message: "Invalid username." });
    }

    // Check if username is already in use
    sql = 'SELECT * FROM users WHERE username = ? ';
    con.query(sql, [username], (err, data) => {
        if(err) {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
        }

        if(data.length > 0) {
            console.log("Username already in use");
            return res.status(400).json({ success: false, message: "Username is already in use." });
        }
    });

    // Check if entered passwords match
    if (password !== confirmPassword) {
        console.log("Mismatched passwords");
        return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    // Check if password meets requirements
    // Length >= 10 charactesr
    // Letters a-Z
    // At least 1 special character
    if (!(password.length >= 10 && /[A-Z]/.test(password) && /[\W_]/.test(password))) {
        console.log("Password doesn't meet requirements");
        return res.status(400).json({ success: false, message: "Password doesn't meet requirements." });
    }

    // If all checks pass, create the account
    bcrypt.hash(password, saltValue, (err, hashedPw) => {
        if(err) {
            console.log("error hashing password");
            return res.status(500).json({ error: err.message });
        }

        sql = "INSERT INTO users (email, username, password, date_registered, date_modified) VALUES (?, ?, ?, NOW(), NOW())"
        con.query(sql, [email, username, hashedPw], (err, result) => {
            if(err) {
                console.log("Insert query failed " + err.message);
                return res.status(500).json({ error: err.message });
            }
            return res.status(201).json({ success: true, message: "Account was created successfully." });
        });
      });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
