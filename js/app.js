// Hotel Management System - Main Application JavaScript

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Menu Toggle for Mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    const authButtons = document.querySelector('.auth-buttons');
    const themeToggle = document.getElementById('themeToggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            authButtons.classList.toggle('active');
        });
    }

    // Theme / Dark Mode Toggle
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        themeToggle.addEventListener('click', function () {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
    
    // Room Data (Sample data - in a real application, this would come from a database)
    const roomsData = [
        {
            id: 1,
            name: 'Standard Room',
            type: 'standard',
            price: 99,
            capacity: 2,
            description: 'Comfortable room with essential amenities for a pleasant stay.',
            features: ['Free Wi-Fi', 'TV', 'Air Conditioning'],
            // Room card image – put your file at /img/rooms/standard-room.jpg
            image: 'img/rooms/standard-room.jpg'
        },
        {
            id: 2,
            name: 'Deluxe Room',
            type: 'deluxe',
            price: 149,
            capacity: 2,
            description: 'Spacious room with premium amenities and city view.',
            features: ['Free Wi-Fi', 'TV', 'Mini Bar', 'City View'],
            // Room card image – put your file at /img/rooms/deluxe-room.jpg
            image: 'img/rooms/deluxe-room.jpg'
        },
        {
            id: 3,
            name: 'Executive Suite',
            type: 'suite',
            price: 249,
            capacity: 4,
            description: 'Luxurious suite with separate living area and premium amenities.',
            features: ['Free Wi-Fi', 'TV', 'Mini Bar', 'Living Area', 'Ocean View'],
            // Room card image – put your file at /img/rooms/executive-suite.jpg
            image: 'img/rooms/executive-suite.jpg'
        },
        {
            id: 4,
            name: 'Family Room',
            type: 'standard',
            price: 179,
            capacity: 4,
            description: 'Spacious room designed for families with children.',
            features: ['Free Wi-Fi', 'TV', 'Air Conditioning', 'Family Friendly'],
            // Room card image – put your file at /img/rooms/family-room.jpg
            image: 'img/rooms/family-room.jpg'
        },
        {
            id: 5,
            name: 'Premium Deluxe',
            type: 'deluxe',
            price: 199,
            capacity: 2,
            description: 'Premium deluxe room with upgraded amenities and services.',
            features: ['Free Wi-Fi', 'TV', 'Mini Bar', 'Premium Service', 'Balcony'],
            // Room card image – put your file at /img/rooms/premium-deluxe.jpg
            image: 'img/rooms/premium-deluxe.jpg'
        },
        {
            id: 6,
            name: 'Presidential Suite',
            type: 'suite',
            price: 399,
            capacity: 4,
            description: 'Our most luxurious accommodation with panoramic views and exclusive services.',
            features: ['Free Wi-Fi', 'TV', 'Mini Bar', 'Living Area', 'Dining Area', 'Panoramic View'],
            // Room card image – put your file at /img/rooms/presidential-suite.jpg
            image: 'img/rooms/presidential-suite.jpg'
        }
    ];
    
    // Populate Rooms
    const roomContainer = document.querySelector('.room-container');
    
    function displayRooms(rooms) {
        if (!roomContainer) return;
        
        roomContainer.innerHTML = '';
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.dataset.type = room.type;
            
            const featuresHTML = room.features.map(feature => 
                `<span><i class="fas fa-check"></i> ${feature}</span>`
            ).join('');
            
            roomCard.innerHTML = `
                <div class="room-image">
                    <img src="${room.image}" alt="${room.name}">
                </div>
                <div class="room-details">
                    <h3>${room.name}</h3>
                    <p>${room.description}</p>
                    <div class="room-features">
                        ${featuresHTML}
                    </div>
                    <div class="room-price">
                        $${room.price} <span>per night</span>
                    </div>
                    <button class="book-now-btn" data-room-id="${room.id}">Book Now</button>
                </div>
            `;
            
            roomContainer.appendChild(roomCard);
        });
        
        // Add event listeners to Book Now buttons
        document.querySelectorAll('.book-now-btn').forEach(button => {
            button.addEventListener('click', function() {
                const roomId = this.getAttribute('data-room-id');
                openBookingModal(roomId);
            });
        });
    }
    
    // Initial display of all rooms
    displayRooms(roomsData);
    
    // Room Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter rooms
                if (filter === 'all') {
                    displayRooms(roomsData);
                } else {
                    const filteredRooms = roomsData.filter(room => room.type === filter);
                    displayRooms(filteredRooms);
                }
            });
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            // Only intercept in-page anchors; let normal links (e.g. other pages) navigate.
            if (!targetId || !targetId.startsWith('#')) return;

            e.preventDefault();

            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    authButtons.classList.remove('active');
                }
            }
        });
    });
    
    // Contact Form Submission
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: this.querySelector('input[placeholder="Name"]').value,
                email: this.querySelector('input[placeholder="Email"]').value,
                subject: this.querySelector('input[placeholder="Subject"]').value,
                message: this.querySelector('textarea[placeholder="Message"]').value,
                submitted_at: new Date().toISOString()
            };
            
            // Send to backend
            fetch('/api/contact-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                alert('Thank you! Your message has been sent.');
                contactForm.reset();
            })
            .catch(err => {
                console.error('Error submitting contact form:', err);
                alert('Error sending message. Please try again.');
            });
        });
    }
    
    // Newsletter Subscription
    const subscribeForm = document.querySelector('.subscribe-form');
    
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real application, you would send the email to a server
            alert('Thank you for subscribing to our newsletter!');
            subscribeForm.reset();
        });
    }
    
    // Learn More Button
    const learnMoreBtn = document.querySelector('.learn-more-btn');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', function() {
            alert('Learn more about our hotel services and amenities!');
        });
    }
    
    // Book Now Button in Hero Section
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.addEventListener('click', function() {
            // Scroll to rooms section
            const roomsSection = document.getElementById('rooms');
            if (roomsSection) {
                roomsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Notifications
    initNotifications();
});

// Function to open booking modal
function openBookingModal(roomId) {
    const modal = document.getElementById('bookingModal');
    const roomTypeSelect = document.getElementById('roomType');
    
    if (modal && roomTypeSelect) {
        // Set the selected room type based on the room ID
        const roomsData = [
            { id: 1, type: 'standard', name: 'Standard Room', price: 99 },
            { id: 2, type: 'deluxe', name: 'Deluxe Room', price: 149 },
            { id: 3, type: 'suite', name: 'Executive Suite', price: 249 },
            { id: 4, type: 'standard', name: 'Family Room', price: 179 },
            { id: 5, type: 'deluxe', name: 'Premium Deluxe', price: 199 },
            { id: 6, type: 'suite', name: 'Presidential Suite', price: 399 }
        ];
        
        const selectedRoom = roomsData.find(room => room.id == roomId);
        
        if (selectedRoom) {
            roomTypeSelect.value = selectedRoom.type;
        }
        
        modal.style.display = 'block';
    }
}

function initNotifications() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const btn = document.getElementById('notifBtn');
    const dd = document.getElementById('notifDropdown');
    const markAll = document.getElementById('markAllRead');

    if (!btn || !dd) return;

    btn.addEventListener('click', () => {
        dd.classList.toggle('hidden');
        if (!dd.classList.contains('hidden')) {
            fetchNotifications();
        }
    });

    document.addEventListener('click', (e) => {
        const within = e.target.closest('.notifications');
        if (!within && !dd.classList.contains('hidden')) dd.classList.add('hidden');
    });

    if (markAll) {
        markAll.addEventListener('click', async () => {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            if (!u) return;
            await fetch('/api/notifications/read-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: u.id })
            });
            fetchNotifications();
        });
    }

    if (user) {
        fetchNotifications();
        setInterval(fetchNotifications, 30000);
    }
}

async function fetchNotifications() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    const empty = document.querySelector('.notif-empty');
    if (!user || !badge || !list) return;

    try {
        const res = await fetch(`/api/notifications?user_id=${user.id}`);
        const items = await res.json();

        const unread = items.filter(i => i.is_read === 0).length;
        if (unread > 0) {
            badge.textContent = String(unread);
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        list.innerHTML = '';
        if (items.length === 0) {
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        items.forEach(n => {
            const li = document.createElement('li');
            li.className = n.is_read ? '' : 'unread';
            li.innerHTML = `
                <div>
                    <div><strong>${n.title || 'Notification'}</strong></div>
                    <div>${n.message || ''}</div>
                    <div class="meta">${new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div>
                    ${n.is_read ? '' : '<button class="mark">Mark read</button>'}
                </div>
            `;
            if (!n.is_read) {
                li.querySelector('.mark').addEventListener('click', async () => {
                    await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
                    fetchNotifications();
                });
            }
            list.appendChild(li);
        });
    } catch (e) {
        // ignore errors silently
    }
}

// Global function to close modals
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Close modals when clicking close button
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('close-btn')) {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
});

// Contact Messages endpoint
// app.post('/api/contact-messages', (req, res) => {
//     const { name, email, subject, message } = req.body;

//     if (!name || !email || !subject || !message) {
//         return res.status(400).json({ error: 'All fields are required' });
//     }

//     db.run(
//         `INSERT INTO contact_messages (name, email, subject, message)
//          VALUES (?, ?, ?, ?)`,
//         [name, email, subject, message],
//         function (err) {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).json({ error: 'Database error' });
//             }
//             res.json({ success: true, id: this.lastID });
//         }
//     );
// });

// // Get all contact messages
// app.get('/api/contact-messages', (req, res) => {
//     const query = 'SELECT * FROM contact_messages ORDER BY submitted_at DESC';
    
//     db.query(query, (err, results) => {
//         if (err) {
//             console.error('Error fetching contact messages:', err);
//             return res.status(500).json({ error: 'Failed to fetch messages' });
//         }
//         res.json(results);
//     });
// });

// // Delete contact message
// app.delete('/api/contact-messages/:id', (req, res) => {
//     const query = 'DELETE FROM contact_messages WHERE id = ?';
    
//     db.query(query, [req.params.id], (err, result) => {
//         if (err) {
//             console.error('Error deleting contact message:', err);
//             return res.status(500).json({ error: 'Failed to delete message' });
//         }
//         res.json({ success: true, message: 'Message deleted' });
//     });
// });

// Create contact_messages table
// app.get('/api/create-contact-messages-table', (req, res) => {
//     const query = `
//         CREATE TABLE IF NOT EXISTS contact_messages (
//             id INT AUTO_INCREMENT PRIMARY KEY,
//             name VARCHAR(255) NOT NULL,
//             email VARCHAR(255) NOT NULL,
//             subject VARCHAR(255) NOT NULL,
//             message TEXT NOT NULL,
//             submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//             status VARCHAR(50) DEFAULT 'new',
//             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         )
//     `;
    
//     db.query(query, (err, result) => {
//         if (err) {
//             console.error('Error creating contact_messages table:', err);
//             return res.status(500).json({ error: 'Failed to create table' });
//         }
//         res.json({ success: true, message: 'Table created or already exists' });
//     });
// });