// Hotel Booking System JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Booking form elements
    const bookingForm = document.getElementById('bookingForm');
    const calculateBtn = document.getElementById('calculateBtn');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const bookingSummary = document.querySelector('.booking-summary');
    
    // Room prices
    const roomPrices = {
        'standard': 99,
        'deluxe': 149,
        'suite': 249
    };
    
    // Calculate price button
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            calculateBookingPrice();
        });
    }
    
    // Booking form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processBooking();
        });
    }
    
    // Date validation
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    
    if (checkInDate && checkOutDate) {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        checkInDate.min = today;
        
        checkInDate.addEventListener('change', function() {
            // Set minimum checkout date to check-in date
            checkOutDate.min = this.value;
            
            // If checkout date is before check-in date, reset it
            if (checkOutDate.value && checkOutDate.value < this.value) {
                checkOutDate.value = this.value;
            }
        });
        
        checkOutDate.addEventListener('change', function() {
            // If checkout date is before check-in date, show error
            if (this.value < checkInDate.value) {
                alert('Check-out date must be after check-in date');
                this.value = checkInDate.value;
            }
        });
    }
});

function calculateBookingPrice() {
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    const roomType = document.getElementById('roomType');
    const guests = document.getElementById('guests');
    
    if (!checkInDate || !checkOutDate || !roomType || !guests) {
        alert('Please fill in all required fields');
        return;
    }
    
    const checkInValue = checkInDate.value;
    const checkOutValue = checkOutDate.value;
    const roomTypeValue = roomType.value;
    const guestsValue = guests.value;
    
    if (!checkInValue || !checkOutValue || !roomTypeValue) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Calculate number of nights
    const checkIn = new Date(checkInValue);
    const checkOut = new Date(checkOutValue);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
        alert('Check-out date must be after check-in date');
        return;
    }
    
    // Get room price
    const roomPrices = {
        'standard': 99,
        'deluxe': 149,
        'suite': 249
    };
    
    const roomPrice = roomPrices[roomTypeValue] || 99;
    
    // Calculate total
    const subtotal = roomPrice * nights;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    // Update booking summary
    updateBookingSummary(roomTypeValue, checkInValue, checkOutValue, guestsValue, nights, total);
    
    // Show booking summary and confirm button
    const bookingSummary = document.querySelector('.booking-summary');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const calculateBtn = document.getElementById('calculateBtn');
    
    if (bookingSummary) {
        bookingSummary.classList.remove('hidden');
    }
    
    if (confirmBookingBtn) {
        confirmBookingBtn.classList.remove('hidden');
    }
    
    if (calculateBtn) {
        calculateBtn.style.display = 'none';
    }
}

function updateBookingSummary(roomType, checkIn, checkOut, guests, nights, total) {
    const roomNames = {
        'standard': 'Standard Room',
        'deluxe': 'Deluxe Room',
        'suite': 'Executive Suite'
    };
    
    const summaryRoom = document.getElementById('summaryRoom');
    const summaryCheckIn = document.getElementById('summaryCheckIn');
    const summaryCheckOut = document.getElementById('summaryCheckOut');
    const summaryGuests = document.getElementById('summaryGuests');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (summaryRoom) summaryRoom.textContent = roomNames[roomType] || roomType;
    if (summaryCheckIn) summaryCheckIn.textContent = checkIn;
    if (summaryCheckOut) summaryCheckOut.textContent = checkOut;
    if (summaryGuests) summaryGuests.textContent = guests;
    if (summaryTotal) summaryTotal.textContent = total.toFixed(2);
}

async function processBooking() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const bookingData = {
        checkIn: formData.get('checkInDate') || document.getElementById('checkInDate')?.value,
        checkOut: formData.get('checkOutDate') || document.getElementById('checkOutDate')?.value,
        roomType: formData.get('roomType') || document.getElementById('roomType')?.value,
        guests: formData.get('guests') || document.getElementById('guests')?.value,
        specialRequests: formData.get('specialRequests') || document.getElementById('specialRequests')?.value,
        total: parseFloat(document.getElementById('summaryTotal')?.textContent || '0')
    };
    
    // Validate booking data
    if (!validateBookingData(bookingData)) {
        return;
    }
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Please login to proceed with booking');
        return;
    }
    
    try {
        // Create booking in database
        const bookingResponse = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: user.id,
                room_id: getRoomIdByType(bookingData.roomType),
                check_in_date: bookingData.checkIn,
                check_out_date: bookingData.checkOut,
                guests: parseInt(bookingData.guests),
                total_amount: bookingData.total,
                special_requests: bookingData.specialRequests
            })
        });
        
        const bookingResult = await bookingResponse.json();
        
        if (bookingResult.message) {
            // Initialize payment
            console.log('Booking result:', bookingResult);
            
            // Ensure we have a valid booking ID
            if (!bookingResult.id) {
                console.error('Missing booking ID in booking result');
                alert('Error: Could not create booking. Please try again.');
                return;
            }
            
            // Prepare payment data with all required fields
            const paymentData = {
                id: bookingResult.id,
                total_amount: bookingData.total
            };
            
            console.log('Sending to payment gateway:', paymentData);
            const paymentSuccess = await window.paymentGateway.initPayment(paymentData);
            
            if (paymentSuccess) {
                // Reset form
                if (form) form.reset();
                
                const bookingSummary = document.querySelector('.booking-summary');
                const confirmBookingBtn = document.getElementById('confirmBookingBtn');
                const calculateBtn = document.getElementById('calculateBtn');
                
                if (bookingSummary) bookingSummary.classList.add('hidden');
                if (confirmBookingBtn) confirmBookingBtn.classList.add('hidden');
                if (calculateBtn) calculateBtn.style.display = 'block';
                
                // Close modal
                closeModal('bookingModal');
            }
        } else {
            alert('Failed to create booking');
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('Failed to process booking');
    }
}

// Helper function to get room ID by type
function getRoomIdByType(roomType) {
    const roomTypeMap = {
        'standard': 1,
        'deluxe': 3,
        'suite': 5
    };
    return roomTypeMap[roomType] || 1;
}

function validateBookingData(data) {
    if (!data.checkIn || !data.checkOut || !data.roomType || !data.guests) {
        alert('Please fill in all required fields');
        return false;
    }
    
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const today = new Date();
    
    if (checkIn < today) {
        alert('Check-in date cannot be in the past');
        return false;
    }
    
    if (checkOut <= checkIn) {
        alert('Check-out date must be after check-in date');
        return false;
    }
    
    return true;
}

function showBookingConfirmation(bookingData) {
    const confirmationMessage = `
        Booking Confirmed!
        
        Room: ${bookingData.roomType}
        Check-in: ${bookingData.checkIn}
        Check-out: ${bookingData.checkOut}
        Guests: ${bookingData.guests}
        Total: $${bookingData.total}
        
        A confirmation email has been sent to your email address.
        Thank you for choosing LuxStay Hotel!
    `;
    
    alert(confirmationMessage);
}

// Function to close modal (if not already defined)
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Auto-populate room type when booking from room card
function setRoomTypeForBooking(roomType) {
    const roomTypeSelect = document.getElementById('roomType');
    if (roomTypeSelect) {
        roomTypeSelect.value = roomType;
    }
}

// Export functions for use in other files
window.calculateBookingPrice = calculateBookingPrice;
window.processBooking = processBooking;
window.setRoomTypeForBooking = setRoomTypeForBooking;