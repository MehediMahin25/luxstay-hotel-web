const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Minimal server working!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Minimal server is running on port ${PORT}`);
}); 