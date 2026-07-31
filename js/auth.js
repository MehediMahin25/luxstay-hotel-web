// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const usernameDisplay = document.getElementById('username');
    
    // Open Login Modal
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.style.display = 'block';
        });
    }
    
    // Open Register Modal
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            registerModal.style.display = 'block';
        });
    }
    
    // Close Modals
    if (closeButtons.length > 0) {
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                loginModal.style.display = 'none';
                registerModal.style.display = 'none';
            });
        });
    }
    
    // Switch to Register Modal
    if (showRegister) {
        showRegister.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'block';
        });
    }
    
    // Switch to Login Modal
    if (showLogin) {
        showLogin.addEventListener('click', function() {
            registerModal.style.display = 'none';
            loginModal.style.display = 'block';
        });
    }
    
    // Close Modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    // Ensure user data has all required fields
                    const userDataWithDefaults = {
                        ...data.user,
                        name: data.user.name || 'Guest User',
                        email: data.user.email || 'guest@example.com',
                        phone: data.user.phone || '01700000000' // Add default phone number
                    };
                    
                    console.log('Storing user data:', userDataWithDefaults);
                    localStorage.setItem('user', JSON.stringify(userDataWithDefaults));
                    updateAuthUI();
                    loginModal.style.display = 'none';
                }
            })
            .catch(() => alert('Login failed'));
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    updateAuthUI();
                    registerModal.style.display = 'none';
                }
            })
            .catch(() => alert('Registration failed'));
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear user data
            localStorage.removeItem('user');
            
            // Update UI
            updateAuthUI();

            // Close admin panel if open
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) adminPanel.classList.add('hidden');
        });
    }
    
    // Update Auth UI based on login status
    function updateAuthUI() {
        const user = JSON.parse(localStorage.getItem('user'));
        const adminPanel = document.getElementById('adminPanel');
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        const myBookingsNavItem = document.getElementById('myBookingsNavItem');

        console.log('updateAuthUI called, user:', user);

        if (user) {
            // User is logged in
            authButtons.classList.add('hidden');
            userProfile.classList.remove('hidden');
            usernameDisplay.textContent = user.name;
            if (myBookingsNavItem) myBookingsNavItem.classList.remove('hidden');

            // Show admin panel button if admin
            if (user.role === 'admin') {
                console.log('User is admin, setting up admin panel button');
                if (!adminPanelBtn) {
                    // Create admin panel button if not present
                    const btn = document.createElement('button');
                    btn.id = 'adminPanelBtn';
                    btn.textContent = 'Admin Panel';
                    btn.style.marginLeft = '10px';
                    btn.addEventListener('click', function() {
                        console.log('Admin panel button clicked');
                        if (adminPanel) {
                            adminPanel.classList.remove('hidden');
                            // Initialize admin functionality when panel is opened
                            if (typeof initializeAdmin === 'function') {
                                initializeAdmin();
                            } else {
                                console.log('initializeAdmin function not found');
                            }
                        }
                    });
                    userProfile.appendChild(btn);
                } else {
                    adminPanelBtn.style.display = 'inline-block';
                }
                // Don't automatically show admin panel, let user click the button
                if (adminPanel) adminPanel.classList.add('hidden');
            } else {
                // Hide admin panel button if not admin
                if (adminPanelBtn) adminPanelBtn.style.display = 'none';
                if (adminPanel) adminPanel.classList.add('hidden');
            }
        } else {
            // User is logged out
            authButtons.classList.remove('hidden');
            userProfile.classList.add('hidden');
            usernameDisplay.textContent = '';
            if (adminPanelBtn) adminPanelBtn.style.display = 'none';
            if (adminPanel) adminPanel.classList.add('hidden');
            if (myBookingsNavItem) myBookingsNavItem.classList.add('hidden');
        }

        // Let other scripts (e.g. My Bookings page) react to auth state changes
        document.dispatchEvent(new Event('authchange'));
    }

    // On page load, update UI
    updateAuthUI();
});
