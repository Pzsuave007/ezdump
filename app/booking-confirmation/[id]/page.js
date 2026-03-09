'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, CheckCircle, Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Loader2, CreditCard, AlertCircle, DollarSign } from 'lucide-react';

const DEPOSIT_AMOUNT = 50;
const PHONE_NUMBER = '509-863-3109';

export default function BookingConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Check for payment return
  const sessionId = searchParams.get('session_id');
  const paymentResult = searchParams.get('payment');

  // Fetch booking data
  useEffect(() => {
    if (params.id) {
      fetch(`/api/bookings/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setBooking(data);
          setLoading(false);
          
          // If we have a session_id, check payment status
          if (sessionId && paymentResult === 'success') {
            pollPaymentStatus(sessionId);
          }
        })
        .catch(err => {
          console.error('Error fetching booking:', err);
          setLoading(false);
        });
    }
  }, [params.id, sessionId, paymentResult]);

  // Poll payment status
  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error('Failed to check payment status');

      const data = await response.json();

      if (data.paymentStatus === 'paid') {
        setPaymentStatus('success');
        // Refresh booking data
        const bookingRes = await fetch(`/api/bookings/${params.id}`);
        const bookingData = await bookingRes.json();
        setBooking(bookingData);
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        return;
      }

      // Continue polling
      setPaymentStatus('processing');
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  // Initiate payment
  const handlePayDeposit = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.id,
          originUrl: window.location.origin,
        }),
      });

      const data = await response.json();
      
      // Handle demo mode (Stripe not configured)
      if (data.demo) {
        setPaymentStatus('demo');
        setPaymentError(null);
        setPaymentLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }
      
      // Redirect to Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const loadTypeLabels = {
    household: 'Household Junk',
    furniture: 'Furniture',
    yard_waste: 'Yard Waste',
    construction: 'Construction Debris',
    mixed: 'Mixed Load'
  };

  const isDepositPaid = booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Easy Load & Dump" 
                width={200} 
                height={65} 
                className="h-14 w-auto"
              />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Payment Status Banner */}
        {paymentStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <p className="font-medium text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-600">Your ${DEPOSIT_AMOUNT} deposit has been received.</p>
            </div>
          </div>
        )}
        
        {paymentStatus === 'processing' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
            <Loader2 className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
            <div>
              <p className="font-medium text-blue-800">Processing Payment...</p>
              <p className="text-sm text-blue-600">Please wait while we confirm your payment.</p>
            </div>
          </div>
        )}
        
        {paymentResult === 'cancelled' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">Payment Cancelled</p>
              <p className="text-sm text-yellow-600">You can try again when you're ready.</p>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {booking.requestType === 'quote' ? 'Quote Request Received!' : 'Booking Request Received!'}
            </h1>
            <p className="text-gray-600 mb-8">
              {booking.requestType === 'quote' 
                ? "We've received your quote request. We'll get back to you shortly with a detailed estimate."
                : "We've received your booking request. We'll confirm your appointment soon."
              }
            </p>

            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Booking Details</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">{new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-gray-600 text-sm">{booking.preferredTime}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.rentalDuration} Hour Rental</p>
                    <p className="text-gray-600 text-sm">{loadTypeLabels[booking.loadType] || booking.loadType}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <p className="font-medium">{booking.address}</p>
                </div>
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Total:</span>
                  <span className="font-semibold">${booking.estimatedPrice}</span>
                </div>
                {isDepositPaid && (
                  <div className="flex justify-between text-green-600">
                    <span>Deposit Paid:</span>
                    <span className="font-semibold">-${booking.depositAmount || DEPOSIT_AMOUNT}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Balance Due:</span>
                  <span>${isDepositPaid ? (booking.estimatedPrice - (booking.depositAmount || DEPOSIT_AMOUNT)) : booking.estimatedPrice}</span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            {!isDepositPaid && booking.requestType !== 'quote' && (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white mb-6">
                <div className="flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 mr-2" />
                  <h3 className="text-lg font-semibold">Secure Your Booking</h3>
                </div>
                
                {paymentStatus === 'demo' ? (
                  <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                    <p className="text-blue-100 font-medium mb-2">Payment System Ready!</p>
                    <p className="text-blue-200 text-sm mb-3">
                      Online payment processing is configured and ready. Once a Stripe API key is added, customers can pay the ${DEPOSIT_AMOUNT} deposit securely online.
                    </p>
                    <p className="text-gray-300 text-xs">
                      For now, we'll contact you to arrange payment. Your booking is saved!
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300 text-sm mb-4">
                      Pay a ${DEPOSIT_AMOUNT} deposit now to confirm your spot. The balance (${booking.estimatedPrice - DEPOSIT_AMOUNT}) is due on the day of service.
                    </p>
                    
                    {paymentError && (
                      <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 mb-4">
                        <p className="text-red-200 text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {paymentError}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handlePayDeposit}
                      disabled={paymentLoading}
                      className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-6"
                      size="lg"
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-5 w-5 mr-2" />
                          Pay ${DEPOSIT_AMOUNT} Deposit Now
                        </>
                      )}
                    </Button>
                    
                    <p className="text-gray-400 text-xs mt-3">
                      Secure payment powered by Stripe. Your booking will be prioritized once deposit is received.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Deposit Paid Confirmation */}
            {isDepositPaid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">Deposit Paid!</h3>
                </div>
                <p className="text-green-600 text-sm">
                  Your ${booking.depositAmount || DEPOSIT_AMOUNT} deposit has been received. Your booking is confirmed!
                </p>
              </div>
            )}

            <div className="bg-gray-100 rounded-lg p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">What Happens Next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                {!isDepositPaid && <li className="text-gray-900 font-medium">Pay your deposit to confirm the booking</li>}
                <li>We'll review your request and confirm availability</li>
                <li>We'll contact you with final confirmation</li>
                <li>On the scheduled day, we'll drop off the trailer</li>
                <li>You load it up, and we'll haul it away!</li>
              </ol>
            </div>

            <div className="text-gray-600 mb-8">
              <p className="mb-2">Questions? Contact us:</p>
              <p className="flex items-center justify-center mb-1">
                <Phone className="h-4 w-4 mr-2" /> {PHONE_NUMBER}
              </p>
              <p className="flex items-center justify-center">
                <Mail className="h-4 w-4 mr-2" /> info@ezloadndump.com
              </p>
            </div>

            <Link href="/">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
