import React, { useState, useEffect } from 'react';
import PaymentService from '../../services/paymentService';
import moniepointLogo from '../../assets/moniepoint-logo.png';
import visaLogo from '../../assets/visa.png';
import mastercardLogo from '../../assets/mastercard.png';
import verveLogo from '../../assets/verve.png';

const PaymentModal = ({ isOpen, onClose, onSuccess, type = 'donation', initialAmount = 10 }) => {
  const [formData, setFormData] = useState({
    amount: initialAmount,
    name: '',
    email: '',
    message: '',
    paymentMethod: 'paypal'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const response = await PaymentService.getSupportedMethods();
      setPaymentMethods(response.methods.filter(method => method.enabled));
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount < 1) {
      newErrors.amount = 'Amount must be at least $1';
    }

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (type === 'donation') {
        // Create donation record
        const donationResponse = await PaymentService.createDonation({
          amount: parseFloat(formData.amount),
          name: formData.name,
          email: formData.email,
          message: formData.message,
          paymentMethod: formData.paymentMethod
        });

        // Redirect to PayPal
        const paypalUrl = PaymentService.createPayPalDonationUrl(
          formData.amount,
          formData.email,
          formData.name,
          formData.message
        );

        window.location.href = paypalUrl;
      } else {
        // Handle regular payment
        const paymentData = {
          amount: parseFloat(formData.amount),
          currency: 'USD',
          customer: {
            name: formData.name,
            email: formData.email
          },
          paymentMethod: formData.paymentMethod,
          metadata: {
            type: type,
            message: formData.message
          }
        };

        const response = await PaymentService.createPaymentIntent(paymentData);
        
        if (onSuccess) {
          onSuccess(response);
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ submit: error.response?.data?.message || 'Payment processing failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (amount) => {
    setFormData(prev => ({ ...prev, amount }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {type === 'donation' ? 'Support AFEXClips' : 'Complete Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Donation Amount
            </label>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[5, 10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  className={`py-2 px-3 rounded-lg border transition-colors ${
                    formData.amount === amount
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="1"
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave a message of support..."
                maxLength="1000"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <label key={method.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg border transition-colors bg-gray-50 hover:bg-blue-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={formData.paymentMethod === method.id}
                    onChange={handleInputChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium flex items-center">
                    {method.id === 'moniepoint' && (
                      <img src={moniepointLogo} alt="Moniepoint" className="w-7 h-7 mr-2" />
                    )}
                    {method.id === 'card' && (
                      <span className="flex items-center space-x-1 mr-2">
                        <img src={visaLogo} alt="Visa" className="w-7 h-7" />
                        <img src={mastercardLogo} alt="MasterCard" className="w-7 h-7" />
                        <img src={verveLogo} alt="Verve" className="w-7 h-7" />
                      </span>
                    )}
                    {method.name}
                  </span>
                </label>
              ))}
            </div>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>

          {formData.paymentMethod === 'moniepoint' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2 text-sm text-blue-900">
              <strong>Moniepoint Instructions:</strong><br />
              Send payment to Moniepoint Account:<br />
              <span className="font-mono">1234567890</span> (AFEX Donations)<br />
              After payment, please enter your name and email so we can confirm your donation.
            </div>
          )}
          {formData.paymentMethod === 'card' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 text-sm text-gray-700">
              <strong>Bank Card:</strong> Pay securely with Visa, MasterCard, or Verve. Your card details are encrypted and never stored.
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              `Donate $${formData.amount}`
            )}
          </button>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center">
            Your payment is secure and encrypted. We use industry-standard security measures to protect your information.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal; 