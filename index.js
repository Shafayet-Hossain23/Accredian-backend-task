const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require("cors");
require('dotenv').config();
const bodyParser = require('body-parser');
// database
const mysql = require('mysql')
// middleware
app.use(cors())
app.use(express.json())
// Body parser middleware to handle POST request data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('Hello World!')
})
// hashing password
function hashPassword(password) {
    const crypto = require('crypto');

    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
// MySQL connection
const connection = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_database
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

app.post('/usersRegister', (req, res) => {
    const { userName, email, password } = req.body;
    const hashedPassword = hashPassword(password);

    // Insert data into MySQL database
    connection.query(
        'INSERT INTO userdetails (userName, userEmail, userPassword) VALUES (?, ?, ?)',
        [userName, email, hashedPassword],
        (error, results, fields) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    res.status(400).json({ error: 'User with this email already exists' });
                } else {
                    // console.error('Error registering user:', error);
                    res.status(500).json({ error: 'Could not register user' });
                }
            } else {
                res.status(200).json({ message: 'User registered successfully' });
            }
        }
    );
});
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Fetch hashed password from the database based on the provided email
    connection.query(
        'SELECT userPassword FROM userdetails WHERE userEmail = ?',
        [email],
        (error, results, fields) => {
            if (error) {
                console.error('Error during login:', error);
                res.status(500).json({ error: 'Could not log in' });
            } else {
                if (results.length === 0) {
                    res.status(404).json({ error: 'User not found' });
                } else {
                    const hashedPasswordFromDB = results[0].userPassword;
                    const hashedPasswordFromInput = hashPassword(password);
                    if (hashedPasswordFromDB === hashedPasswordFromInput) {
                        res.status(200).json({ message: 'Login successful' });
                    } else {
                        res.status(401).json({ error: 'Incorrect password' });
                    }
                }
            }
        }
    );
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})