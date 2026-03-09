'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Phone, Mail, MapPin, Clock, Menu, X } from 'lucide-react';

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-900 font-medium">Contact</Link>
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
              <Link href="/pricing" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-700 hover:text-gray-900 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-900 font-medium py-2">Contact</Link>
              <Link href="/book" className="block">
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero with Image */}
      <section className="relative bg-black text-white py-16 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1604501997347-025aeb7d4479?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHxqdW5rJTIwcmVtb3ZhbHxlbnwwfHx8YmxhY2t8MTc3MzAxOTkxM3ww&ixlib=rb-4.1.0&q=85" 
            alt="Professional service"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">We're here to help with your junk removal needs</p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Phone</h3>
                <a href="tel:+15098633109" className="text-gray-900 hover:text-gray-700 text-lg font-medium">
                  (509) 863-3109
                </a>
                <p className="text-gray-600 text-sm mt-2">Call or text anytime</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Email</h3>
                <a href="mailto:info@ezloadndump.com" className="text-gray-900 hover:text-gray-700 font-medium">
                  info@ezloadndump.com
                </a>
                <p className="text-gray-600 text-sm mt-2">We respond within 24 hours</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Service Area</h3>
                <p className="text-gray-700 font-medium">Spokane, WA</p>
                <p className="text-gray-600 text-sm mt-2">30-mile service radius</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Hours</h3>
                <p className="text-gray-700">Mon-Fri: 7am - 6pm</p>
                <p className="text-gray-700">Saturday: 8am - 4pm</p>
                <p className="text-gray-600 text-sm">Sunday: Closed</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Banner Section */}
      <section className="relative h-64 md:h-80">
        <img 
          src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/rgi80q43_labor-for-hire-near-me.webp" 
          alt="Our dump trailer service in action"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Professional Service You Can Trust</h2>
            <p className="text-gray-300">We take pride in serving the Spokane community</p>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Areas We Serve</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            We proudly serve Spokane and surrounding communities within a 30-mile radius. Contact us if you're outside our standard service area — we may still be able to help!
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Spokane',
              'Spokane Valley',
              'Liberty Lake',
              'Cheney',
              'Medical Lake',
              'Airway Heights',
              'Mead',
              'Nine Mile Falls',
              'Millwood',
              'Veradale',
              'Otis Orchards',
              'Newman Lake'
            ].map((area) => (
              <span key={area} className="px-4 py-2 bg-white rounded-full text-gray-700 shadow-sm border hover:shadow-md transition-shadow">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-xl text-gray-300 mb-8">Skip the call — book online in just a few minutes!</p>
          <Link href="/book">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-6">
              Book Online Now
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
