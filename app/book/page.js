'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Truck, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

// Distance tier delivery fees
const DELIVERY_FEES = {
  standard: 50,   // 0-20 miles
  extended: 75,   // 20-30 miles (+$25)
  far: 100        // 30-50 miles (+$50)
};

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1); // 1 = calendar, 2 = time slots, 3 = form

  // Get calculator params from URL
  const urlDuration = searchParams.get('duration');
  const urlLoadType = searchParams.get('loadType');
  const urlDistance = searchParams.get('distance');
  const urlAddress = searchParams.get('address');

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: urlAddress || '',
    preferredDate: '',
    preferredTime: '',
    rentalDuration: urlDuration || '2',
    loadType: urlLoadType || '',
    description: '',
    promoCode: '',
    requestType: 'booking',
    agreedToTerms: false,
    distanceTier: urlDistance || 'standard'
  });

  // Update form when URL params change
  useEffect(() => {
    if (urlDuration || urlLoadType || urlDistance || urlAddress) {
      setFormData(prev => ({
        ...prev,
        rentalDuration: urlDuration || prev.rentalDuration,
        loadType: urlLoadType || prev.loadType,
        distanceTier: urlDistance || prev.distanceTier,
        address: urlAddress || prev.address
      }));
    }
  }, [urlDuration, urlLoadType, urlDistance, urlAddress]);

  // Fetch pricing
  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  // Fetch availability when month changes
  useEffect(() => {
    fetchAvailability();
  }, [currentDate]);

  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const response = await fetch(`/api/availability?month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || {});
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Get delivery fee based on distance tier
  const getDeliveryFee = () => {
    return DELIVERY_FEES[formData.distanceTier] || DELIVERY_FEES.standard;
  };

  const calculateEstimate = () => {
    if (!pricing) return 0;
    const hours = parseInt(formData.rentalDuration);
    const baseHours = 2;
    const extraHours = Math.max(0, hours - baseHours);
    const deliveryFee = getDeliveryFee();
    return pricing.baseRentalFee + deliveryFee + pricing.dumpFee + (extraHours * pricing.extraHourFee);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (dateStr) => {
    const dayAvailability = availability[dateStr];
    if (!dayAvailability?.available) return;
    
    setSelectedDate(dateStr);
    setFormData(prev => ({ ...prev, preferredDate: dateStr }));
    setStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, preferredTime: time }));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // Include calculated estimate in the submission
      const bookingData = {
        ...formData,
        estimatedPrice: calculateEstimate(),
        deliveryFee: getDeliveryFee()
      };
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
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

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date();
  const canGoPrevious = currentDate.getMonth() > thisMonth.getMonth() || currentDate.getFullYear() > thisMonth.getFullYear();

  // Calendar Component
  const CalendarView = () => (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={previousMonth}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingAvailability ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-500 text-xs py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells */}
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square"></div>
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayAvailability = availability[dateStr];
                const isAvailable = dayAvailability?.available;
                const isPast = dayAvailability?.isPast;
                const isClosed = dayAvailability?.reason === 'Closed on Sundays';
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(dateStr)}
                    disabled={!isAvailable}
                    className={`
                      aspect-square p-1 rounded-lg text-sm font-medium transition-all
                      flex flex-col items-center justify-center
                      ${isSelected ? 'bg-gray-900 text-white ring-2 ring-gray-900' : ''}
                      ${isAvailable && !isSelected ? 'bg-green-50 hover:bg-green-100 text-green-800 cursor-pointer hover:ring-2 hover:ring-green-400' : ''}
                      ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                      ${isClosed ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                      ${!isAvailable && !isPast && !isClosed ? 'bg-red-50 text-red-400 cursor-not-allowed' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-gray-400' : ''}
                    `}
                  >
                    <span className={`${isToday ? 'font-bold' : ''}`}>{day}</span>
                    {isAvailable && !isSelected && (
                      <span className="text-[10px] text-green-600">{dayAvailability.totalAvailable} open</span>
                    )}
                    {isClosed && (
                      <span className="text-[10px]">Closed</span>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-gray-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span className="text-gray-600">Fully Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span className="text-gray-600">Unavailable</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Time Slots Component
  const TimeSlotsView = () => {
    const dayAvailability = availability[selectedDate];
    const slots = dayAvailability?.slots || [];
    
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Calendar
            </Button>
          </div>
          <CardTitle className="text-xl mt-2">
            <Calendar className="h-5 w-5 inline mr-2" />
            {formatDateForDisplay(selectedDate)}
          </CardTitle>
          <p className="text-gray-600 text-sm">Select an available time slot</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && handleTimeSelect(slot.time)}
                disabled={!slot.available}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  ${slot.available 
                    ? 'border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100 cursor-pointer' 
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed'}
                  ${selectedTime === slot.time ? 'border-gray-900 bg-gray-900 text-white' : ''}
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className={`h-4 w-4 ${selectedTime === slot.time ? 'text-white' : slot.available ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-semibold">{slot.time}</span>
                </div>
                <div className={`text-xs mt-1 ${selectedTime === slot.time ? 'text-gray-200' : slot.available ? 'text-green-600' : 'text-gray-400'}`}>
                  {slot.available ? (
                    <><CheckCircle className="h-3 w-3 inline mr-1" />Available</>
                  ) : (
                    <><XCircle className="h-3 w-3 inline mr-1" />Booked</>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Booking Form Component
  const BookingFormView = () => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Time Slots
          </Button>
        </div>
        <CardTitle className="text-xl mt-2">Complete Your Booking</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="bg-gray-100">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDateForDisplay(selectedDate)}
          </Badge>
          <Badge variant="outline" className="bg-gray-100">
            <Clock className="h-3 w-3 mr-1" />
            {selectedTime}
          </Badge>
        </div>
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

          {/* Terms */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreedToTerms}
              onCheckedChange={(checked) => handleChange('agreedToTerms', checked)}
            />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the <Link href="/faq" className="text-gray-900 underline hover:text-gray-700">terms and conditions</Link>, including the list of prohibited items and weight restrictions.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              'Submit Booking Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

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
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-black text-white py-12 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/pqljudvy_dump%20trailer3.webp" 
            alt="Dump trailer ready for your load"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Dump Trailer</h1>
          <p className="text-lg text-gray-300">Choose your date and time from our live calendar</p>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
              1
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Select Date</span>
          </div>
          <div className={`w-12 h-1 mx-2 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Select Time</span>
          </div>
          <div className={`w-12 h-1 mx-2 ${step >= 3 ? 'bg-gray-900' : 'bg-gray-300'}`}></div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Your Info</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar/Form Area */}
          <div className="md:col-span-2">
            {step === 1 && <CalendarView />}
            {step === 2 && <TimeSlotsView />}
            {step === 3 && <BookingFormView />}
          </div>

          {/* Price Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Price Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Trailer Rental</span>
                    <span>${pricing?.baseRentalFee || 99}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery & Pickup</span>
                    <span>${getDeliveryFee()}</span>
                  </div>
                  {formData.distanceTier !== 'standard' && (
                    <div className="flex justify-between text-sm text-gray-500">
                      <span className="italic">
                        {formData.distanceTier === 'extended' && '(20-30 miles: +$25)'}
                        {formData.distanceTier === 'far' && '(30-50 miles: +$50)'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Dump Fee</span>
                    <span>${pricing?.dumpFee || 65}</span>
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
                      <span className="text-gray-900">${calculateEstimate()}</span>
                    </div>
                  </div>
                </div>
                
                {selectedDate && selectedTime && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">Selected:</p>
                    <p className="text-sm text-green-700">{formatDateForDisplay(selectedDate)}</p>
                    <p className="text-sm text-green-700">{selectedTime}</p>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <p className="font-semibold text-gray-800 mb-2">Note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Final price may vary based on load weight</li>
                    <li>Extra fees may apply for prohibited items</li>
                    <li>Travel fee may apply outside service area</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Service Image */}
            <div className="mt-6 rounded-lg overflow-hidden shadow-md">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/8qzjl5qc_14Ft_Dump_Trailer.jpg"
                alt="Our dump trailer"
                className="w-full h-48 object-cover"
              />
              <div className="bg-gray-900 text-white p-3 text-center text-sm">
                Our 14ft dump trailer - ready for your job!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
