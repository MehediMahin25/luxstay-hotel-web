// Simple Payment Gateway Integration

class PaymentGateway {
    // Initialize payment for a booking
    async initPayment(bookingData) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to proceed with payment');
                return false;
            }

            console.log('Initializing payment for booking:', bookingData);

            // Make sure all required fields are present
            if (!bookingData.id || !bookingData.total_amount) {
                console.error('Missing required booking data:', bookingData);
                alert('Missing required booking information. Please try again.');
                return false;
            }

            const paymentData = {
                booking_id: bookingData.id,
                amount: bookingData.total_amount,
                customer_name: user.name || 'Guest User',
                customer_email: user.email || 'guest@example.com',
                customer_phone: user.phone || '01700000000'
            };
            
            console.log('Payment data being sent:', paymentData);

            try {
                const response = await fetch('/api/payment/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(paymentData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server returned error status:', response.status, errorText);
                    alert(`Payment initialization failed: Server returned ${response.status}`);
                    return false;
                }

                const result = await response.json();
                console.log('Payment initialization response:', result);
                
                if (result.success) {
                    // Full-page redirect to SSL Commerz - mobile banking OTP and 3D-secure
                    // steps are unreliable inside a popup, so this must be a top-level navigation
                    window.location.href = result.gateway_url;
                    return true;
                } else {
                    const errorMessage = result.error || 'Failed to initialize payment';
                    console.error('Payment initialization failed:', errorMessage);
                    alert(`Payment initialization failed: ${errorMessage}`);
                    return false;
                }
            } catch (error) {
                console.error('Error during payment initialization fetch:', error);
                alert('Payment initialization failed: Network error');
                return false;
            }
        } catch (error) {
            console.error('Payment initialization error:', error);
            alert(`Payment initialization failed: ${error.message || 'Unknown error'}`);
            return false;
        }
    }

    // Get payment status for a booking
    async getPaymentStatus(bookingId) {
        try {
            const response = await fetch(`/api/bookings/${bookingId}`);
            const booking = await response.json();
            return booking.payment_status || 'pending';
        } catch (error) {
            console.error('Error getting payment status:', error);
            return 'unknown';
        }
    }

    // Format amount for display
    formatAmount(amount) {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT'
        }).format(amount);
    }
}

// Initialize payment gateway
const paymentGateway = new PaymentGateway();

// Export for use in other files
window.paymentGateway = paymentGateway;