import express from 'express';
import pkg from 'pg'; // PostgreSQL module
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pkg;


// Initialize the Express app
const app = express();
const port = 3000;

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// PostgreSQL Database Configuration
const client = new Client({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'users', // Database containing `users` and `trip` tables
});

// Connect to the database
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err.stack));

// API endpoint to get data from the `trip` table
app.get('/data', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM trip');
    res.json(result.rows); // Send data as JSON
  } catch (error) {
    console.error('Error retrieving trips:', error.stack);
    res.status(500).send('Error retrieving data');
  }
});

// Serve `userpage.html` directly
app.get('/userpage', (req, res) => {
  res.sendFile('userpage.html'); 
});



// Login endpoint to check user credentials
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE username = $1 AND password = $2';
    const result = await client.query(query, [username, password]);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
