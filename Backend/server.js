const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const SSLCommerzPayment = require('sslcommerz-lts');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;
const HOST = process.env.HOST || 'http://localhost';
const BASE_URL = process.env.BASE_URL || `${HOST}:${PORT}`;

// SSL Commerz Configuration (falls back to the public sandbox demo store)
const SSL_COMMERZ_CONFIG = {
    store_id: process.env.SSL_STORE_ID || 'testbox',
    store_passwd: process.env.SSL_STORE_PASSWORD || 'qwerty',
    is_sandbox: (process.env.SSL_IS_SANDBOX || 'true') === 'true',
    success_url: `${BASE_URL}/payment/success`,
    fail_url: `${BASE_URL}/payment/fail`,
    cancel_url: `${BASE_URL}/payment/cancel`,
    ipn_url: `${BASE_URL}/payment/ipn`
};

console.log('SSL Commerz Configuration initialized with:', {
    ...SSL_COMMERZ_CONFIG,
    store_id: process.env.SSL_STORE_ID || 'testbox'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// serve static assets (frontend) from project root
// previous public directory may not exist; using parent folder so index.html and assets are reachable
app.use(express.static(path.join(__dirname, '..')))
// Database setup
const db = new sqlite3.Database('./hotel.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Rooms table
        `CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL,
            capacity INTEGER NOT NULL,
            status TEXT DEFAULT 'available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Bookings table
        `CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            room_id INTEGER,
            check_in_date TEXT NOT NULL,
            check_out_date TEXT NOT NULL,
            guests INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_status TEXT DEFAULT 'pending',
            tran_id TEXT,
            payment_details TEXT,
            special_requests TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (room_id) REFERENCES rooms (id)
        )`,
        
        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_name TEXT DEFAULT 'LuxStay Hotel',
            contact_email TEXT DEFAULT 'info@luxstayhotel.com',
            contact_phone TEXT DEFAULT '+1 234 567 890',
            address TEXT DEFAULT '123 Hotel Street, City, Country',
            check_in_time TEXT DEFAULT '14:00',
            check_out_time TEXT DEFAULT '12:00',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Payments table
        `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER,
            tran_id TEXT,
            amount REAL,
            method TEXT,
            payer_mobile TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id)
        )`,

        // Notifications table
        `CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            message TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`,

        // Contact messages table
`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`

    ];
    
    // Check if required columns exist in bookings table and add them if they don't
    db.get("PRAGMA table_info(bookings)", (err, rows) => {
        if (err) {
            console.error('Error checking bookings table structure:', err);
            return;
        }
        
        // Add payment-related columns if they don't exist
        const addColumns = [
            "ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'",
            "ALTER TABLE bookings ADD COLUMN tran_id TEXT",
            "ALTER TABLE bookings ADD COLUMN payment_details TEXT"
        ];
        
        addColumns.forEach(sql => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('Error adding column:', err);
                }
            });
        });
    });
    
    tables.forEach(table => {
        db.run(table, (err) => {
                    if (err) {
                console.error('Error creating table:', err);
            }
        });
    });

    // Insert sample data if tables are empty
    insertSampleData();
}

// Insert sample data
function insertSampleData() {
    // Insert sample rooms
    const rooms = [
        { number: '101', type: 'standard', price: 99, capacity: 2 },
        { number: '102', type: 'standard', price: 99, capacity: 2 },
        { number: '201', type: 'deluxe', price: 149, capacity: 3 },
        { number: '202', type: 'deluxe', price: 149, capacity: 3 },
        { number: '301', type: 'suite', price: 249, capacity: 4 },
        { number: '302', type: 'suite', price: 249, capacity: 4 }
    ];
    
    rooms.forEach(room => {
        db.run('INSERT OR IGNORE INTO rooms (number, type, price, capacity) VALUES (?, ?, ?, ?)', 
            [room.number, room.type, room.price, room.capacity]);
    });
    
    // Insert admin user
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Admin User', 'admin@luxstay.com', adminPassword, 'admin']);
    
    // Insert sample user
    const userPassword = bcrypt.hashSync('user123', 10);
    db.run('INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
        ['Test User', 'user@luxstay.com', userPassword, 'user']);
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (row) {
                return res.status(400).json({ error: 'User already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error creating user' });
                    }
                    
                    res.json({
                        message: 'User registered successfully',
                        user: {
                            id: this.lastID,
                            name,
                            email,
                            role: 'user'
                        }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    });
});

// Users Routes
app.get('/api/users', (req, res) => {
    db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

app.post('/api/users', (req, res) => {
    const { name, email, role } = req.body;
    
    db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, 'defaultpassword', role],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating user' });
            }
            res.json({ message: 'User created successfully', id: this.lastID });
        }
    );
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting user' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Rooms Routes
app.get('/api/rooms', (req, res) => {
    db.all('SELECT * FROM rooms ORDER BY number', (err, rooms) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rooms);
    });
});

app.post('/api/rooms', (req, res) => {
    const { number, type, price, capacity } = req.body;
    
    db.run('INSERT INTO rooms (number, type, price, capacity) VALUES (?, ?, ?, ?)',
        [number, type, price, capacity],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating room' });
            }
            res.json({ message: 'Room created successfully', id: this.lastID });
        }
    );
});

app.delete('/api/rooms/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM rooms WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting room' });
        }
        res.json({ message: 'Room deleted successfully' });
    });
});

// Bookings Routes
app.get('/api/bookings', (req, res) => {
    const { user_id } = req.query;
    const query = `
        SELECT b.*, u.name as guest_name, r.number as room_number, r.type as room_type
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN rooms r ON b.room_id = r.id
        ${user_id ? 'WHERE b.user_id = ?' : ''}
        ORDER BY b.created_at DESC
    `;
    const params = user_id ? [user_id] : [];

    db.all(query, params, (err, bookings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(bookings);
    });
});

app.post('/api/bookings', (req, res) => {
    const { user_id, room_id, check_in_date, check_out_date, guests, total_amount, special_requests } = req.body;
    
    db.run(`INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, guests, total_amount, special_requests)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, room_id, check_in_date, check_out_date, guests, total_amount, special_requests],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating booking' });
            }
            res.json({ message: 'Booking created successfully', id: this.lastID });
        }
    );
});

app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting booking' });
        }
        res.json({ message: 'Booking deleted successfully' });
    });
});

// Settings Routes
app.get('/api/settings', (req, res) => {
    db.get('SELECT * FROM settings WHERE id = 1', (err, settings) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(settings);
    });
});

app.put('/api/settings', (req, res) => {
    const { hotel_name, contact_email, contact_phone, address, check_in_time, check_out_time } = req.body;
    
    db.run(`UPDATE settings SET 
            hotel_name = ?, contact_email = ?, contact_phone = ?, 
            address = ?, check_in_time = ?, check_out_time = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1`,
        [hotel_name, contact_email, contact_phone, address, check_in_time, check_out_time],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error updating settings' });
            }
            res.json({ message: 'Settings updated successfully' });
        }
    );
});

// Dashboard Stats
app.get('/api/dashboard/stats', (req, res) => {
    const stats = {};
    
    // Get total bookings
    db.get('SELECT COUNT(*) as count FROM bookings', (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.totalBookings = result.count;
        
        // Get available rooms
        db.get('SELECT COUNT(*) as count FROM rooms WHERE status = "available"', (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            stats.availableRooms = result.count;
            
            // Get registered users
            db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                stats.registeredUsers = result.count;
                
                // Get total revenue
                db.get('SELECT SUM(total_amount) as total FROM bookings WHERE status = "confirmed"', (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    stats.totalRevenue = result.total || 0;
                    
                    res.json(stats);
                });
            });
        });
    });
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Simple Payment Routes
app.post('/api/payment/init', (req, res) => {
    try {
        console.log('Payment initialization request received:', req.body);
        const { booking_id, amount, customer_name, customer_email, customer_phone } = req.body;
        
        // Validate required fields
        const missingFields = [];
        if (!booking_id) missingFields.push('booking_id');
        if (!amount) missingFields.push('amount');
        if (!customer_name) missingFields.push('customer_name');
        if (!customer_email) missingFields.push('customer_email');
        if (!customer_phone) missingFields.push('customer_phone');
        
        if (missingFields.length > 0) {
            console.error('Missing required payment fields:', missingFields);
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required payment fields',
                missing_fields: missingFields 
            });
        }
        
        // Check if booking exists
        db.get('SELECT * FROM bookings WHERE id = ?', [booking_id], (err, booking) => {
            if (err) {
                console.error('Database error when checking booking:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Database error when checking booking: ' + err.message 
                });
            }
            
            if (!booking) {
                console.error('Booking not found:', booking_id);
                return res.status(404).json({ 
                    success: false, 
                    error: 'Booking not found with ID: ' + booking_id 
                });
            }
            
            const tran_id = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const formattedAmount = parseFloat(amount).toFixed(2);

            console.log('Creating payment with transaction ID:', tran_id);
            console.log('Amount:', formattedAmount);

            // Store booking info in database
            db.run(`UPDATE bookings SET tran_id = ?, payment_status = 'pending' WHERE id = ?`,
                [tran_id, booking_id], function(err) {
                    if (err) {
                        console.error('Database error when updating booking:', err);
                        return res.status(500).json({
                            success: false,
                            error: 'Database error when updating booking'
                        });
                    }

                    // SSLCommerz requires shipping/address fields even for non-physical bookings
                    const sslData = {
                        total_amount: formattedAmount,
                        currency: 'BDT',
                        tran_id: tran_id,
                        success_url: SSL_COMMERZ_CONFIG.success_url,
                        fail_url: SSL_COMMERZ_CONFIG.fail_url,
                        cancel_url: SSL_COMMERZ_CONFIG.cancel_url,
                        ipn_url: SSL_COMMERZ_CONFIG.ipn_url,
                        shipping_method: 'NO',
                        product_name: 'Hotel Room Booking',
                        product_category: 'Hotel',
                        product_profile: 'general',
                        cus_name: customer_name,
                        cus_email: customer_email,
                        cus_add1: 'Dhaka',
                        cus_city: 'Dhaka',
                        cus_postcode: '1000',
                        cus_country: 'Bangladesh',
                        cus_phone: customer_phone,
                        ship_name: customer_name,
                        ship_add1: 'Dhaka',
                        ship_city: 'Dhaka',
                        ship_postcode: '1000',
                        ship_country: 'Bangladesh',
                        value_a: booking_id // carried through callbacks to identify the booking
                    };

                    const sslcz = new SSLCommerzPayment(
                        SSL_COMMERZ_CONFIG.store_id,
                        SSL_COMMERZ_CONFIG.store_passwd,
                        !SSL_COMMERZ_CONFIG.is_sandbox
                    );

                    sslcz.init(sslData).then(apiResponse => {
                        if (!apiResponse || !apiResponse.GatewayPageURL) {
                            console.error('SSL Commerz init failed:', apiResponse);
                            return res.status(502).json({
                                success: false,
                                error: apiResponse?.failedreason || 'SSL Commerz did not return a gateway URL'
                            });
                        }

                        console.log('Payment initialization successful, gateway URL:', apiResponse.GatewayPageURL);

                        res.json({
                            success: true,
                            gateway_url: apiResponse.GatewayPageURL,
                            tran_id: tran_id
                        });
                    }).catch(sslErr => {
                        console.error('SSL Commerz init error:', sslErr);
                        res.status(502).json({ success: false, error: 'SSL Commerz init request failed' });
                    });
                });
            });

    } catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Payment initialization failed: ' + error.message 
        });
    }
});

// Manual payment APIs (kept for admin review of historical submissions;
// the customer-facing entry point now goes through SSL Commerz instead)
app.post('/api/manual-payments', (req, res) => {
    try {
        const { booking_id, tran_id, amount, method, payer_mobile, payer_txn } = req.body || {};
        if (!tran_id || !amount || !method || !payer_mobile || !payer_txn) {
            return res.status(400).json({ success:false, error:'Missing required fields' });
        }

        const findSql = booking_id ? 'SELECT * FROM bookings WHERE id = ?' : 'SELECT * FROM bookings WHERE tran_id = ?';
        const findVal = booking_id ? [booking_id] : [tran_id];

        db.get(findSql, findVal, (err, booking) => {
            if (err) return res.status(500).json({ success:false, error:'Database error' });
            if (!booking) return res.status(404).json({ success:false, error:'Booking not found' });

            const bId = booking.id;

            if (!booking.tran_id) {
                db.run('UPDATE bookings SET tran_id = ?, payment_status = "review" WHERE id = ?', [tran_id, bId]);
            } else {
                db.run('UPDATE bookings SET payment_status = "review" WHERE id = ?', [bId]);
            }

            db.run(`INSERT INTO payments (booking_id, tran_id, amount, method, payer_mobile, status)
                    VALUES (?, ?, ?, ?, ?, 'pending')`,
                [bId, tran_id, amount, method, payer_mobile],
                function(insErr) {
                    if (insErr) return res.status(500).json({ success:false, error:'Error creating payment record' });
                    const details = { payer_txn, method, payer_mobile, amount };
                    db.run(`UPDATE bookings SET payment_details = ? WHERE id = ?`, [JSON.stringify(details), bId]);
                    return res.json({ success:true, id:this.lastID });
                });
        });
    } catch (e) {
        res.status(500).json({ success:false, error:'Server error' });
    }
});

app.get('/api/manual-payments', (req, res) => {
    const sql = `
        SELECT p.*, b.user_id, b.id as booking_id, b.check_in_date, b.check_out_date
        FROM payments p
        LEFT JOIN bookings b ON b.id = p.booking_id
        ORDER BY p.created_at DESC
    `;
    db.all(sql, (err, rows) => {
        if (err) return res.status(500).json({ error:'Database error' });
        res.json(rows);
    });
});

app.post('/api/manual-payments/:id/approve', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, p) => {
        if (err || !p) return res.status(404).json({ error:'Payment not found' });
        // Get booking to determine user to notify
        db.get('SELECT * FROM bookings WHERE id = ?', [p.booking_id], (bErr, booking) => {
            if (bErr || !booking) return res.status(404).json({ error: 'Booking not found' });
            db.run('UPDATE payments SET status = "approved", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
            db.run('UPDATE bookings SET payment_status = "completed", status = "confirmed" WHERE id = ?', [p.booking_id], function(uErr){
                if (uErr) return res.status(500).json({ error:'Failed to update booking' });
                const title = 'Payment Approved';
                const message = `Your payment for booking #${p.booking_id} has been approved. Transaction: ${p.tran_id || ''}`;
                db.run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [booking.user_id, title, message], function(nErr){
                    if (nErr) return res.status(500).json({ error:'Failed to create notification' });
                    res.json({ success:true });
                });
            });
        });
    });
});

app.post('/api/manual-payments/:id/reject', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM payments WHERE id = ?', [id], (err, p) => {
        if (err || !p) return res.status(404).json({ error:'Payment not found' });
        db.run('UPDATE payments SET status = "rejected", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        db.run('UPDATE bookings SET payment_status = "failed" WHERE id = ?', [p.booking_id], function(uErr){
            if (uErr) return res.status(500).json({ error:'Failed to update booking' });
            res.json({ success:true });
        });
    });
});

// Notifications APIs
app.get('/api/notifications', (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    const sql = `
        SELECT id, title, message, is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY is_read ASC, created_at DESC
    `;
    db.all(sql, [user_id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

app.post('/api/notifications/read-all', (req, res) => {
    const { user_id } = req.body || {};
    if (!user_id) return res.status(400).json({ error: 'user_id required' });
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user_id], function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
});

// Verifies a transaction with SSL Commerz's Order Validation API and records the
// result on the booking. A payment is only ever marked 'completed' after this
// server-to-server check passes - callback query/body params are attacker-controlled.
function verifyAndRecordPayment(params) {
    const { tran_id, val_id } = params;
    const sslcz = new SSLCommerzPayment(
        SSL_COMMERZ_CONFIG.store_id,
        SSL_COMMERZ_CONFIG.store_passwd,
        !SSL_COMMERZ_CONFIG.is_sandbox
    );

    const validationPromise = val_id ? sslcz.validate({ val_id }) : Promise.resolve(null);

    return validationPromise
        .catch(err => {
            console.error('SSL Commerz validation error:', err);
            return null;
        })
        .then(validationData => {
            const verified = !!validationData && ['VALID', 'VALIDATED'].includes(validationData.status);
            const payment_status = verified ? 'completed' : 'failed';

            return new Promise((resolve, reject) => {
                db.run(
                    `UPDATE bookings SET payment_status = ?, payment_details = ?${verified ? ", status = 'confirmed'" : ''} WHERE tran_id = ?`,
                    [payment_status, JSON.stringify(validationData || params), tran_id],
                    (err) => err ? reject(err) : resolve({ verified, payment_status })
                );
            });
        });
}

function paymentResultPage({ icon, heading, message, tran_id, amount, accent, gradient, extra = '' }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${heading} - LuxStay Hotel</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: ${gradient};
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                }
                .result-container {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    padding: 40px;
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                }
                .result-icon { font-size: 80px; margin-bottom: 20px; }
                h1 { color: ${accent}; margin-bottom: 10px; }
                p { color: #666; margin-bottom: 20px; }
                .amount { font-size: 24px; color: ${accent}; font-weight: bold; }
                .btn {
                    background: ${accent};
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 8px;
                    text-decoration: none;
                    display: inline-block;
                    margin: 10px;
                    transition: background 0.3s;
                }
            </style>
        </head>
        <body>
            <div class="result-container">
                <div class="result-icon">${icon}</div>
                <h1>${heading}</h1>
                <p>${message}</p>
                <p><strong>Transaction ID:</strong> ${tran_id || 'N/A'}</p>
                ${amount ? `<p><strong>Amount:</strong> <span class="amount">৳${amount}</span></p>` : ''}
                ${extra}
                <a href="/" class="btn">Return to Hotel</a>
                <a href="/my-bookings.html" class="btn">View My Bookings</a>
            </div>
        </body>
        </html>
    `;
}

// Payment callback routes - SSL Commerz calls these via POST by default
async function handlePaymentSuccess(req, res) {
    const params = { ...req.query, ...req.body };
    try {
        const { verified } = await verifyAndRecordPayment(params);
        if (verified) {
            res.send(paymentResultPage({
                icon: '✅', heading: 'Payment Successful!', accent: '#28a745',
                gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                message: 'Your booking has been confirmed.',
                tran_id: params.tran_id, amount: params.amount
            }));
        } else {
            res.send(paymentResultPage({
                icon: '❌', heading: 'Payment Verification Failed', accent: '#dc3545',
                gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
                message: 'We could not verify this payment with SSL Commerz. Please try again or contact support.',
                tran_id: params.tran_id, amount: params.amount
            }));
        }
    } catch (err) {
        console.error('Error recording payment:', err);
        res.status(500).send(paymentResultPage({
            icon: '❌', heading: 'Payment Verification Failed', accent: '#dc3545',
            gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
            message: 'Something went wrong while recording your payment.',
            tran_id: params.tran_id, amount: params.amount
        }));
    }
}
app.get('/payment/success', handlePaymentSuccess);
app.post('/payment/success', handlePaymentSuccess);

function handlePaymentFail(req, res) {
    const params = { ...req.query, ...req.body };
    const { tran_id, amount } = params;

    db.run(`UPDATE bookings SET payment_status = 'failed', payment_details = ? WHERE tran_id = ?`,
        [JSON.stringify(params), tran_id]);

    res.send(paymentResultPage({
        icon: '❌', heading: 'Payment Failed!', accent: '#dc3545',
        gradient: 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)',
        message: 'Your payment was not successful. Please try again or contact support.',
        tran_id, amount
    }));
}
app.get('/payment/fail', handlePaymentFail);
app.post('/payment/fail', handlePaymentFail);

function handlePaymentCancel(req, res) {
    const params = { ...req.query, ...req.body };
    const { tran_id, amount } = params;

    db.run(`UPDATE bookings SET payment_status = 'cancelled', payment_details = ? WHERE tran_id = ?`,
        [JSON.stringify(params), tran_id]);

    res.send(paymentResultPage({
        icon: '⏸️', heading: 'Payment Cancelled!', accent: '#6c757d',
        gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
        message: 'Your payment was cancelled. You can try again anytime.',
        tran_id, amount
    }));
}
app.get('/payment/cancel', handlePaymentCancel);
app.post('/payment/cancel', handlePaymentCancel);

// Instant Payment Notification - SSL Commerz's authoritative server-to-server signal,
// independent of whether the customer's browser makes it back to success_url
app.post('/payment/ipn', async (req, res) => {
    try {
        await verifyAndRecordPayment(req.body);
        res.status(200).send('IPN received');
    } catch (err) {
        console.error('IPN processing error:', err);
        res.status(500).send('IPN processing failed');
    }
});

// Test route to verify SSL Commerz configuration
app.get('/api/test-ssl-config', (req, res) => {
    const gateway_url = 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php';
    res.json({
        message: 'SSL Commerz Configuration Test',
        store_id: SSL_COMMERZ_CONFIG.store_id,
        is_sandbox: SSL_COMMERZ_CONFIG.is_sandbox,
        gateway_url: gateway_url,
        env_variables: {
            SSL_STORE_ID: process.env.SSL_STORE_ID,
            SSL_STORE_PASSWORD: process.env.SSL_STORE_PASSWORD,
            SSL_IS_SANDBOX: process.env.SSL_IS_SANDBOX
        }
    });
});

// ================= CONTACT MESSAGES =================
app.post('/api/contact-messages', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.run(
        `INSERT INTO contact_messages (name, email, subject, message)
         VALUES (?, ?, ?, ?)`,
        [name, email, subject, message],
        function (err) {
            if (err) {
                console.error('Contact insert error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true });
        }
    );
});

// Get all contact messages (newest first)
app.get('/api/contact-messages', (req, res) => {
    db.all(
        'SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC',
        (err, rows) => {
            if (err) {
                console.error('Contact select error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Delete a contact message
app.delete('/api/contact-messages/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM contact_messages WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Contact delete error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, deleted: this.changes });
    });
});

app.get('/api/contact-messages', (req, res) => {
    db.all(
        'SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC',
        (err, rows) => {
            if (err) {
                console.error('Contact select error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

app.delete('/api/contact-messages/:id', (req, res) => {
    db.run('DELETE FROM contact_messages WHERE id = ?', [req.params.id], function (err) {
        if (err) {
            console.error('Contact delete error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, deleted: this.changes });
    });
});




// Serve static files from parent directory (after all API routes)
app.use(express.static(path.join(__dirname, '..')));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`SSL Commerz sandbox store: ${SSL_COMMERZ_CONFIG.store_id}`);
});