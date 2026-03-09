'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, CheckCircle, AlertTriangle, Menu, X } from 'lucide-react';

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  const baseTotal = pricing ? pricing.baseRentalFee + pricing.deliveryFee + pricing.dumpFee : 275;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Truck className="h-8 w-8 text-gray-900" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
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
      <section className="relative bg-black text-white py-16 overflow-hidden">
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

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Package */}
            <Card className="border-2 border-gray-900">
              <CardHeader className="bg-gray-900 text-white">
                <CardTitle className="text-center">
                  <span className="text-lg">Standard Package</span>
                  <div className="text-4xl font-bold mt-2">${baseTotal}</div>
                  <span className="text-sm font-normal">2-hour rental</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Trailer Rental (2 hours) - ${pricing?.baseRentalFee || 150}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Delivery & Pickup - ${pricing?.deliveryFee || 50}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Dump/Disposal Fee - ${pricing?.dumpFee || 75}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Standard weight allowance</span>
                  </li>
                </ul>
                <Link href="/book">
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" size="lg">Book Now</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Extended Package */}
            <Card>
              <CardHeader className="bg-gray-700 text-white">
                <CardTitle className="text-center">
                  <span className="text-lg">Extended Package</span>
                  <div className="text-4xl font-bold mt-2">${baseTotal + (pricing?.extraHourFee || 35) * 2}</div>
                  <span className="text-sm font-normal">4-hour rental</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Everything in Standard</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>+2 Extra Hours - ${(pricing?.extraHourFee || 35) * 2}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Perfect for larger cleanouts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>More time to load at your pace</span>
                  </li>
                </ul>
                <Link href="/book">
                  <Button className="w-full" size="lg" variant="outline">Book Now</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Fees */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Additional Fees</h2>
          <p className="text-center text-gray-600 mb-8">These fees may apply depending on your specific situation</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Extra Time</h3>
                <p className="text-3xl font-bold text-gray-900">${pricing?.extraHourFee || 35}<span className="text-sm text-gray-500">/hour</span></p>
                <p className="text-gray-600 text-sm mt-2">Need more time? No problem!</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Overweight Load</h3>
                <p className="text-3xl font-bold text-gray-900">${pricing?.overweightFee || 50}+</p>
                <p className="text-gray-600 text-sm mt-2">If load exceeds weight limit</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Extended Distance</h3>
                <p className="text-3xl font-bold text-gray-900">${pricing?.travelFee || 25}+</p>
                <p className="text-gray-600 text-sm mt-2">Outside 30-mile service area</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Allowed */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">What Can You Load?</h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <CheckCircle className="h-6 w-6 mr-2" /> Allowed Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
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
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertTriangle className="h-6 w-6 mr-2" /> Prohibited Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
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
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Clear Out Your Space?</h2>
          <p className="text-xl text-gray-300 mb-8">Book your dump trailer today!</p>
          <Link href="/book">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          <p className="mt-2">Serving Spokane, WA & surrounding areas</p>
        </div>
      </footer>
    </div>
  );
}
