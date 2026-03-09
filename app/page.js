'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Package, Trash2, Clock, MapPin, Phone, Mail, CheckCircle, ArrowRight, Menu, X, Star } from 'lucide-react';

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
              <Truck className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Easy Load & Dump</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-blue-600 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
              <Link href="/book">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Book Now</Button>
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
              <Link href="/" className="block text-gray-700 hover:text-blue-600 font-medium py-2">Home</Link>
              <Link href="/how-it-works" className="block text-gray-700 hover:text-blue-600 font-medium py-2">How It Works</Link>
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/rgi80q43_labor-for-hire-near-me.webp" 
            alt="Dump trailer loaded with debris"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Dump Trailer Rental<br />Made Simple
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              We drop it off. You fill it up. We haul it away.<br />
              Junk removal has never been this easy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                  Book Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-blue-100">
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
            <Card className="text-center p-6 border-2 border-transparent hover:border-blue-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">1</div>
                <h3 className="text-xl font-semibold mb-2">We Drop Off</h3>
                <p className="text-gray-600">We deliver our dump trailer right to your driveway at your scheduled time.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-blue-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">2</div>
                <h3 className="text-xl font-semibold mb-2">You Fill It</h3>
                <p className="text-gray-600">Load it up at your own pace with junk, furniture, yard waste, or debris.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 border-transparent hover:border-blue-200 transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-2">3</div>
                <h3 className="text-xl font-semibold mb-2">We Haul Away</h3>
                <p className="text-gray-600">We come back, pick up the trailer, and take everything to the dump.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Image Section - The Trailer */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Professional Dump Trailer Rental
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Skip the hassle of multiple trips to the dump. Our dump trailer service gives you the flexibility to load at your own pace while we handle all the heavy lifting and disposal.
              </p>
              <ul className="space-y-3 mb-8">
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
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
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
      <section className="py-16 md:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">See Our Work</h2>
          <p className="text-center text-gray-300 mb-12">Real jobs. Real results. We handle it all.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="relative h-64 rounded-xl overflow-hidden group">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/7qbljwnk_trash-hoard.webp" 
                alt="Trailer loaded with household junk"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-semibold">Household Cleanout</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group">
              <img 
                src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/pqljudvy_dump%20trailer3.webp" 
                alt="Dump trailer with wood sides"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <span className="text-white font-semibold">Ready for Your Load</span>
              </div>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden group">
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
        <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Big Loads? No Problem.</h2>
            <p className="text-xl text-blue-100 mb-6">Our trailer can handle up to 10-12 cubic yards of material</p>
            <Link href="/book">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Book Your Trailer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 text-lg">No hidden fees. Know what you're paying upfront.</p>
          </div>
          
          <Card className="max-w-md mx-auto shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600">${totalEstimate}</div>
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
                  <span className="text-blue-600">${totalEstimate}</span>
                </div>
              </div>
              
              <Link href="/book">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  Book Now
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <p className="text-center mt-6 text-gray-600">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
              View full pricing details →
            </Link>
          </p>
        </div>
      </section>

      {/* Testimonials / Trust Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Why Customers Choose Us</h2>
          
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
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Service Area</h2>
          <p className="text-xl text-gray-600 mb-8">
            Proudly serving <span className="font-semibold text-blue-600">Spokane, WA</span> and surrounding communities within a 30-mile radius.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Spokane Valley', 'Liberty Lake', 'Cheney', 'Medical Lake', 'Airway Heights', 'Mead', 'Nine Mile Falls', 'Millwood'].map((area) => (
              <span key={area} className="px-4 py-2 bg-white rounded-full text-gray-700 shadow-sm">{area}</span>
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
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
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
                <Truck className="h-6 w-6 text-blue-600" />
                <span className="ml-2 font-bold text-gray-900">Easy Load & Dump</span>
              </div>
              <p className="text-gray-600 text-sm">Professional dump trailer rental and junk removal services in Spokane, WA.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/how-it-works" className="block text-gray-600 hover:text-blue-600">How It Works</Link>
                <Link href="/pricing" className="block text-gray-600 hover:text-blue-600">Pricing</Link>
                <Link href="/book" className="block text-gray-600 hover:text-blue-600">Book Now</Link>
                <Link href="/faq" className="block text-gray-600 hover:text-blue-600">FAQ</Link>
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
