import api from './api';

class PaymentService {
  // Create payment intent
  static async createPaymentIntent(paymentData) {
    try {
      const response = await api.post('/payments/create-payment-intent', paymentData);
      return response.data;
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  // Confirm payment
  static async confirmPayment(paymentIntentId, paymentMethodId) {
    try {
      const response = await api.post('/payments/confirm-payment', {
        paymentIntentId,
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  // Get payment transactions (admin)
  static async getTransactions() {
    try {
      const response = await api.get('/payments/transactions');
      return response.data;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  }

  // Process refund
  static async processRefund(transactionId, amount, reason) {
    try {
      const response = await api.post('/payments/refund', {
        transactionId,
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  // Get supported payment methods
  static async getSupportedMethods() {
    try {
      const response = await api.get('/payments/supported-methods');
      return response.data;
    } catch (error) {
      console.error('Get supported methods error:', error);
      throw error;
    }
  }

  // Donation specific methods
  static async createDonation(donationData) {
    try {
      const response = await api.post('/clips/donations', donationData);
      return response.data;
    } catch (error) {
      console.error('Create donation error:', error);
      throw error;
    }
  }

  static async getDonations() {
    try {
      const response = await api.get('/clips/donations');
      return response.data;
    } catch (error) {
      console.error('Get donations error:', error);
      throw error;
    }
  }

  static async updateDonationStatus(donationId, status) {
    try {
      const response = await api.put(`/clips/donations/${donationId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Update donation status error:', error);
      throw error;
    }
  }

  static async getFundraisingStats() {
    try {
      const response = await api.get('/clips/fundraising-stats');
      return response.data;
    } catch (error) {
      console.error('Get fundraising stats error:', error);
      throw error;
    }
  }

  // PayPal integration
  static createPayPalDonationUrl(amount, email, name, message = '') {
    const baseUrl = 'https://www.paypal.com/donate/';
    const params = new URLSearchParams({
      hosted_button_id: process.env.REACT_APP_PAYPAL_BUTTON_ID || 'YOUR_PAYPAL_BUTTON_ID',
      amount: amount.toString(),
      currency_code: 'USD',
      item_name: 'AFEXClips Fundraising',
      return: `${window.location.origin}/donation-success`,
      cancel_return: `${window.location.origin}/donation-cancelled`,
      custom: JSON.stringify({
        email,
        name,
        message,
        timestamp: Date.now()
      })
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Handle PayPal return
  static async handlePayPalReturn(paypalData) {
    try {
      const response = await api.post('/clips/payment-webhook', paypalData);
      return response.data;
    } catch (error) {
      console.error('PayPal return handling error:', error);
      throw error;
    }
  }

  // Contact form
  static async submitContactForm(contactData) {
    try {
      const response = await api.post('/clips/contact', contactData);
      return response.data;
    } catch (error) {
      console.error('Contact form error:', error);
      throw error;
    }
  }

  // Utility methods
  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static validatePaymentData(data) {
    const errors = [];

    if (!data.amount || data.amount < 1) {
      errors.push('Amount must be at least $1');
    }

    if (!data.customer?.name || data.customer.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!data.customer?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer.email)) {
      errors.push('Valid email is required');
    }

    if (!data.paymentMethod) {
      errors.push('Payment method is required');
    }

    return errors;
  }

  static generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default PaymentService; 