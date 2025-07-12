# 🎉 Afex Premium System Setup Guide

This guide will help you set up and test the complete Afex Premium subscription system with Paystack integration.

## 📋 What's Included

- ✅ **Premium User Model** - Extended User schema with premium fields
- ✅ **Paystack Integration** - Complete payment processing
- ✅ **Beautiful Premium Page** - React frontend with modern UI
- ✅ **Payment Verification** - Secure payment confirmation
- ✅ **Premium Middleware** - Route protection for premium features
- ✅ **Success Page** - Post-payment experience
- ✅ **Test Scripts** - Comprehensive testing tools

## 🚀 Quick Setup

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install axios

# Frontend dependencies (should already be installed)
cd ../frontend
npm install
```

### 3. Get Paystack Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Create an account or login
3. Go to Settings > API Keys
4. Copy your **Test Secret Key** and **Test Public Key**
5. Update your `.env` file with these keys

## 🧪 Testing the System

### Test the Premium Model

```bash
cd backend
node test-premium.js
```

This will test:
- ✅ User creation with premium fields
- ✅ Premium activation (monthly/yearly)
- ✅ Payment record tracking
- ✅ Expiry date calculations
- ✅ Premium status checking

### Test the Frontend

1. Start your backend server:
```bash
cd backend
npm run dev
```

2. Start your frontend:
```bash
cd frontend
npm start
```

3. Navigate to `/premium` in your browser
4. Test the payment flow with Paystack test cards

## 💳 Paystack Test Cards

Use these test cards for testing:

**Successful Payment:**
- Card: `4084 0840 8408 4081`
- Expiry: Any future date
- CVV: `123`
- PIN: `1234`

**Failed Payment:**
- Card: `4084 0840 8408 4082`
- Expiry: Any future date
- CVV: `123`
- PIN: `1234`

## 🔧 API Endpoints

### Premium Payment Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/premium/initialize` | Initialize Paystack payment |
| `POST` | `/api/payments/premium/verify-payment` | Verify payment and activate premium |
| `GET` | `/api/payments/premium/status` | Get user's premium status |

### Example Usage

**Initialize Payment:**
```javascript
const response = await fetch('/api/payments/premium/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    plan: 'monthly' // or 'yearly'
  })
});
```

**Verify Payment:**
```javascript
const response = await fetch('/api/payments/premium/verify-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reference: 'paystack_reference',
    email: 'user@example.com'
  })
});
```

## 🎨 Frontend Features

### Premium Page (`/premium`)

- **Beautiful UI** with gradient backgrounds
- **Plan Selection** (Monthly/Yearly)
- **Feature Showcase** with icons
- **Premium Status Display** for active subscribers
- **Responsive Design** for all devices

### Success Page (`/premium/success`)

- **Payment Verification** on load
- **Success/Failure Handling**
- **Feature Overview** for new subscribers
- **Navigation Options**

### Sidebar Integration

- **Premium Link** in "More" dropdown
- **Crown Icon** for premium features
- **Easy Access** from any page

## 🔒 Premium Middleware

### Require Premium Access

```javascript
const { requirePremium } = require('../middlewares/premium');

// Protect premium-only routes
router.get('/premium-feature', requirePremium, (req, res) => {
  // Only premium users can access
  res.json({ message: 'Premium feature accessed!' });
});
```

### Optional Premium Info

```javascript
const { optionalPremium } = require('../middlewares/premium');

// Add premium info without blocking access
router.get('/feature', optionalPremium, (req, res) => {
  if (req.premiumInfo?.isPremiumActive) {
    // Show premium version
  } else {
    // Show free version
  }
});
```

## 📊 Premium Features

### What Premium Users Get

1. **🚫 No Ads** - Ad-free experience
2. **🔒 Private Stories** - Share with select followers
3. **🚀 Boost Posts** - 3x more visibility
4. **👑 Premium Badge** - Special status indicator
5. **🎁 Exclusive Content** - Premium-only features
6. **⚡ Priority Support** - Faster response times

### Pricing Plans

| Plan | Price | Savings | Duration |
|------|-------|---------|----------|
| Monthly | ₦1,000 | 33% off | 30 days |
| Yearly | ₦10,000 | 44% off | 365 days |

## 🔄 Payment Flow

1. **User clicks "Get Premium"** on `/premium` page
2. **Frontend calls** `/api/payments/premium/initialize`
3. **Backend creates** Paystack payment session
4. **User redirected** to Paystack payment page
5. **User completes** payment with card/bank
6. **Paystack redirects** to `/premium/success?reference=xxx`
7. **Success page calls** `/api/payments/premium/verify-payment`
8. **Backend verifies** payment with Paystack
9. **User premium** status updated in database
10. **User sees** success confirmation

## 🛠️ Customization

### Change Pricing

Edit the plans in `frontend/src/pages/Premium.js`:

```javascript
const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '₦1,000', // Change this
    originalPrice: '₦1,500', // Change this
    period: 'month',
    popular: false,
    savings: '33% off'
  },
  // ... yearly plan
];
```

### Change Features

Update the features array in the same file:

```javascript
const features = [
  {
    icon: <FiX className="w-5 h-5" />,
    title: 'No Ads',
    description: 'Enjoy a completely ad-free experience'
  },
  // Add more features here
];
```

### Change Payment Amount

Update the amount calculation in `backend/routes/payments.js`:

```javascript
const amount = plan === 'yearly' ? 1000000 : 100000; // ₦10,000 yearly or ₦1,000 monthly in kobo
```

## 🚀 Deployment

### Backend (Render/Railway)

1. Set environment variables in your deployment platform
2. Ensure `PAYSTACK_SECRET_KEY` is set
3. Update `FRONTEND_URL` to your production domain

### Frontend (Netlify/Vercel)

1. Deploy your React app
2. Update the backend URL in API calls if needed
3. Test the payment flow in production

## 🔍 Troubleshooting

### Common Issues

**Payment verification fails:**
- Check Paystack secret key is correct
- Verify the payment amount matches expected
- Ensure user email exists in database

**Premium status not updating:**
- Check user authentication token
- Verify database connection
- Check for JavaScript errors in console

**Paystack redirect issues:**
- Verify callback URL is correct
- Check CORS settings
- Ensure frontend URL is accessible

### Debug Mode

Add this to your backend for detailed logging:

```javascript
// In your payment routes
console.log('Payment data:', req.body);
console.log('User:', req.user);
console.log('Paystack response:', paystackResponse.data);
```

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check the backend logs for API errors
3. Verify your Paystack keys are correct
4. Test with the provided test cards
5. Run the test script to verify the system

## 🎯 Next Steps

After setup, consider adding:

- **Email receipts** for payments
- **Premium analytics** dashboard
- **Auto-renewal** functionality
- **Premium-only content** system
- **Referral rewards** for premium users
- **Premium user badges** in posts

---

**🎉 Congratulations!** Your Afex Premium system is now ready to generate revenue and provide value to your users! 