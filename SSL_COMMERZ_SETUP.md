# SSL Commerz Payment Gateway Setup

## Overview
This hotel booking system now includes SSL Commerz payment gateway integration for secure online payments.

## Features
- ✅ Secure payment processing
- ✅ Multiple payment methods (Credit/Debit Cards, Mobile Banking)
- ✅ Payment status tracking
- ✅ Automatic booking confirmation after successful payment
- ✅ Sandbox and production environment support

## Setup Instructions

### 1. SSL Commerz Account Setup
1. Visit [SSL Commerz](https://developer.sslcommerz.com/) and create an account
2. Apply for a merchant account
3. Get your Store ID and Store Password from the SSL Commerz dashboard

### 2. Update Configuration
Edit `Backend/server.js` and update the SSL Commerz configuration:

```javascript
const SSL_COMMERZ_CONFIG = {
    store_id: 'YOUR_STORE_ID', // Replace with your actual store ID
    store_passwd: 'YOUR_STORE_PASSWORD', // Replace with your actual store password
    is_sandbox: true, // Set to false for production
    success_url: 'https://your-domain.com/payment/success',
    fail_url: 'https://your-domain.com/payment/fail',
    cancel_url: 'https://your-domain.com/payment/cancel',
    ipn_url: 'https://your-domain.com/payment/ipn'
};
```

### 3. Environment Configuration

#### For Development (Sandbox):
- Set `is_sandbox: true`
- Use sandbox credentials
- Test with SSL Commerz test cards

#### For Production:
- Set `is_sandbox: false`
- Use production credentials
- Update URLs to your domain

### 4. Test Cards (Sandbox Environment)

#### Credit/Debit Cards:
- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **Expiry**: Any future date
- **CVV**: Any 3 digits

#### Mobile Banking:
- Use any valid mobile number
- OTP: 123456

## Payment Flow

1. **User Books Room**: User fills booking form and clicks "Proceed to Payment"
2. **Payment Initialization**: System creates booking and initializes payment
3. **SSL Commerz Gateway**: User redirected to SSL Commerz payment page
4. **Payment Processing**: User completes payment using their preferred method
5. **Payment Validation**: System validates payment and updates booking status
6. **Confirmation**: User receives confirmation of successful booking

## API Endpoints

### Payment Initialization
```
POST /api/payment/init
Body: {
    booking_id: number,
    amount: number,
    customer_name: string,
    customer_email: string,
    customer_phone: string
}
```

### Payment Validation
```
POST /api/payment/validate
Body: SSL Commerz payment response data
```

### Payment Callbacks
- `GET /payment/success` - Successful payment callback
- `GET /payment/fail` - Failed payment callback
- `GET /payment/cancel` - Cancelled payment callback
- `POST /payment/ipn` - Instant Payment Notification

## Database Schema Updates

The bookings table now includes payment fields:
- `payment_status`: 'pending', 'completed', 'failed'
- `tran_id`: SSL Commerz transaction ID
- `payment_details`: JSON string of payment response

## Security Features

- ✅ MD5 hash validation for payment responses
- ✅ Transaction ID tracking
- ✅ Payment status verification
- ✅ Secure callback handling

## Troubleshooting

### Common Issues:

1. **Payment not initializing**:
   - Check SSL Commerz credentials
   - Verify server is running on correct port
   - Check browser console for errors

2. **Payment validation failing**:
   - Verify hash calculation
   - Check payment response data
   - Ensure callback URLs are accessible

3. **Payment window not opening**:
   - Check popup blocker settings
   - Verify SSL Commerz gateway URL
   - Check network connectivity

### Debug Mode:
Enable debug logging by adding console.log statements in payment.js:

```javascript
console.log('Payment data:', paymentData);
console.log('Payment response:', result);
```

## Production Deployment

1. **Update URLs**: Change placeholder URLs to your deployment domain or set `BASE_URL` environment variable
2. **SSL Certificate**: Ensure HTTPS is enabled
3. **Environment Variables**: Use environment variables for sensitive data
4. **Database**: Use production database
5. **Monitoring**: Set up payment monitoring and alerts

## Support

For SSL Commerz support:
- Email: support@sslcommerz.com
- Documentation: https://developer.sslcommerz.com/
- API Reference: https://developer.sslcommerz.com/doc/

For application support:
- Check server logs for errors
- Verify database connectivity
- Test with sandbox credentials first 