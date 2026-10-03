// My Bookings Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    const loggedOutState = document.getElementById('loggedOutState');
    const bookingsLoggedIn = document.getElementById('bookingsLoggedIn');
    const bookingsLoading = document.getElementById('bookingsLoading');
    const noBookingsState = document.getElementById('noBookingsState');
    const bookingsGrid = document.getElementById('bookingsGrid');
    const statusFilter = document.getElementById('myStatusFilter');
    const refreshBtn = document.getElementById('refreshMyBookings');
    const goToLoginBtn = document.getElementById('goToLoginBtn');

    let allBookings = [];

    const roomTypeNames = {
        standard: 'Standard Room',
        deluxe: 'Deluxe Room',
        suite: 'Executive Suite'
    };

    const statusLabels = {
        confirmed: 'Confirmed',
        pending: 'Pending',
        cancelled: 'Cancelled'
    };

    const paymentStatusMeta = {
        completed: { label: 'Paid', className: 'confirmed' },
        pending: { label: 'Payment Pending', className: 'pending' },
        review: { label: 'Under Review', className: 'pending' },
        failed: { label: 'Payment Failed', className: 'cancelled' },
        cancelled: { label: 'Payment Cancelled', className: 'cancelled' }
    };

    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function bookingCardHTML(booking) {
        const roomTypeKey = (booking.room_type || '').toLowerCase();
        const roomLabel = roomTypeNames[roomTypeKey] || booking.room_type || 'Room';
        const roomNumber = booking.room_number ? `#${booking.room_number}` : '';
        const status = (booking.status || 'pending').toLowerCase();
        const statusLabel = statusLabels[status] || booking.status || 'Pending';
        const payMeta = paymentStatusMeta[(booking.payment_status || 'pending').toLowerCase()]
            || { label: booking.payment_status || 'Pending', className: 'pending' };

        return `
            <div class="booking-card">
                <div class="booking-card-header">
                    <div>
                        <h3>${roomLabel} ${roomNumber}</h3>
                        <span class="booking-id">Booking #${booking.id}</span>
                    </div>
                    <span class="status ${status}">${statusLabel}</span>
                </div>
                <div class="booking-card-body">
                    <div class="booking-detail">
                        <i class="fas fa-calendar-check"></i>
                        <span><strong>Check-in:</strong> ${formatDate(booking.check_in_date)}</span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-calendar-times"></i>
                        <span><strong>Check-out:</strong> ${formatDate(booking.check_out_date)}</span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-users"></i>
                        <span><strong>Guests:</strong> ${booking.guests ?? 'N/A'}</span>
                    </div>
                    <div class="booking-detail">
                        <i class="fas fa-money-bill-wave"></i>
                        <span><strong>Total:</strong> ৳${Number(booking.total_amount || 0).toFixed(2)}</span>
                    </div>
                    ${booking.special_requests ? `
                    <div class="booking-detail">
                        <i class="fas fa-comment-dots"></i>
                        <span><strong>Requests:</strong> ${booking.special_requests}</span>
                    </div>` : ''}
                </div>
                <div class="booking-card-footer">
                    <span class="pay-status ${payMeta.className}">${payMeta.label}</span>
                    <span class="booked-on">Booked on ${formatDate(booking.created_at)}</span>
                </div>
            </div>
        `;
    }

    function renderList() {
        if (!bookingsGrid) return;
        const filter = statusFilter ? statusFilter.value : 'all';
        const filtered = filter === 'all'
            ? allBookings
            : allBookings.filter(b => (b.status || '').toLowerCase() === filter);

        if (filtered.length === 0) {
            bookingsGrid.innerHTML = '';
            if (noBookingsState) noBookingsState.classList.remove('hidden');
            return;
        }

        if (noBookingsState) noBookingsState.classList.add('hidden');
        bookingsGrid.innerHTML = filtered.map(bookingCardHTML).join('');
    }

    async function fetchBookings(userId) {
        if (bookingsLoading) bookingsLoading.classList.remove('hidden');
        if (bookingsGrid) bookingsGrid.innerHTML = '';
        if (noBookingsState) noBookingsState.classList.add('hidden');

        try {
            console.log('--- Checking user bookings fetch: start ---');
            const res = await fetch(`/api/bookings?user_id=${encodeURIComponent(userId)}`);
            console.log('--- Checking user bookings fetch: HTTP status', res.status, '---');
            allBookings = await res.json();
            if (!Array.isArray(allBookings)) allBookings = [];
        } catch (e) {
            console.error('--- Checking user bookings fetch: failed ---', e);
            allBookings = [];
        } finally {
            console.log('--- Checking user bookings fetch: end ---');
            if (bookingsLoading) bookingsLoading.classList.add('hidden');
            renderList();
        }
    }

    function render() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        if (!user) {
            if (loggedOutState) loggedOutState.classList.remove('hidden');
            if (bookingsLoggedIn) bookingsLoggedIn.classList.add('hidden');
            return;
        }

        if (loggedOutState) loggedOutState.classList.add('hidden');
        if (bookingsLoggedIn) bookingsLoggedIn.classList.remove('hidden');
        fetchBookings(user.id);
    }

    if (statusFilter) statusFilter.addEventListener('change', renderList);
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user) fetchBookings(user.id);
        });
    }
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.click();
        });
    }

    // React to login/logout happening on this page (via auth.js)
    document.addEventListener('authchange', render);

    render();
});
