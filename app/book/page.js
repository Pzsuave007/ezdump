'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    preferredDate: '',
    preferredTime: '',
    rentalDuration: '2',
    loadType: '',
    description: '',
    promoCode: '',
    requestType: 'booking',
    agreedToTerms: false
  });

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  const calculateEstimate = () => {
    if (!pricing) return 0;
    const hours = parseInt(formData.rentalDuration);
    const baseHours = 2;
    const extraHours = Math.max(0, hours - baseHours);
    return pricing.baseRentalFee + pricing.deliveryFee + pricing.dumpFee + (extraHours * pricing.extraHourFee);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit booking');
      }

      const booking = await response.json();
      toast.success('Booking request submitted successfully!');
      router.push(`/booking-confirmation/${booking.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Truck className="h-8 w-8 text-orange-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
            </Link>
            <Link href="/" className="text-gray-600 hover:text-orange-500 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Dump Trailer</h1>
          <p className="text-gray-600">Fill out the form below and we'll confirm your booking.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Contact Information</h3>
                    
                    <div>
                      <Label htmlFor="customerName">Full Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleChange('customerName', e.target.value)}
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="(509) 123-4567"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Service Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="123 Main St, Spokane, WA 99201"
                        required
                      />
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Service Details</h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferredDate">Preferred Date *</Label>
                        <Input
                          id="preferredDate"
                          type="date"
                          value={formData.preferredDate}
                          onChange={(e) => handleChange('preferredDate', e.target.value)}
                          min={today}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferredTime">Preferred Time *</Label>
                        <Select value={formData.preferredTime} onValueChange={(v) => handleChange('preferredTime', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7:00 AM">7:00 AM</SelectItem>
                            <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                            <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                            <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                            <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                            <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                            <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                            <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                            <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                            <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rentalDuration">Rental Duration *</Label>
                        <Select value={formData.rentalDuration} onValueChange={(v) => handleChange('rentalDuration', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 Hours</SelectItem>
                            <SelectItem value="3">3 Hours (+${pricing?.extraHourFee || 35})</SelectItem>
                            <SelectItem value="4">4 Hours (+${(pricing?.extraHourFee || 35) * 2})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="loadType">Type of Load *</Label>
                        <Select value={formData.loadType} onValueChange={(v) => handleChange('loadType', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select load type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="household">Household Junk</SelectItem>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="yard_waste">Yard Waste</SelectItem>
                            <SelectItem value="construction">Construction Debris</SelectItem>
                            <SelectItem value="mixed">Mixed Load</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Tell us more about what you need to haul away..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                      <Input
                        id="promoCode"
                        value={formData.promoCode}
                        onChange={(e) => handleChange('promoCode', e.target.value)}
                        placeholder="Enter promo code"
                      />
                    </div>
                  </div>

                  {/* Request Type */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Request Type</h3>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requestType"
                          value="booking"
                          checked={formData.requestType === 'booking'}
                          onChange={(e) => handleChange('requestType', e.target.value)}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span>Book Now</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requestType"
                          value="quote"
                          checked={formData.requestType === 'quote'}
                          onChange={(e) => handleChange('requestType', e.target.value)}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span>Request Quote First</span>
                      </label>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => handleChange('agreedToTerms', checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                      I agree to the <Link href="/faq" className="text-orange-500 hover:underline">terms and conditions</Link>, including the list of prohibited items and weight restrictions.
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      formData.requestType === 'booking' ? 'Submit Booking Request' : 'Request Quote'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Price Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Price Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Trailer Rental</span>
                    <span>${pricing?.baseRentalFee || 150}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery & Pickup</span>
                    <span>${pricing?.deliveryFee || 50}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Dump Fee</span>
                    <span>${pricing?.dumpFee || 75}</span>
                  </div>
                  {parseInt(formData.rentalDuration) > 2 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Extra Time (+{parseInt(formData.rentalDuration) - 2} hr)</span>
                      <span>${(parseInt(formData.rentalDuration) - 2) * (pricing?.extraHourFee || 35)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Estimated Total</span>
                      <span className="text-orange-500">${calculateEstimate()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-orange-50 rounded-lg text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-2">Note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Final price may vary based on load weight</li>
                    <li>Extra fees may apply for prohibited items</li>
                    <li>Travel fee may apply outside service area</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
