// Hotel Management System - Admin Panel JavaScript

// Top-level initialization in admin.js
// document.addEventListener('DOMContentLoaded', ...) initialization
document.addEventListener('DOMContentLoaded', function() {
    // Admin panel elements
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const adminTabs = document.querySelectorAll('.admin-sidebar a');
    const tabContents = document.querySelectorAll('.admin-tab');

    // Initialize admin panel
    initializeAdminPanel();

    // Remove sample data loader; load real backend data instead
    try {
        // Initialize event listeners first
        initializeAdminEventListeners();

        // Initial real data loads from backend
        // Add small delay to ensure DOM is ready
        setTimeout(() => {
            loadRooms();
            loadUsers();
            loadPayments();
            updateDashboardStats();
            loadRecentBookings();
            loadBookings(); // now defined below
            loadContactMessages();
        }, 100);
    } catch (err) {
        console.error('Admin panel initialization failed:', err);
    }
});

function initializeAdminPanel() {
    // Show admin panel for admin users
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
        const adminPanelBtn = document.createElement('button');
        adminPanelBtn.id = 'adminPanelBtn';
        adminPanelBtn.textContent = 'Admin Panel';
        
        adminPanelBtn.addEventListener('click', function() {
            document.getElementById('adminPanel').classList.remove('hidden');
        });
        
        document.body.appendChild(adminPanelBtn);
    }
}

function initializeAdminEventListeners() {
    // Close admin panel
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', function() {
            document.getElementById('adminPanel').classList.add('hidden');
        });
    }
    
    // Tab switching
    const adminTabs = document.querySelectorAll('.admin-sidebar a');
    const tabContents = document.querySelectorAll('.admin-tab');
    
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            adminTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetTab = this.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
            if (targetTab === 'payments') { if (typeof loadPayments === 'function') loadPayments(); }
            if (targetTab === 'dashboard') { updateDashboardStats(); loadRecentBookings(); }
            if (targetTab === 'admin-contact') { loadContactMessages(); }
        });
    });
    
    // Booking filters
    const bookingSearch = document.getElementById('bookingSearch');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBookings = document.getElementById('refreshBookings');
    
    if (bookingSearch) {
        bookingSearch.addEventListener('input', filterBookings);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterBookings);
    }
    
    if (refreshBookings) {
        refreshBookings.addEventListener('click', loadBookings);
    }

    // Contact refresh
    const refreshContact = document.getElementById('refreshContact');
    if (refreshContact) {
        refreshContact.addEventListener('click', loadContactMessages);
    }
    
    // Settings form
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings();
        });
    }
    
    // Add room button
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', showAddRoomModal);
    }
    
    // Add user button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
}

function loadSampleData() {
    // Sample bookings data
    const sampleBookings = [
        {
            id: 'BK001',
            guest: 'John Doe',
            room: 'Deluxe Room',
            checkIn: '2023-07-15',
            checkOut: '2023-07-18',
            status: 'confirmed',
            total: 447
        },
        {
            id: 'BK002',
            guest: 'Jane Smith',
            room: 'Executive Suite',
            checkIn: '2023-07-20',
            checkOut: '2023-07-25',
            status: 'pending',
            total: 1245
        },
        {
            id: 'BK003',
            guest: 'Mike Johnson',
            room: 'Standard Room',
            checkIn: '2023-07-22',
            checkOut: '2023-07-24',
            status: 'confirmed',
            total: 198
        }
    ];
    
    // Sample rooms data
    const sampleRooms = [
        { number: '101', type: 'Standard', price: 99, capacity: 2, status: 'available' },
        { number: '102', type: 'Standard', price: 99, capacity: 2, status: 'occupied' },
        { number: '201', type: 'Deluxe', price: 149, capacity: 2, status: 'available' },
        { number: '202', type: 'Deluxe', price: 149, capacity: 2, status: 'maintenance' },
        { number: '301', type: 'Suite', price: 249, capacity: 4, status: 'available' }
    ];
    
    // Sample users data
    const sampleUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'guest', joined: '2023-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'guest', joined: '2023-02-20' },
        { id: 3, name: 'Admin User', email: 'admin@luxstay.com', role: 'admin', joined: '2023-01-01' }
    ];
    
    // Store sample data in localStorage
    localStorage.setItem('sampleBookings', JSON.stringify(sampleBookings));
    localStorage.setItem('sampleRooms', JSON.stringify(sampleRooms));
    localStorage.setItem('sampleUsers', JSON.stringify(sampleUsers));
    
    // Load data into tables
    // Replace sample data loader with real backend fetches
    try {
        initializeAdminPanel();
    
        // Load real backend data instead of sample/localStorage
        loadBookings();
        loadRooms();
        if (typeof loadUsers === 'function') { loadUsers(); }
        if (typeof loadPayments === 'function') { loadPayments(); }

        updateDashboardStats();
        loadRecentBookings();

        initializeAdminEventListeners();
    } catch (err) {
        console.error('Admin panel initialization failed:', err);
    }
}

// Load Users from backend
function loadUsers() {
    fetch('/api/users')
        .then(res => res.json())
        .then(users => {
            const tbody = document.querySelector('.users-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name || ''}</td>
                    <td>${user.email || ''}</td>
                    <td>${user.role || ''}</td>
                    <td>${user.joined || ''}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editUser(${user.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Failed to load users:', err);
        });
}

// Delete User
// Fix Delete User to only call the correct endpoint
function editUser(userId) {
    alert(`Edit user ${userId} - This would open an edit modal in a real application.`);
}

function deleteUser(userId) {
    if (confirm(`Are you sure you want to delete user ${userId}?`)) {
        fetch(`/api/users/${userId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                loadUsers();
                alert('User deleted successfully!');
            })
            .catch(err => {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user.');
            });
    }
}

// Load Rooms from backend
function loadRooms() {
    fetch('/api/rooms')
        .then(res => res.json())
        .then(rooms => {
            const tbody = document.querySelector('.rooms-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            rooms.forEach(room => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${room.number}</td>
                    <td>${room.type}</td>
                    <td>$${room.price}</td>
                    <td>${room.capacity}</td>
                    <td><span class="status ${room.status}">${room.status}</span></td>
                    <td>
                        <button class="action-btn delete-btn" onclick="deleteRoom(${room.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
}

// Delete Room
function deleteRoom(roomId) {
    if (confirm(`Are you sure you want to delete room ${roomId}?`)) {
        fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                loadRooms();
                alert('Room deleted successfully!');
            });
    }
}

// Load Bookings from backend
// cachedBookings and new loadBookings implementation
// Cache for bookings fetched from backend
let cachedBookings = [];

// Load Bookings from backend and populate the bookings table
function loadBookings() {
    fetch('/api/bookings')
        .then(res => res.json())
        .then(bookings => {
            cachedBookings = Array.isArray(bookings) ? bookings : [];

            const tbody = document.querySelector('.bookings-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            cachedBookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking.id}</td>
                    <td>${booking.guest_name || ''}</td>
                    <td>${booking.room_type || ''}</td>
                    <td>${booking.check_in_date || ''}</td>
                    <td>${booking.check_out_date || ''}</td>
                    <td><span class="status ${booking.status || ''}">${booking.status || ''}</span></td>
                    <td>
                        <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Failed to load bookings:', err);
        });
}

// Load Payments from backend
function loadPayments() {
    fetch('/api/manual-payments')
        .then(res => res.json())
        .then(payments => {
            const tbody = document.querySelector('.payments-table tbody');
            if (!tbody) return;
            tbody.innerHTML = '';
            payments.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.id}</td>
                    <td>#${p.booking_id}</td>
                    <td>${p.tran_id || ''}</td>
                    <td>৳${Number(p.amount || 0).toFixed(2)}</td>
                    <td>${p.method}</td>
                    <td>${p.payer_mobile}</td>
                    <td><span class="status ${p.status}">${p.status}</span></td>
                    <td>
                        ${p.status === 'pending'
                            ? `<button class="action-btn" onclick="approvePayment(${p.id})">Approve</button>
                               <button class="action-btn delete-btn" onclick="rejectPayment(${p.id})">Reject</button>`
                            : '-'}
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
}

// Delete Booking
function deleteBooking(bookingId) {
    if (confirm(`Are you sure you want to delete booking ${bookingId}?`)) {
        fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                loadBookings();
                alert('Booking deleted successfully!');
            });
    }
}

// Replace filterBookings to use cachedBookings from backend instead of localStorage
function filterBookings() {
    const searchTerm = (document.getElementById('bookingSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const tbody = document.querySelector('.bookings-table tbody');

    if (!tbody) return;
    const bookings = cachedBookings;

    tbody.innerHTML = '';

    const filtered = bookings.filter(b => {
        const idStr = String(b.id || '').toLowerCase();
        const guestStr = String(b.guest_name || '').toLowerCase();
        const roomStr = String(b.room_type || '').toLowerCase();
        const matchesSearch = idStr.includes(searchTerm) || guestStr.includes(searchTerm) || roomStr.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || (b.status || '').toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    filtered.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.guest_name || ''}</td>
            <td>${booking.room_type || ''}</td>
            <td>${booking.check_in_date || ''}</td>
            <td>${booking.check_out_date || ''}</td>
            <td><span class="status ${booking.status || ''}">${booking.status || ''}</span></td>
            <td>
                <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editBooking(bookingId) {
    alert(`Edit booking ${bookingId} - This would open an edit modal in a real application.`);
}

function editRoom(roomNumber) {
    alert(`Edit room ${roomNumber} - This would open an edit modal in a real application.`);
}

function showAddRoomModal() {
    const roomData = prompt('Enter room data (Number, Type, Price, Capacity):\nExample: 401, Standard, 99, 2');
    
    if (roomData) {
        const [number, type, price, capacity] = roomData.split(',').map(item => item.trim());
        
        if (number && type && price && capacity) {
            const newRoom = {
                number: number,
                type: type,
                price: parseInt(price),
                capacity: parseInt(capacity),
                status: 'available'
            };
            
            const rooms = JSON.parse(localStorage.getItem('sampleRooms') || '[]');
            rooms.push(newRoom);
            localStorage.setItem('sampleRooms', JSON.stringify(rooms));
            loadRooms();
            alert('Room added successfully!');
        } else {
            alert('Please enter all required fields.');
        }
    }
}

function showAddUserModal() {
    const userData = prompt('Enter user data (Name, Email, Role):\nExample: John Doe, john@example.com, guest');
    
    if (userData) {
        const [name, email, role] = userData.split(',').map(item => item.trim());
        
        if (name && email && role) {
            const newUser = {
                id: Date.now(),
                name: name,
                email: email,
                role: role,
                joined: new Date().toISOString().split('T')[0]
            };
            
            const users = JSON.parse(localStorage.getItem('sampleUsers') || '[]');
            users.push(newUser);
            localStorage.setItem('sampleUsers', JSON.stringify(users));
            loadUsers();
            alert('User added successfully!');
        } else {
            alert('Please enter all required fields.');
        }
    }
}

function saveSettings() {
    const hotelName = document.getElementById('hotelName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const address = document.getElementById('address').value;
    const checkInTime = document.getElementById('checkInTime').value;
    const checkOutTime = document.getElementById('checkOutTime').value;
    
    // In a real application, you would save this to a database
    const settings = {
        hotelName,
        contactEmail,
        contactPhone,
        address,
        checkInTime,
        checkOutTime
    };
    
    localStorage.setItem('hotelSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

function approvePayment(id) {
    fetch(`/api/manual-payments/${id}/approve`, { method: 'POST' })
        .then(res => res.json())
        .then(() => { loadPayments(); loadBookings(); alert('Payment approved and booking confirmed.'); });
}

function rejectPayment(id) {
    fetch(`/api/manual-payments/${id}/reject`, { method: 'POST' })
        .then(res => res.json())
        .then(() => { loadPayments(); alert('Payment rejected.'); });
}

// Initialize refresh payments button when DOM is ready
const btn = document.getElementById('refreshPayments');
if (btn) btn.addEventListener('click', loadPayments);

// Update dashboard stats
// Fix updateDashboardStats to use backend stats
function updateDashboardStats() {
    fetch('/api/dashboard/stats')
        .then(res => res.json())
        .then(stats => {
            const statNumbers = document.querySelectorAll('.stat-number');
            if (statNumbers.length >= 4) {
                statNumbers[0].textContent = stats.totalBookings ?? 0;
                statNumbers[1].textContent = stats.availableRooms ?? 0;
                statNumbers[2].textContent = stats.registeredUsers ?? 0;
                statNumbers[3].textContent = `$${(stats.totalRevenue ?? 0).toLocaleString()}`;
            }
        })
        .catch(err => {
            console.error('Failed to load dashboard stats:', err);
        });
}

// Load Recent Bookings for dashboard
function loadRecentBookings() {
    fetch('/api/bookings?limit=5')
        .then(res => res.json())
        .then(bookings => {
            // Replace the demo rows inside the dashboard "Recent Bookings" table
            const tbody = document.querySelector('.recent-bookings table tbody');
            if (!tbody) return;

            const items = Array.isArray(bookings) ? bookings : [];
            const top = items.slice(0, 5);
            tbody.innerHTML = '';

            if (top.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No recent bookings</td></tr>';
                return;
            }

            top.forEach(b => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>#${b.id ?? ''}</td>
                    <td>${b.guest_name || ''}</td>
                    <td>${b.room_type || ''}</td>
                    <td>${b.check_in_date || ''}</td>
                    <td>${b.check_out_date || ''}</td>
                    <td><span class="status ${b.status || ''}">${b.status || ''}</span></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => {
            console.error('Failed to load recent bookings:', err);
        });
}

// Load Contact Messages
function loadContactMessages() {
    fetch('/api/contact-messages')
        .then(res => res.json())
        .then(messages => {
            const tbody = document.querySelector('.contact-table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!messages || messages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No contact messages</td></tr>';
                return;
            }
            
            messages.forEach(msg => {
                const row = document.createElement('tr');
                const dateRaw = msg.created_at || msg.submitted_at;
                const date = dateRaw ? new Date(dateRaw).toLocaleString() : '';
                row.innerHTML = `
                    <td>${msg.id || 'N/A'}</td>
                    <td>${msg.name}</td>
                    <td>${msg.email}</td>
                    <td>${msg.subject}</td>
                    <td>${msg.message.substring(0, 50)}...</td>
                    <td>${date}</td>
                    <td>
                        <button onclick="viewContactMessage(${msg.id})">View</button>
                        <button onclick="deleteContactMessage(${msg.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(err => console.error('Failed to load contact messages:', err));
}

function viewContactMessage(id) {
    alert(`View message ${id} - This would open a modal in a real application.`);
}

function deleteContactMessage(id) {
    if (confirm('Are you sure you want to delete this message?')) {
        fetch(`/api/contact-messages/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
                loadContactMessages();
            })
            .catch(err => console.error('Delete failed:', err));
    }
}

// Add to global exports
if (typeof loadContactMessages === 'function') window.loadContactMessages = loadContactMessages;
if (typeof viewContactMessage === 'function') window.viewContactMessage = viewContactMessage;
if (typeof deleteContactMessage === 'function') window.deleteContactMessage = deleteContactMessage;

// Guard global exports to prevent ReferenceError halting the script
if (typeof editBooking === 'function') window.editBooking = editBooking;
if (typeof deleteBooking === 'function') window.deleteBooking = deleteBooking;
if (typeof editRoom === 'function') window.editRoom = editRoom;
if (typeof deleteRoom === 'function') window.deleteRoom = deleteRoom;
if (typeof editUser === 'function') window.editUser = editUser;
if (typeof deleteUser === 'function') window.deleteUser = deleteUser;
if (typeof showAddRoomModal === 'function') window.showAddRoomModal = showAddRoomModal;
if (typeof showAddUserModal === 'function') window.showAddUserModal = showAddUserModal;
if (typeof saveSettings === 'function') window.saveSettings = saveSettings;
if (typeof updateDashboardStats === 'function') window.updateDashboardStats = updateDashboardStats;
if (typeof loadPayments === 'function') window.loadPayments = loadPayments;
if (typeof approvePayment === 'function') window.approvePayment = approvePayment;
if (typeof rejectPayment === 'function') window.rejectPayment = rejectPayment;