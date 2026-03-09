'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Truck, Menu, X } from 'lucide-react';

export default function FAQPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const faqs = [
    {
      question: 'How does the dump trailer rental work?',
      answer: "It's simple! You book online, we deliver the trailer to your location, you load it up with your junk during the rental period, and then we come back to pick it up and haul everything to the dump. You don't have to go anywhere!"
    },
    {
      question: 'What size is the dump trailer?',
      answer: 'Our dump trailer can hold approximately 10-12 cubic yards of material, which is equivalent to about 4-6 pickup truck loads. It\'s perfect for most residential cleanouts, yard projects, and renovation debris.'
    },
    {
      question: 'How long is the rental period?',
      answer: 'Standard rentals are 2 hours, but you can extend to 3 or 4 hours for an additional fee. This gives you plenty of time to load at your own pace without rushing.'
    },
    {
      question: 'What can I put in the trailer?',
      answer: 'You can load household junk, furniture, appliances (without freon), yard waste, construction debris, wood, drywall, and general trash. See our prohibited items list for what cannot be loaded.'
    },
    {
      question: 'What items are NOT allowed?',
      answer: 'Prohibited items include: hazardous materials, chemicals, paint, tires, batteries, appliances with freon (like refrigerators and AC units), medical waste, asbestos, and flammable liquids. If you\'re unsure about an item, just ask!'
    },
    {
      question: 'What is your service area?',
      answer: 'We serve Spokane, WA and surrounding communities within a 30-mile radius. This includes Spokane Valley, Liberty Lake, Cheney, Medical Lake, Airway Heights, Mead, Nine Mile Falls, and Millwood. Contact us if you\'re outside this area.'
    },
    {
      question: 'How much does it cost?',
      answer: 'Our standard 2-hour rental starts at $214 (within 20 miles), which includes $99 trailer rental, $50 delivery/pickup, and $65 dump fees. Delivery fees vary by distance ($50 for 0-20 mi, $75 for 20-30 mi, $100 for 30-50 mi). Extra hours are $35/hour. Visit our pricing page for full details and to calculate your exact price.'
    },
    {
      question: 'Do I need to be home during delivery and pickup?',
      answer: 'Yes, we recommend being present during delivery so we can position the trailer in the best spot for you. For pickup, you just need to make sure the trailer is accessible — you don\'t need to be there.'
    },
    {
      question: 'What if my load is overweight?',
      answer: 'If your load exceeds our standard weight allowance, an additional overweight fee will apply. We\'ll let you know if this is the case after we weigh the load at the dump.'
    },
    {
      question: 'Can I keep the trailer overnight?',
      answer: 'Currently, we offer same-day rentals only (2-4 hour periods). If you need more time, contact us to discuss options.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept cash, credit/debit cards, and other common payment methods. Payment is typically collected after the job is complete.'
    },
    {
      question: 'How do I book?',
      answer: 'You can book online through our website using the "Book Now" button, or call us directly. We\'ll confirm your booking and answer any questions you have.'
    }
  ];

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
                width={150} 
                height={50} 
                className="h-10 w-auto"
              />
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="/faq" className="text-gray-900 font-medium">FAQ</Link>
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
              <Link href="/pricing" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Pricing</Link>
              <Link href="/faq" className="block text-gray-900 font-medium py-2">FAQ</Link>
              <Link href="/contact" className="block text-gray-700 hover:text-gray-900 font-medium py-2">Contact</Link>
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
            src="https://images.unsplash.com/photo-1646139501318-8532e15e6cdf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODh8MHwxfHNlYXJjaHwzfHxoYXVsaW5nJTIwc2VydmljZXxlbnwwfHx8YmxhY2t8MTc3MzAxOTkxNnww&ixlib=rb-4.1.0&q=85" 
            alt="Hauling service"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-300">Everything you need to know about our service</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-gray-700">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Image Section */}
      <section className="relative h-64 md:h-80">
        <img 
          src="https://customer-assets.emergentagent.com/job_dump-book/artifacts/7qbljwnk_trash-hoard.webp" 
          alt="Loaded trailer ready for hauling"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Big Load? No Problem!</h2>
            <p className="text-gray-300">Our trailer can handle your largest cleanout projects</p>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-xl text-gray-600 mb-8">We're here to help! Contact us anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">Contact Us</Button>
            </Link>
            <Link href="/book">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white text-lg px-8 py-6">Book Now</Button>
            </Link>
          </div>
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
