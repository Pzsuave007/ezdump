'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, CheckCircle, Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function BookingConfirmationPage() {
  const params = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/bookings/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setBooking(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching booking:', err);
          setLoading(false);
        });
    }
  }, [params.id]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Truck className="h-8 w-8 text-gray-900" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
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

            <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
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

              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Estimated Total:</span>
                  <span className="text-gray-900">${booking.estimatedPrice}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">What Happens Next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>We'll review your request and check availability</li>
                <li>We'll contact you to confirm the booking</li>
                <li>On the scheduled day, we'll drop off the trailer</li>
                <li>You load it up, and we'll haul it away!</li>
              </ol>
            </div>

            <div className="text-gray-600 mb-8">
              <p className="mb-2">Questions? Contact us:</p>
              <p className="flex items-center justify-center mb-1">
                <Phone className="h-4 w-4 mr-2" /> (509) 123-4567
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
