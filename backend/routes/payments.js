const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middlewares/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');
const axios = require('axios');
const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for Stripe
// @access  Public
router.post('/create-payment-intent', [
  body('amount')
    .isFloat({ min: 1, max: 1000 })
    .withMessage('Amount must be between $1 and $1000'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  body('customer.name').isLength({ min: 2, max: 100 }),
  body('customer.email').isEmail(),
  body('paymentMethod').isIn(['moniepoint', 'card']),
  body('isDonation').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      amount, 
      currency = 'USD', 
      customer,
      paymentMethod,
      isDonation = false,
      donationType = 'general',
      message,
      metadata = {} 
    } = req.body;

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      amount,
      currency,
      paymentMethod,
      transactionId,
      paymentIntentId,
      customer: {
        ...customer,
        userId: req.user?._id
      },
      isDonation,
      donationType,
      message,
      metadata,
      status: 'pending'
    });

    await payment.save();

    // TODO: Integrate with Stripe
    // const stripePaymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: currency.toLowerCase(),
    //   metadata: {
    //     paymentId: payment._id.toString(),
    //     transactionId,
    //     ...metadata
    //   }
    // });

    res.json({
      success: true,
      paymentId: payment._id,
      clientSecret: paymentIntentId, // Replace with stripePaymentIntent.client_secret
      transactionId,
      amount,
      currency,
      metadata
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment with payment method
// @access  Public
router.post('/confirm-payment', [
  body('paymentIntentId').isLength({ min: 10 }),
  body('paymentMethodId').isLength({ min: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, paymentMethodId } = req.body;

    // TODO: Confirm payment with Stripe
    // const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
    //   payment_method: paymentMethodId
    // });

    res.json({
      success: true,
      status: 'succeeded',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Payment confirmation failed' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle payment webhooks
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Payment webhook received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ message: 'Webhook processing failed' });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get payment transactions (admin only)
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    // TODO: Check admin permissions
    const transactions = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('customer.userId', 'username firstName lastName')
      .limit(50);

    const total = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      transactions,
      total,
      totalAmount: totalAmount[0]?.total || 0
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund
// @access  Private
router.post('/refund', auth, [
  body('transactionId').isLength({ min: 10 }),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isLength({ min: 5, max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId, amount, reason } = req.body;

    // TODO: Process refund with payment processor
    console.log(`Processing refund for ${transactionId}: $${amount}`);

    res.json({
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      reason
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Refund processing failed' });
  }
});

// @route   GET /api/payments/supported-methods
// @desc    Get supported payment methods
// @access  Public
router.get('/supported-methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'moniepoint',
        name: 'Moniepoint',
        icon: 'moniepoint',
        enabled: true
      },
      {
        id: 'card',
        name: 'Bank Card (Visa/MasterCard/Verve)',
        icon: 'credit-card',
        enabled: true
      }
    ]
  });
});

// ==================== PREMIUM SUBSCRIPTION ROUTES ====================

// @route   POST /api/payments/premium/verify-payment
// @desc    Verify Paystack payment and activate premium
// @access  Private
router.post('/premium/verify-payment', auth, async (req, res) => {
  try {
    const { reference, email } = req.body;
    
    if (!reference || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reference and email are required' 
      });
    }

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transactionData = paystackResponse.data.data;

    if (transactionData.status !== 'success') {
      return res.json({ 
        success: false, 
        message: 'Payment not successful' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if payment amount matches expected premium amount (₦1000 = 100000 kobo)
    const expectedAmount = 100000; // ₦1000 in kobo
    if (transactionData.amount !== expectedAmount) {
      return res.json({ 
        success: false, 
        message: 'Invalid payment amount' 
      });
    }

    // Activate premium subscription
    await user.activatePremium('monthly', 30);
    
    // Add payment record
    await user.addPaymentRecord(
      transactionData.amount / 100, // Convert from kobo to naira
      reference,
      'completed'
    );

    res.json({ 
      success: true, 
      message: 'Premium activated successfully!',
      user: {
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        daysUntilExpiry: user.getDaysUntilExpiry()
      }
    });

  } catch (error) {
    console.error('Premium payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment verification failed' 
    });
  }
});

// @route   GET /api/payments/premium/status
// @desc    Get user's premium status
// @access  Private
router.get('/premium/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      isPremium: user.isPremium,
      isPremiumActive: user.isPremiumActive(),
      premiumExpiresAt: user.premiumExpiresAt,
      premiumPlan: user.premiumPlan,
      daysUntilExpiry: user.getDaysUntilExpiry(),
      paymentHistory: user.premiumPaymentHistory
    });

  } catch (error) {
    console.error('Get premium status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get premium status' 
    });
  }
});

// @route   POST /api/payments/premium/initialize
// @desc    Initialize Paystack payment for premium
// @access  Private
router.post('/premium/initialize', auth, async (req, res) => {
  try {
    const { email, plan = 'monthly' } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const amount = plan === 'yearly' ? 1000000 : 100000; // ₦10,000 yearly or ₦1,000 monthly in kobo

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount,
        currency: 'NGN',
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/premium/success`,
        metadata: {
          plan,
          userId: req.user._id.toString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      authorizationUrl: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference,
      amount: amount / 100 // Convert to naira
    });

  } catch (error) {
    console.error('Premium payment initialization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize payment' 
    });
  }
});

module.exports = router; 