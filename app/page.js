'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Truck, Package, Trash2, Clock, MapPin, Phone, Mail, CheckCircle, ArrowRight, Menu, X, Star, DollarSign, Calculator, Loader2, AlertCircle, Navigation } from 'lucide-react';

// Office location coordinates (2508 E 5th Ave Spokane WA 99202)
const OFFICE_LAT = 47.6515;
const OFFICE_LNG = -117.3985;
const PHONE_NUMBER = '509-863-3109';

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricing, setPricing] = useState(null);
  
  // Calculator state
  const [calcDuration, setCalcDuration] = useState('2');
  const [calcLoadType, setCalcLoadType] = useState('household');
  
  // Address/distance state
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [distanceResult, setDistanceResult] = useState(null); // { miles, tier, fee, canServe }
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  const totalEstimate = pricing ? pricing.baseRentalFee + pricing.deliveryFee + pricing.dumpFee : 275;
  
  // Clean and normalize address for better geocoding
  const cleanAddress = (address) => {
    return address
      .replace(/\n/g, ', ')           // Replace newlines with commas
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/,\s*,/g, ',')         // Remove double commas
      .replace(/^\s*,\s*/, '')        // Remove leading commas
      .replace(/\s*,\s*$/, '')        // Remove trailing commas
      .trim();
  };

  // Check distance from address
  const checkDistance = async () => {
    if (!customerAddress.trim()) {
      setAddressError('Please enter your address');
      return;
    }
    
    setCheckingDistance(true);
    setAddressError('');
    setDistanceResult(null);
    
    try {
      // Clean the address
      let cleanedAddress = cleanAddress(customerAddress);
      
      // Remove common Google Maps artifacts
      cleanedAddress = cleanedAddress
        .replace(/\+/g, ' ')          // Replace + with space
        .replace(/@[\d.-]+,[\d.-]+/g, '') // Remove coordinates like @47.123,-117.456
        .replace(/\d+°\d+'[\d.]+"[NS]\s+\d+°\d+'[\d.]+"[EW]/g, '') // Remove GPS coords
        .trim();
      
      // Try multiple search strategies
      let data = null;
      
      // Strategy 1: Full address with state
      let searchAddress = cleanedAddress;
      if (!cleanedAddress.toLowerCase().includes('wa') && !cleanedAddress.toLowerCase().includes('washington')) {
        searchAddress = cleanedAddress + ', WA';
      }
      if (!cleanedAddress.toLowerCase().includes('usa') && !cleanedAddress.toLowerCase().includes('united states')) {
        searchAddress = searchAddress + ', USA';
      }
      
      const encodedAddress = encodeURIComponent(searchAddress);
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`,
        { headers: { 'User-Agent': 'EasyLoadAndDump/1.0' } }
      );
      data = await response.json();
      
      // Strategy 2: If no result, try with just city/state (extract from address)
      if (!data || data.length === 0) {
        // Try to extract city name from address
        const parts = cleanedAddress.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          // Try last two parts (likely city, state)
          const cityState = parts.slice(-2).join(', ') + ', USA';
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityState)}&limit=1&countrycodes=us`,
            { headers: { 'User-Agent': 'EasyLoadAndDump/1.0' } }
          );
          data = await response.json();
        }
      }
      
      // Strategy 3: Try structured search
      if (!data || data.length === 0) {
        const parts = cleanedAddress.split(',').map(p => p.trim());
        if (parts.length >= 1) {
          // Extract potential city (often the second part after street)
          const potentialCity = parts.length > 1 ? parts[1] : parts[0];
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(potentialCity)}&state=Washington&country=USA&limit=1`,
            { headers: { 'User-Agent': 'EasyLoadAndDump/1.0' } }
          );
          data = await response.json();
        }
      }
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const miles = calculateDistance(OFFICE_LAT, OFFICE_LNG, parseFloat(lat), parseFloat(lon));
        
        // Determine pricing tier
        let tier, fee, canServe;
        if (miles <= 20) {
          tier = 'standard';
          fee = 50;
          canServe = true;
        } else if (miles <= 30) {
          tier = 'extended';
          fee = 75;
          canServe = true;
        } else if (miles <= 50) {
          tier = 'far';
          fee = 100;
          canServe = true;
        } else {
          tier = 'outside';
          fee = 0;
          canServe = false;
        }
        
        setDistanceResult({ miles: Math.round(miles * 10) / 10, tier, fee, canServe });
      } else {
        setAddressError('Could not find that address. Please check and try again.');
      }
    } catch (error) {
      console.error('Error checking distance:', error);
      setAddressError('Error checking distance. Please try again.');
    } finally {
      setCheckingDistance(false);
    }
  };
  
  // Use browser geolocation
  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setAddressError('Geolocation is not supported by your browser');
      return;
    }
    
    setCheckingDistance(true);
    setAddressError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const miles = calculateDistance(OFFICE_LAT, OFFICE_LNG, latitude, longitude);
        
        // Determine pricing tier
        let tier, fee, canServe;
        if (miles <= 20) {
          tier = 'standard';
          fee = 50;
          canServe = true;
        } else if (miles <= 30) {
          tier = 'extended';
          fee = 75;
          canServe = true;
        } else if (miles <= 50) {
          tier = 'far';
          fee = 100;
          canServe = true;
        } else {
          tier = 'outside';
          fee = 0;
          canServe = false;
        }
        
        setDistanceResult({ miles: Math.round(miles * 10) / 10, tier, fee, canServe });
        setCustomerAddress('(Using your current location)');
        setCheckingDistance(false);
      },
      (error) => {
        setAddressError('Could not get your location. Please enter your address manually.');
        setCheckingDistance(false);
      }
    );
  };
  
  // Calculate price based on selections
  const calculatePrice = () => {
    if (!pricing) return { base: 99, delivery: 50, dump: 65, extra: 0, total: 214 };
    
    const base = pricing.baseRentalFee || 99;
    const dump = pricing.dumpFee || 65;
    const extraHourFee = pricing.extraHourFee || 35;
    
    // Use distance-based delivery fee if available, otherwise default
    const delivery = distanceResult?.fee || 50;
    
    // Extra hours calculation
    const extraHours = Math.max(0, parseInt(calcDuration) - 2);
    const extraHoursCost = extraHours * extraHourFee;
    
    const total = base + delivery + dump + extraHoursCost;
    
    return {
      base,
      delivery,
      dump,
      extraHours,
      extraHoursCost,
      total
    };
  };
  
  const calcPricing = calculatePrice();
  
  // Handle book now with calculator selections
  const handleBookFromCalculator = () => {
    const params = new URLSearchParams({
      duration: calcDuration,
      loadType: calcLoadType,
      distance: distanceResult?.tier || 'standard',
      address: customerAddress !== '(Using your current location)' ? customerAddress : ''
    });
    router.push(`/book?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Easy Load & Dump" 
                width={180} 
                height={60} 
                className="h-12 w-auto"
                priority
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
              <Link href="/book">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">Book Now</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Home</Link>
              <Link href="/how-it-works" className="block text-gray-700 hover:text-gray-900 font-medium py-2">How It Works</Link>
              <Link href="/pricing" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-700 hover:text-gray-900 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Contact</Link>
              <Link href="/book" className="block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/pqljudvy_dump%20trailer3.webp" 
            alt="Clean dump trailer ready for your load"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Dump Trailer Rental<br />Made Simple
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-gray-300 max-w-3xl mx-auto">
              We drop it off. You fill it up. We haul it away.<br />
              Junk removal has never been this easy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6">
                  Book Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-gray-300">
              <MapPin className="inline h-5 w-5 mr-1" /> Serving Spokane, WA & surrounding areas (30 mile radius)
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-6 text-lg">Simple 3-step process to get rid of your junk</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-2 border-transparent hover:border-gray-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">1</div>
                <h3 className="text-xl font-semibold mb-2">We Drop Off</h3>
                <p className="text-gray-600">We deliver our dump trailer right to your driveway at your scheduled time.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-gray-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">2</div>
                <h3 className="text-xl font-semibold mb-2">You Fill It</h3>
                <p className="text-gray-600">Load it up at your own pace with junk, furniture, yard waste, or debris.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-gray-300 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">3</div>
                <h3 className="text-xl font-semibold mb-2">We Haul Away</h3>
                <p className="text-gray-600">We come back, pick up the trailer, and take everything to the dump.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Price Calculator - MOVED UP */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Price Calculator</h2>
            <p className="text-gray-600 text-lg">Customize your rental and see your exact price instantly</p>
          </div>
          
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardContent className="p-6 md:p-8">
              {/* Calculator Options */}
              <div className="space-y-6 mb-6">
                {/* Address Input for Distance */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    <MapPin className="inline h-4 w-4 mr-1" /> Your Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your address (e.g., 123 Main St, Spokane)"
                      value={customerAddress}
                      onChange={(e) => {
                        setCustomerAddress(e.target.value);
                        setDistanceResult(null);
                        setAddressError('');
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={checkDistance} 
                      disabled={checkingDistance}
                      variant="outline"
                    >
                      {checkingDistance ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                    </Button>
                  </div>
                  <button
                    onClick={useMyLocation}
                    className="text-sm text-gray-600 hover:text-gray-900 mt-2 flex items-center"
                    disabled={checkingDistance}
                  >
                    <Navigation className="h-3 w-3 mr-1" /> Use my current location
                  </button>
                  
                  {addressError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> {addressError}
                    </p>
                  )}
                  
                  {/* Distance Result */}
                  {distanceResult && (
                    <div className={`mt-3 p-3 rounded-lg ${distanceResult.canServe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {distanceResult.canServe ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              {distanceResult.miles} miles away
                            </p>
                            <p className="text-sm text-green-600">
                              {distanceResult.tier === 'standard' && 'Standard service area - $50 delivery'}
                              {distanceResult.tier === 'extended' && 'Extended area - $75 delivery (+$25)'}
                              {distanceResult.tier === 'far' && 'Far distance - $100 delivery (+$50)'}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-green-700">${distanceResult.fee}</span>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-red-800">
                            <AlertCircle className="inline h-4 w-4 mr-1" />
                            {distanceResult.miles} miles - Outside Service Area
                          </p>
                          <p className="text-sm text-red-600 mt-1">
                            We typically serve within 50 miles. Please call us to discuss your project.
                          </p>
                          <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center mt-2 text-red-800 font-medium hover:text-red-900">
                            <Phone className="h-4 w-4 mr-1" /> Call {PHONE_NUMBER}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Duration */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      <Clock className="inline h-4 w-4 mr-1" /> Rental Duration
                    </Label>
                    <Select value={calcDuration} onValueChange={setCalcDuration}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Hours (Standard)</SelectItem>
                        <SelectItem value="3">3 Hours (+${pricing?.extraHourFee || 35})</SelectItem>
                        <SelectItem value="4">4 Hours (+${(pricing?.extraHourFee || 35) * 2})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Load Type */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      <Package className="inline h-4 w-4 mr-1" /> Type of Load
                    </Label>
                    <Select value={calcLoadType} onValueChange={setCalcLoadType}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
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
              </div>
              
              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Trailer Rental (2 hrs base)</span>
                    <span>${calcPricing.base}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery & Pickup {distanceResult && `(${distanceResult.miles} mi)`}</span>
                    <span>${calcPricing.delivery}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Dump Fee</span>
                    <span>${calcPricing.dump}</span>
                  </div>
                  {calcPricing.extraHours > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Extra Time (+{calcPricing.extraHours} hr{calcPricing.extraHours > 1 ? 's' : ''})</span>
                      <span>+${calcPricing.extraHoursCost}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-xl font-bold text-gray-900">Your Total</span>
                    <span className="text-3xl font-bold text-green-600">${calcPricing.total}</span>
                  </div>
                </div>
              </div>
              
              {/* Book Now Button */}
              {(!distanceResult || distanceResult.canServe) ? (
                <Button 
                  onClick={handleBookFromCalculator}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg py-6"
                  size="lg"
                >
                  Book Now for ${calcPricing.total} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <a href={`tel:${PHONE_NUMBER}`}>
                  <Button 
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg py-6"
                    size="lg"
                  >
                    <Phone className="mr-2 h-5 w-5" /> Call Us to Discuss
                  </Button>
                </a>
              )}
              
              <p className="text-center text-sm text-gray-500 mt-4">
                {(!distanceResult || distanceResult.canServe) 
                  ? "No payment required now. We'll confirm your booking first."
                  : "We may still be able to serve you - let's discuss your project!"}
              </p>
            </CardContent>
          </Card>
          
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-2">Need something different?</p>
            <Link href="/contact" className="text-gray-900 hover:text-gray-700 font-medium underline">
              Contact us for a custom quote →
            </Link>
          </div>
        </div>
      </section>

      {/* NEW: Comparison Section - Save Money vs Full-Service Junk Removal */}
      <section className="py-8 md:py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Save Money vs Full-Service Junk Removal</h2>
            <p className="text-gray-300 text-lg">Why pay more when you can do it yourself and save hundreds?</p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            {/* Comparison Table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-2">
                {/* Header */}
                <div className="bg-gray-100 p-4 md:p-6 border-b border-r">
                  <h3 className="font-bold text-gray-900 text-lg md:text-xl">Service</h3>
                </div>
                <div className="bg-gray-100 p-4 md:p-6 border-b">
                  <h3 className="font-bold text-gray-900 text-lg md:text-xl">Average Price</h3>
                </div>
                
                {/* Full Junk Removal Row */}
                <div className="p-4 md:p-6 border-b border-r flex items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Full-Service Junk Removal</p>
                    <p className="text-sm text-gray-500">They load it for you</p>
                  </div>
                </div>
                <div className="p-4 md:p-6 border-b flex items-center">
                  <span className="text-2xl md:text-3xl font-bold text-red-600">$450 – $700</span>
                </div>
                
                {/* Dump Trailer Row */}
                <div className="p-4 md:p-6 border-r flex items-center bg-green-50">
                  <div>
                    <p className="font-semibold text-gray-900">Dump Trailer Rental</p>
                    <p className="text-sm text-gray-500">You load, we haul</p>
                  </div>
                </div>
                <div className="p-4 md:p-6 flex items-center bg-green-50">
                  <span className="text-2xl md:text-3xl font-bold text-green-600">${totalEstimate} – $350</span>
                </div>
              </div>
              
              {/* Savings Banner */}
              <div className="bg-green-600 p-6 text-center">
                <p className="text-white text-xl md:text-2xl font-bold">
                  💰 Save $200 – $400 on your cleanout!
                </p>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="mt-10 text-center">
              <div className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-lg">Same result</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-lg">Half the price</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-lg">Your pace</span>
                </div>
              </div>
              
              <div className="mt-8">
                <Link href="/book">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6">
                    Start Saving Today <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image Section - The Trailer */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Professional Dump Trailer Rental
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Skip the hassle of multiple trips to the dump. Our dump trailer service gives you the flexibility to load at your own pace while we handle all the heavy lifting and disposal.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'No need to rent a truck or make trips',
                  'Load at your own pace during rental period',
                  'We handle all disposal and dump fees',
                  'Perfect for home cleanouts & renovations'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/book">
                <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
                  Get Started Today <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative h-80 md:h-[450px] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/8qzjl5qc_14Ft_Dump_Trailer.jpg" 
                alt="Our dump trailer ready for delivery"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Show the work */}
      <section className="py-8 md:py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">See Our Work</h2>
          <p className="text-center text-gray-600 mb-6">Real jobs. Real results. We handle it all.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative h-64 rounded-xl overflow-hidden group shadow-lg">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/7qbljwnk_trash-hoard.webp" 
                alt="Trailer loaded with household junk"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-semibold">Household Cleanout</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group shadow-lg">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/pqljudvy_dump%20trailer3.webp" 
                alt="Dump trailer with wood sides"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-semibold">Ready for Your Load</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group shadow-lg">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/fyw8ooan_images.jfif" 
                alt="Dump trailer in action"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-semibold">Dump & Disposal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Haul */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">What We Haul</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Household Junk', desc: 'Old furniture, appliances, boxes, and general clutter' },
              { title: 'Furniture', desc: 'Couches, beds, tables, chairs, mattresses' },
              { title: 'Yard Waste', desc: 'Branches, leaves, grass clippings, brush' },
              { title: 'Construction Debris', desc: 'Wood, drywall, flooring, renovation waste' },
              { title: 'Garage Cleanouts', desc: 'Tools, storage items, old equipment' },
              { title: 'Mixed Loads', desc: 'Combination of different materials' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Width Image Banner */}
      <section className="relative h-80 md:h-[400px]">
        <img 
          src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/rgi80q43_labor-for-hire-near-me.webp" 
          alt="Loaded dump trailer with truck"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Big Loads? No Problem.</h2>
            <p className="text-xl text-gray-300 mb-6">Our trailer can handle up to 10-12 cubic yards of material</p>
            <Link href="/book">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Book Your Trailer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials / Trust Section */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">Why Customers Choose Us</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stars: 5, text: "So much easier than renting a truck and making multiple dump trips. Highly recommend!", name: "Mike R." },
              { stars: 5, text: "Great service! They were on time, professional, and the pricing was exactly as quoted.", name: "Sarah T." },
              { stars: 5, text: "Perfect for our garage cleanout. Loaded at our own pace and they handled everything else.", name: "David L." }
            ].map((review, idx) => (
              <Card key={idx} className="p-6">
                <CardContent className="pt-4">
                  <div className="flex mb-3">
                    {[...Array(review.stars)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{review.text}"</p>
                  <p className="font-semibold text-gray-900">— {review.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Service Area</h2>
          <p className="text-xl text-gray-600 mb-6">
            Proudly serving <span className="font-semibold text-gray-900">Spokane, WA</span> and surrounding communities within a 30-mile radius.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Spokane Valley', 'Liberty Lake', 'Cheney', 'Medical Lake', 'Airway Heights', 'Mead', 'Nine Mile Falls', 'Millwood'].map((area) => (
              <span key={area} className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 shadow-sm">{area}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 md:py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Rid of Your Junk?</h2>
          <p className="text-xl text-gray-300 mb-6">Book your dump trailer today and we'll handle the rest.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6">
                Book Online Now
              </Button>
            </Link>
            <a href="tel:+15098633109">
              <Button size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                <Phone className="mr-2 h-5 w-5" /> Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Image 
                  src="/logo.png" 
                  alt="Easy Load & Dump" 
                  width={150} 
                  height={50} 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-400 text-sm">Professional dump trailer rental and junk removal services in Spokane, WA.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/how-it-works" className="block text-gray-400 hover:text-white">How It Works</Link>
                <Link href="/pricing" className="block text-gray-400 hover:text-white">Pricing</Link>
                <Link href="/book" className="block text-gray-400 hover:text-white">Book Now</Link>
                <Link href="/faq" className="block text-gray-400 hover:text-white">FAQ</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /><span>(509) 863-3109</span></p>
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /><span>info@ezloadndump.com</span></p>
                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" /><span>Spokane, WA</span></p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <div className="text-gray-400 text-sm">
                <p>Monday - Friday: 7am - 6pm</p>
                <p>Saturday: 8am - 4pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
