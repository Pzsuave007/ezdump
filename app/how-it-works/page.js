'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, Trash2, Calendar, Clock, CheckCircle, Menu, X } from 'lucide-react';

export default function HowItWorksPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-blue-600 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
              <Link href="/book">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
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
              <Link href="/" className="block text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
              <Link href="/how-it-works" className="block text-blue-600 font-medium py-2">How It Works</Link>
              <Link href="/pricing" className="block text-gray-700 hover:text-blue-600 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-700 hover:text-blue-600 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-blue-600 font-medium py-2">Contact</Link>
              <Link href="/book" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
          <p className="text-xl text-blue-100">Simple 4-step process to get rid of your junk</p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="h-16 w-16 text-blue-600" />
            </div>
            <div className="text-center md:text-left">
              <div className="text-6xl font-bold text-blue-200 mb-2">01</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Trailer</h2>
              <p className="text-gray-600 text-lg">
                Use our simple online booking form to schedule your dump trailer rental. Choose your preferred date, time, and rental duration. We'll confirm your booking and answer any questions.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-16">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Truck className="h-16 w-16 text-blue-600" />
            </div>
            <div className="text-center md:text-right">
              <div className="text-6xl font-bold text-blue-200 mb-2">02</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">We Drop It Off</h2>
              <p className="text-gray-600 text-lg">
                On your scheduled day, we'll deliver the dump trailer right to your driveway or location. We'll position it for easy loading and make sure you're all set to go.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="h-16 w-16 text-blue-600" />
            </div>
            <div className="text-center md:text-left">
              <div className="text-6xl font-bold text-blue-200 mb-2">03</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You Fill It Up</h2>
              <p className="text-gray-600 text-lg">
                Take your time loading the trailer with your junk, furniture, yard waste, or debris. You have the full rental period to fill it at your own pace. No rushing!
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-16 w-16 text-blue-600" />
            </div>
            <div className="text-center md:text-right">
              <div className="text-6xl font-bold text-blue-200 mb-2">04</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">We Haul It Away</h2>
              <p className="text-gray-600 text-lg">
                Once your rental time is up, we come back, hook up the trailer, and take everything to the dump. You don't have to lift another finger — we handle it all!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Us?</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Save Time', desc: 'No trips to the dump. We handle everything.' },
              { icon: Truck, title: 'Convenient', desc: 'Trailer delivered right to your door.' },
              { icon: CheckCircle, title: 'Flexible', desc: 'Load at your own pace during rental.' },
              { icon: Package, title: 'Big Capacity', desc: 'Haul more in one trip than your truck.' },
            ].map((item, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 text-center">
                  <item.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Book your dump trailer today and we'll handle the rest!</p>
          <Link href="/book">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          <p className="mt-2">Serving Spokane, WA & surrounding areas</p>
        </div>
      </footer>
    </div>
  );
}
