const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test API is working!' });
});

app.get('/api/users', (req, res) => {
    res.json([{ id: 1, name: 'Test User' }]);
});

// Start server
app.listen(PORT, () => {
    console.log(`Test server is running on port ${PORT}`);
}); 