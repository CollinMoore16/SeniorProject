const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const SECRET = 'your_jwt_secret_here';    // Move this to env var in production
const saltRounds = 10;

// Database connection
const db = require("mysql");
const con = db.createConnection({
  host: "db.it.pointpark.edu",
  user: "cardtrack",
  password: "cardtrack",
  database: "cardtrack"
});
con.connect(err => { if (err) throw err; console.log('DB connected'); });

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET','POST','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function checkAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user_id = payload.user_id;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT user_id, password FROM users WHERE username = ?';
  con.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid creds' });
    bcrypt.compare(password, results[0].password, (err, match) => {
      if (err || !match) return res.status(401).json({ message: 'Invalid creds' });
      const token = jwt.sign({ user_id: results[0].user_id }, SECRET, { expiresIn: '2h' });
      res.json({ token });
    });
  });
});

// Register
app.post('/register', (req, res) => {
  const { email, username, password, confirmPassword } = req.body;
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords must match' });
  if (!/[A-Z]/.test(password) || !/[\W_]/.test(password) || password.length < 10)
    return res.status(400).json({ message: 'Password too weak' });

  // Single query for both email & username
  const dupSql = 'SELECT email, username FROM users WHERE email = ? OR username = ?';
  con.query(dupSql, [email, username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    for (const r of rows) {
      if (r.email === email) return res.status(400).json({ message: 'Email in use' });
      if (r.username === username) return res.status(400).json({ message: 'Username in use' });
    }
    // All checks passed
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).json({ error: err.message });
      const ins = 'INSERT INTO users (email, username, password, date_registered, date_modified) VALUES (?,?,?,NOW(),NOW())';
      con.query(ins, [email, username, hash], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Registered' });
      });
    });
  });
});

// Cards routes
app.get('/cards', checkAuth, (req, res) => {
  con.query('SELECT * FROM cards WHERE user_id = ?', [req.user_id], (e,d) => e ? res.status(500).json({error:e.message}) : res.json(d));
});
app.post('/cards', checkAuth, (req, res) => {
  const { name, category, set_name, rarity, condition, value } = req.body;
  const sql = 'INSERT INTO cards (name,category,set_name,rarity,`condition`,value,user_id,date_added,date_modified) VALUES (?,?,?,?,?,?,?,NOW(),NOW())';
  con.query(sql, [name,category,set_name,rarity,condition,value,req.user_id], (e) => e ? res.status(500).json({error:e.message}) : res.status(201).json({ message:'Added' }));
});
app.delete('/cards/:id', checkAuth, (req, res) => {
  con.query('DELETE FROM cards WHERE card_id = ?', [req.params.id], (e) => e ? res.status(500).json({error:e.message}) : res.json({ message:'Deleted' }));
});

// Marketplace
app.get('/marketplace', (req, res) => {
  con.query('SELECT * FROM marketplace', (e,rows) => {
    if (e) return res.status(500).json({error:e.message});
    res.json(rows.map(r=>({ id:r.id, name:r.name, category:r.category, rarity:r.rarity, price:parseFloat(r.Price), date_listed:r.date_listed })));
  });
});
app.post('/marketplace', (req, res) => {
  const { name, category, rarity, price } = req.body;
  const sql = 'INSERT INTO marketplace (name,category,rarity,price,date_listed) VALUES (?,?,?,? ,NOW())';
  con.query(sql, [name,category,rarity,price], (e) => e ? res.status(500).json({error:e.message}) : res.status(201).json({ message:'Listed' }));
});
app.delete('/marketplace/:id', (req,res) => {
  con.query('DELETE FROM marketplace WHERE id = ?', [req.params.id], (e) => e ? res.status(500).json({error:e.message}) : res.json({message:'Purchased'}));
});

// Start
const PORT = process.env.PORT||3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));