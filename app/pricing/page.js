'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Truck, CheckCircle, AlertTriangle, Menu, X, Calculator, MapPin, Clock, Package, ArrowRight, Loader2, AlertCircle, Navigation } from 'lucide-react';

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

export default function PricingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricing, setPricing] = useState(null);
  
  // Calculator state
  const [calcDuration, setCalcDuration] = useState('2');
  const [calcLoadType, setCalcLoadType] = useState('household');
  
  // Address/distance state
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [distanceResult, setDistanceResult] = useState(null);
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  const baseTotal = pricing ? pricing.baseRentalFee + 50 + pricing.dumpFee : 214;

  // Clean and normalize address for better geocoding
  const cleanAddress = (address) => {
    return address
      .replace(/\n/g, ', ')
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/^\s*,\s*/, '')
      .replace(/\s*,\s*$/, '')
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
      let cleanedAddress = cleanAddress(customerAddress);
      cleanedAddress = cleanedAddress
        .replace(/\+/g, ' ')
        .replace(/@[\d.-]+,[\d.-]+/g, '')
        .trim();
      
      let data = null;
      let searchAddress = cleanedAddress;
      if (!cleanedAddress.toLowerCase().includes('wa') && !cleanedAddress.toLowerCase().includes('washington')) {
        searchAddress = cleanedAddress + ', WA';
      }
      if (!cleanedAddress.toLowerCase().includes('usa')) {
        searchAddress = searchAddress + ', USA';
      }
      
      const encodedAddress = encodeURIComponent(searchAddress);
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`,
        { headers: { 'User-Agent': 'EasyLoadAndDump/1.0' } }
      );
      data = await response.json();
      
      if (!data || data.length === 0) {
        const parts = cleanedAddress.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const cityState = parts.slice(-2).join(', ') + ', USA';
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityState)}&limit=1&countrycodes=us`,
            { headers: { 'User-Agent': 'EasyLoadAndDump/1.0' } }
          );
          data = await response.json();
        }
      }
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const miles = calculateDistance(OFFICE_LAT, OFFICE_LNG, parseFloat(lat), parseFloat(lon));
        
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

  // Calculate price based on selections
  const calculatePrice = () => {
    if (!pricing) return { base: 99, delivery: 50, dump: 65, extra: 0, total: 214 };
    
    const base = pricing.baseRentalFee || 99;
    const dump = pricing.dumpFee || 65;
    const extraHourFee = pricing.extraHourFee || 35;
    const delivery = distanceResult?.fee || 50;
    const extraHours = Math.max(0, parseInt(calcDuration) - 2);
    const extraHoursCost = extraHours * extraHourFee;
    const total = base + delivery + dump + extraHoursCost;
    
    return { base, delivery, dump, extraHours, extraHoursCost, total };
  };
  
  const calcPricing = calculatePrice();
  
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
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-900 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
              <Link href="/book">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">Book Now</Button>
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Home</Link>
              <Link href="/how-it-works" className="block text-gray-700 hover:text-gray-900 font-medium py-2">How It Works</Link>
              <Link href="/pricing" className="block text-gray-900 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-700 hover:text-gray-900 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Contact</Link>
              <Link href="/book" className="block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative bg-black text-white py-12 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/8qzjl5qc_14Ft_Dump_Trailer.jpg" 
            alt="Dump trailer"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300">No hidden fees. Know exactly what you're paying.</p>
        </div>
      </section>

      {/* Interactive Price Calculator */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-full mb-3">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Price Calculator</h2>
            <p className="text-gray-600">Enter your address to see your exact price</p>
          </div>
          
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardContent className="p-5 md:p-6">
              {/* Address Input */}
              <div className="mb-6">
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
                  <Button onClick={checkDistance} disabled={checkingDistance} variant="outline">
                    {checkingDistance ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                  </Button>
                </div>
                
                {addressError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> {addressError}
                  </p>
                )}
                
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
                          We typically serve within 50 miles. Please call us to discuss.
                        </p>
                        <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center mt-2 text-red-800 font-medium">
                          Call {PHONE_NUMBER}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    <Clock className="inline h-4 w-4 mr-1" /> Rental Duration
                  </Label>
                  <Select value={calcDuration} onValueChange={setCalcDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Hours (Standard)</SelectItem>
                      <SelectItem value="3">3 Hours (+${pricing?.extraHourFee || 35})</SelectItem>
                      <SelectItem value="4">4 Hours (+${(pricing?.extraHourFee || 35) * 2})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    <Package className="inline h-4 w-4 mr-1" /> Type of Load
                  </Label>
                  <Select value={calcLoadType} onValueChange={setCalcLoadType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              
              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-xl p-5 mb-5">
                <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
                <div className="space-y-2">
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
                    <span className="text-lg font-bold text-gray-900">Your Total</span>
                    <span className="text-2xl font-bold text-green-600">${calcPricing.total}</span>
                  </div>
                </div>
              </div>
              
              {(!distanceResult || distanceResult.canServe) ? (
                <Button onClick={handleBookFromCalculator} className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg py-5" size="lg">
                  Book Now for ${calcPricing.total} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <a href={`tel:${PHONE_NUMBER}`}>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-lg py-5" size="lg">
                    Call Us to Discuss
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Distance Pricing Tiers */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Delivery Fee by Distance</h2>
          
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Card className="border-green-200">
              <CardContent className="p-5 text-center">
                <h3 className="font-semibold text-lg mb-1">0-20 Miles</h3>
                <p className="text-3xl font-bold text-green-600">$50</p>
                <p className="text-gray-600 text-sm mt-1">Standard delivery</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardContent className="p-5 text-center">
                <h3 className="font-semibold text-lg mb-1">20-30 Miles</h3>
                <p className="text-3xl font-bold text-yellow-600">$75</p>
                <p className="text-gray-600 text-sm mt-1">+$25 extended area</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="p-5 text-center">
                <h3 className="font-semibold text-lg mb-1">30-50 Miles</h3>
                <p className="text-3xl font-bold text-orange-600">$100</p>
                <p className="text-gray-600 text-sm mt-1">+$50 far distance</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">Over 50 miles? Call us at {PHONE_NUMBER} to discuss.</p>
        </div>
      </section>

      {/* Additional Fees */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Additional Fees</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-1">Extra Time</h3>
                <p className="text-2xl font-bold text-gray-900">${pricing?.extraHourFee || 35}<span className="text-sm text-gray-500">/hour</span></p>
                <p className="text-gray-600 text-sm mt-1">Need more time? No problem!</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-1">Overweight Load</h3>
                <p className="text-2xl font-bold text-gray-900">${pricing?.overweightFee || 50}+</p>
                <p className="text-gray-600 text-sm mt-1">If load exceeds weight limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-1">Special Items</h3>
                <p className="text-2xl font-bold text-gray-900">Varies</p>
                <p className="text-gray-600 text-sm mt-1">Contact us for pricing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Allowed */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">What Can You Load?</h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-green-700 text-lg">
                  <CheckCircle className="h-5 w-5 mr-2" /> Allowed Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {['Household junk & clutter', 'Furniture (couches, beds, tables)', 'Appliances (non-freon)', 'Yard waste & brush', 'Construction debris', 'Wood, drywall, flooring', 'Cardboard & boxes', 'General trash'].map((item) => (
                    <li key={item} className="flex items-center text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-red-700 text-lg">
                  <AlertTriangle className="h-5 w-5 mr-2" /> Prohibited Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {['Hazardous materials', 'Chemicals & paint', 'Tires', 'Batteries', 'Appliances with freon', 'Medical waste', 'Asbestos materials', 'Flammable liquids'].map((item) => (
                    <li key={item} className="flex items-center text-gray-700">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Clear Out Your Space?</h2>
          <p className="text-lg text-gray-300 mb-6">Book your dump trailer today!</p>
          <Link href="/book">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-5">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          <p className="mt-1">Serving Spokane, WA & surrounding areas</p>
        </div>
      </footer>
    </div>
  );
}
