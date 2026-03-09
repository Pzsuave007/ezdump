'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const serviceAreas = [
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
];

export default function Footer() {
  return (
    <>
      {/* Areas We Serve Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Image 
              src="/logo.png" 
              alt="Easy Load & Dump" 
              width={450} 
              height={150} 
              className="h-32 md:h-40 lg:h-48 w-auto mx-auto"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Areas We Serve</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We proudly serve Spokane and surrounding communities within a 30-mile radius. Contact us if you're outside our standard service area — we may still be able to help!
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {serviceAreas.map((area) => (
              <span key={area} className="px-4 py-2 bg-white rounded-full text-gray-700 shadow-sm border hover:shadow-md transition-shadow">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="mb-6">
                <Image 
                  src="/logo.png" 
                  alt="Easy Load & Dump" 
                  width={280} 
                  height={90} 
                  className="h-24 w-auto"
                />
              </div>
              <p className="text-gray-400 text-sm">Professional dump trailer rental and junk removal services in Spokane, WA.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/book" className="hover:text-white">Book Now</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center"><Phone className="h-4 w-4 mr-2" /><a href="tel:+15098633109" className="hover:text-white">(509) 863-3109</a></li>
                <li className="flex items-center"><Mail className="h-4 w-4 mr-2" /><a href="mailto:info@ezloadndump.com" className="hover:text-white">info@ezloadndump.com</a></li>
                <li className="flex items-center"><MapPin className="h-4 w-4 mr-2" /><span>Spokane, WA</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center"><Clock className="h-4 w-4 mr-2" /><span>Monday - Friday: 7am - 6pm</span></li>
                <li className="pl-6">Saturday: 8am - 4pm</li>
                <li className="pl-6">Sunday: Closed</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Easy Load & Dump. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
