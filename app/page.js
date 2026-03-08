'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, Trash2, Clock, MapPin, Phone, Mail, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => setPricing(data))
      .catch(err => console.error('Error fetching pricing:', err));
  }, []);

  const totalEstimate = pricing ? pricing.baseRentalFee + pricing.deliveryFee + pricing.dumpFee : 275;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-orange-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-orange-500 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-orange-500 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-orange-500 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-500 font-medium">Contact</Link>
              <Link href="/book">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Book Now</Button>
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
              <Link href="/" className="block text-gray-700 hover:text-orange-500 font-medium py-2">Home</Link>
              <Link href="/how-it-works" className="block text-gray-700 hover:text-orange-500 font-medium py-2">How It Works</Link>
              <Link href="/pricing" className="block text-gray-700 hover:text-orange-500 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-700 hover:text-orange-500 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-orange-500 font-medium py-2">Contact</Link>
              <Link href="/book" className="block">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Dump Trailer Rental<br />Made Simple
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-orange-100 max-w-3xl mx-auto">
              We drop it off. You fill it up. We haul it away.<br />
              Junk removal has never been this easy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button size="lg" className="w-full sm:w-auto bg-white text-orange-500 hover:bg-gray-100 text-lg px-8 py-6">
                  Book Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-orange-100">
              <MapPin className="inline h-5 w-5 mr-1" /> Serving Spokane, WA & surrounding areas (30 mile radius)
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Simple 3-step process to get rid of your junk</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-2 border-transparent hover:border-orange-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-orange-500 mb-2">1</div>
                <h3 className="text-xl font-semibold mb-2">We Drop Off</h3>
                <p className="text-gray-600">We deliver our dump trailer right to your driveway at your scheduled time.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-orange-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-orange-500 mb-2">2</div>
                <h3 className="text-xl font-semibold mb-2">You Fill It</h3>
                <p className="text-gray-600">Load it up at your own pace with junk, furniture, yard waste, or debris.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-orange-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-orange-500 mb-2">3</div>
                <h3 className="text-xl font-semibold mb-2">We Haul Away</h3>
                <p className="text-gray-600">We come back, pick up the trailer, and take everything to the dump.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Haul */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">What We Haul</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Household Junk', desc: 'Old furniture, appliances, boxes, and general clutter' },
              { title: 'Furniture', desc: 'Couches, beds, tables, chairs, mattresses' },
              { title: 'Yard Waste', desc: 'Branches, leaves, grass clippings, brush' },
              { title: 'Construction Debris', desc: 'Wood, drywall, flooring, renovation waste' },
              { title: 'Garage Cleanouts', desc: 'Tools, storage items, old equipment' },
              { title: 'Mixed Loads', desc: 'Combination of different materials' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start p-4 bg-gray-50 rounded-lg">
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

      {/* Pricing Preview */}
      <section className="py-16 md:py-24 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-lg">No hidden fees. Know what you're paying upfront.</p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-orange-500">${totalEstimate}</div>
                <p className="text-gray-600 mt-2">Starting price (2-hour rental)</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Trailer Rental (2 hrs)</span>
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
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-orange-500">${totalEstimate}</span>
                </div>
              </div>
              
              <Link href="/book">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" size="lg">
                  Book Now
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <p className="text-center mt-6 text-gray-600">
            <Link href="/pricing" className="text-orange-500 hover:text-orange-600 font-medium">
              View full pricing details →
            </Link>
          </p>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Service Area</h2>
          <p className="text-xl text-gray-600 mb-8">
            Proudly serving <span className="font-semibold text-orange-500">Spokane, WA</span> and surrounding communities within a 30-mile radius.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Spokane Valley', 'Liberty Lake', 'Cheney', 'Medical Lake', 'Airway Heights', 'Mead', 'Nine Mile Falls', 'Millwood'].map((area) => (
              <span key={area} className="px-4 py-2 bg-gray-100 rounded-full text-gray-700">{area}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Rid of Your Junk?</h2>
          <p className="text-xl text-gray-300 mb-8">Book your dump trailer today and we'll handle the rest.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6">
                Book Online Now
              </Button>
            </Link>
            <a href="tel:+15091234567">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                <Phone className="mr-2 h-5 w-5" /> Call Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Truck className="h-6 w-6 text-orange-500" />
                <span className="ml-2 font-bold text-gray-900">Easy Load & Dump</span>
              </div>
              <p className="text-gray-600 text-sm">Professional dump trailer rental and junk removal services in Spokane, WA.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/how-it-works" className="block text-gray-600 hover:text-orange-500">How It Works</Link>
                <Link href="/pricing" className="block text-gray-600 hover:text-orange-500">Pricing</Link>
                <Link href="/book" className="block text-gray-600 hover:text-orange-500">Book Now</Link>
                <Link href="/faq" className="block text-gray-600 hover:text-orange-500">FAQ</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> (509) 123-4567</p>
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /> info@ezloadndump.com</p>
                <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Spokane, WA</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Hours</h4>
              <div className="text-gray-600 text-sm">
                <p>Monday - Friday: 7am - 6pm</p>
                <p>Saturday: 8am - 4pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
