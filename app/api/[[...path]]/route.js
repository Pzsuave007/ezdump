import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

// Initialize Stripe with integration proxy
const INTEGRATION_PROXY_URL = process.env.INTEGRATION_PROXY_URL || 'https://integrations.emergentagent.com';
const stripe = new Stripe(process.env.STRIPE_API_KEY || 'sk_test_emergent', {
  apiVersion: '2024-12-18.acacia',
  // Use integration proxy if available
  host: INTEGRATION_PROXY_URL ? new URL(INTEGRATION_PROXY_URL).hostname : undefined,
});

// Deposit amount configuration
const DEPOSIT_AMOUNT = 50.00; // Fixed $50 deposit

// Helper to add CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// Initialize default data
async function initializeData(db) {
  // Check if pricing settings exist
  const pricingExists = await db.collection('pricing_settings').findOne({});
  if (!pricingExists) {
    await db.collection('pricing_settings').insertOne({
      id: uuidv4(),
      baseRentalFee: 150,
      deliveryFee: 50,
      dumpFee: 75,
      extraHourFee: 35,
      overweightFee: 50,
      travelFee: 25,
      serviceRadius: 30,
      serviceCityState: 'Spokane, WA',
      updatedAt: new Date()
    });
  }
  
  // Check if admin exists
  const adminExists = await db.collection('admins').findOne({});
  if (!adminExists) {
    await db.collection('admins').insertOne({
      id: uuidv4(),
      username: 'admin',
      password: hashPassword('admin123'),
      name: 'Admin',
      createdAt: new Date()
    });
  }
}

// Route handler
export async function GET(request, { params }) {
  const db = await getDb();
  await initializeData(db);
  
  const pathSegments = params.path || [];
  const path = '/' + pathSegments.join('/');
  const { searchParams } = new URL(request.url);
  
  try {
    // Auth verify
    if (path === '/auth/verify') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401, headers: corsHeaders() });
      }
      const session = await db.collection('sessions').findOne({ token });
      if (!session) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders() });
      }
      const admin = await db.collection('admins').findOne({ id: session.adminId });
      return NextResponse.json({ admin: { id: admin.id, name: admin.name, username: admin.username } }, { headers: corsHeaders() });
    }
    
    // Get pricing settings (public)
    if (path === '/pricing') {
      const pricing = await db.collection('pricing_settings').findOne({});
      return NextResponse.json(pricing, { headers: corsHeaders() });
    }
    
    // Get bookings (admin)
    if (path === '/bookings') {
      const status = searchParams.get('status');
      const date = searchParams.get('date');
      const query = {};
      if (status) query.status = status;
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.preferredDate = { $gte: startDate.toISOString().split('T')[0], $lte: endDate.toISOString().split('T')[0] };
      }
      const bookings = await db.collection('bookings').find(query).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(bookings, { headers: corsHeaders() });
    }
    
    // Get single booking
    if (path.startsWith('/bookings/') && pathSegments.length === 2) {
      const bookingId = pathSegments[1];
      const booking = await db.collection('bookings').findOne({ id: bookingId });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      return NextResponse.json(booking, { headers: corsHeaders() });
    }
    
    // Get customers (admin)
    if (path === '/customers') {
      const customers = await db.collection('customers').find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(customers, { headers: corsHeaders() });
    }
    
    // Get single customer with their bookings
    if (path.startsWith('/customers/') && pathSegments.length === 2) {
      const customerId = pathSegments[1];
      const customer = await db.collection('customers').findOne({ id: customerId });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404, headers: corsHeaders() });
      }
      const bookings = await db.collection('bookings').find({ customerId }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ ...customer, bookings }, { headers: corsHeaders() });
    }
    
    // Get dashboard stats
    if (path === '/stats') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const today = now.toISOString().split('T')[0];
      
      const todayJobs = await db.collection('bookings').find({ preferredDate: today }).toArray();
      const pendingJobs = await db.collection('bookings').find({ status: 'pending' }).toArray();
      const confirmedJobs = await db.collection('bookings').find({ status: 'confirmed' }).toArray();
      const completedJobs = await db.collection('bookings').find({ status: 'completed' }).toArray();
      
      // Jobs this week
      const weekStart = startOfWeek.toISOString().split('T')[0];
      const allWeekJobs = await db.collection('bookings').find({
        createdAt: { $gte: startOfWeek }
      }).toArray();
      
      const weekRevenue = allWeekJobs
        .filter(j => j.status === 'completed' && j.finalPrice)
        .reduce((sum, j) => sum + (j.finalPrice || 0), 0);
      
      // Upcoming jobs (confirmed, not today)
      const upcomingJobs = await db.collection('bookings').find({
        status: { $in: ['confirmed', 'pending'] },
        preferredDate: { $gt: today }
      }).sort({ preferredDate: 1 }).limit(5).toArray();
      
      return NextResponse.json({
        todayJobs: todayJobs.length,
        todayJobsList: todayJobs,
        pendingJobs: pendingJobs.length,
        confirmedJobs: confirmedJobs.length,
        completedThisWeek: allWeekJobs.filter(j => j.status === 'completed').length,
        weekRevenue,
        totalJobsThisWeek: allWeekJobs.length,
        upcomingJobs
      }, { headers: corsHeaders() });
    }
    
    // Calendar data
    if (path === '/calendar') {
      const month = searchParams.get('month');
      const year = searchParams.get('year');
      
      let query = {};
      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`;
        query.preferredDate = { $gte: startDate, $lte: endDate };
      }
      
      const bookings = await db.collection('bookings').find(query).toArray();
      return NextResponse.json(bookings, { headers: corsHeaders() });
    }
    
    // Public availability endpoint for booking calendar
    if (path === '/availability') {
      const month = searchParams.get('month');
      const year = searchParams.get('year');
      
      // Define all available time slots (in order)
      const allTimeSlots = [
        '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
      ];
      
      // Buffer time for dumping the trailer (in hours)
      const DUMP_BUFFER_HOURS = 1;
      
      // Helper function to get slot index
      const getSlotIndex = (timeStr) => allTimeSlots.indexOf(timeStr);
      
      // Helper function to get slots blocked by a booking
      // Booking blocks: start_time + rental_duration + dump_buffer
      const getBlockedSlots = (startTime, rentalDuration) => {
        const startIndex = getSlotIndex(startTime);
        if (startIndex === -1) return [];
        
        const totalBlockedHours = rentalDuration + DUMP_BUFFER_HOURS;
        const blockedSlots = [];
        
        for (let i = 0; i < totalBlockedHours && (startIndex + i) < allTimeSlots.length; i++) {
          blockedSlots.push(allTimeSlots[startIndex + i]);
        }
        
        return blockedSlots;
      };
      
      if (!month || !year) {
        return NextResponse.json({ error: 'Month and year required' }, { status: 400, headers: corsHeaders() });
      }
      
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      
      // Get all bookings for the month (excluding cancelled)
      const bookings = await db.collection('bookings').find({
        preferredDate: { $gte: startDate, $lte: endDate },
        status: { $nin: ['cancelled'] }
      }).toArray();
      
      // Build availability map
      const availability = {};
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      const today = new Date().toISOString().split('T')[0];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Skip past dates
        if (dateStr < today) {
          availability[dateStr] = { available: false, slots: [], isPast: true };
          continue;
        }
        
        // Check day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = new Date(dateStr).getDay();
        
        // Sunday closed
        if (dayOfWeek === 0) {
          availability[dateStr] = { available: false, slots: [], reason: 'Closed on Sundays' };
          continue;
        }
        
        // Saturday limited hours (8am - 3pm, no 7am or 4pm)
        const daySlots = dayOfWeek === 6 
          ? allTimeSlots.filter(s => !['7:00 AM', '4:00 PM'].includes(s))
          : [...allTimeSlots];
        
        // Get all bookings for this date and calculate blocked slots
        const dayBookings = bookings.filter(b => b.preferredDate === dateStr);
        
        // Track which slots are blocked
        const blockedSlots = new Set();
        
        dayBookings.forEach(booking => {
          const duration = booking.rentalDuration || 2; // Default 2 hours if not set
          const blocked = getBlockedSlots(booking.preferredTime, duration);
          blocked.forEach(slot => blockedSlots.add(slot));
        });
        
        // Build available slots
        const availableSlots = daySlots.map(slot => {
          const isBlocked = blockedSlots.has(slot);
          return {
            time: slot,
            available: !isBlocked,
            spotsLeft: isBlocked ? 0 : 1
          };
        });
        
        const hasAvailability = availableSlots.some(s => s.available);
        
        availability[dateStr] = {
          available: hasAvailability,
          slots: availableSlots,
          totalAvailable: availableSlots.filter(s => s.available).length
        };
      }
      
      return NextResponse.json({ 
        month: parseInt(month), 
        year: parseInt(year), 
        availability 
      }, { headers: corsHeaders() });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function POST(request, { params }) {
  const db = await getDb();
  await initializeData(db);
  
  const pathSegments = params.path || [];
  const path = '/' + pathSegments.join('/');
  
  try {
    const body = await request.json();
    
    // Admin login
    if (path === '/auth/login') {
      const { username, password } = body;
      const admin = await db.collection('admins').findOne({ username });
      
      if (!admin || !verifyPassword(password, admin.password)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders() });
      }
      
      const token = generateToken();
      await db.collection('sessions').insertOne({
        id: uuidv4(),
        adminId: admin.id,
        token,
        createdAt: new Date()
      });
      
      return NextResponse.json({ 
        token, 
        admin: { id: admin.id, name: admin.name, username: admin.username } 
      }, { headers: corsHeaders() });
    }
    
    // Create booking (public)
    if (path === '/bookings') {
      const {
        customerName,
        phone,
        email,
        address,
        preferredDate,
        preferredTime,
        rentalDuration,
        loadType,
        description,
        promoCode,
        requestType,
        agreedToTerms,
        distanceTier,
        estimatedPrice: clientEstimatedPrice,
        deliveryFee: clientDeliveryFee
      } = body;
      
      // Validate required fields
      if (!customerName || !phone || !email || !address || !preferredDate || !preferredTime || !rentalDuration || !loadType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders() });
      }
      
      // Find or create customer
      let customer = await db.collection('customers').findOne({ email });
      if (!customer) {
        customer = {
          id: uuidv4(),
          name: customerName,
          email,
          phone,
          address,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.collection('customers').insertOne(customer);
      } else {
        await db.collection('customers').updateOne(
          { id: customer.id },
          { $set: { name: customerName, phone, address, updatedAt: new Date() } }
        );
      }
      
      // Get pricing and calculate estimate
      const pricing = await db.collection('pricing_settings').findOne({});
      const hours = parseInt(rentalDuration);
      const baseHours = 2;
      const extraHours = Math.max(0, hours - baseHours);
      
      // Use client-provided delivery fee if available (distance-based), otherwise default
      const deliveryFee = clientDeliveryFee || pricing.deliveryFee;
      
      // Use client-provided estimate if available, otherwise calculate
      const estimatedPrice = clientEstimatedPrice || (pricing.baseRentalFee + deliveryFee + pricing.dumpFee + (extraHours * pricing.extraHourFee));
      
      const booking = {
        id: uuidv4(),
        customerId: customer.id,
        customerName,
        phone,
        email,
        address,
        preferredDate,
        preferredTime,
        rentalDuration: hours,
        loadType,
        description: description || '',
        promoCode: promoCode || '',
        requestType: requestType || 'booking',
        agreedToTerms: agreedToTerms || false,
        distanceTier: distanceTier || 'standard',
        deliveryFee,
        status: 'pending',
        estimatedPrice,
        finalPrice: null,
        extraCharges: [],
        internalNotes: '',
        paymentStatus: 'unpaid',
        depositAmount: 0,
        amountPaid: 0,
        paymentMethod: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('bookings').insertOne(booking);
      
      return NextResponse.json(booking, { status: 201, headers: corsHeaders() });
    }
    
    // Logout
    if (path === '/auth/logout') {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (token) {
        await db.collection('sessions').deleteOne({ token });
      }
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }
    
    // Create Stripe checkout session for booking deposit
    if (path === '/payments/create-checkout') {
      const { bookingId, originUrl } = body;
      
      if (!bookingId || !originUrl) {
        return NextResponse.json({ error: 'Booking ID and origin URL required' }, { status: 400, headers: corsHeaders() });
      }
      
      // Get the booking
      const booking = await db.collection('bookings').findOne({ id: bookingId });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      
      // Check if already paid
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit_paid') {
        return NextResponse.json({ error: 'Deposit already paid' }, { status: 400, headers: corsHeaders() });
      }
      
      // Check if Stripe is properly configured
      const stripeKey = process.env.STRIPE_API_KEY;
      if (!stripeKey || stripeKey === 'sk_test_emergent' || stripeKey.length < 20) {
        // Return a demo response for testing - indicates Stripe is ready but needs real key
        return NextResponse.json({ 
          demo: true,
          message: 'Stripe payment integration is ready. Add your Stripe API key to enable live payments.',
          bookingId: bookingId,
          amount: DEPOSIT_AMOUNT
        }, { headers: corsHeaders() });
      }
      
      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Dump Trailer Rental Deposit',
                  description: `Booking for ${booking.preferredDate} at ${booking.preferredTime}`,
                },
                unit_amount: Math.round(DEPOSIT_AMOUNT * 100), // Stripe uses cents
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${originUrl}/booking-confirmation/${bookingId}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
          cancel_url: `${originUrl}/booking-confirmation/${bookingId}?payment=cancelled`,
          metadata: {
            bookingId: bookingId,
            customerEmail: booking.email,
            customerName: booking.customerName,
          },
        });
        
        // Create payment transaction record
        await db.collection('payment_transactions').insertOne({
          id: uuidv4(),
          bookingId: bookingId,
          sessionId: session.id,
          amount: DEPOSIT_AMOUNT,
          currency: 'usd',
          status: 'pending',
          paymentStatus: 'initiated',
          customerEmail: booking.email,
          metadata: {
            bookingId: bookingId,
            customerName: booking.customerName,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        return NextResponse.json({ 
          url: session.url, 
          sessionId: session.id 
        }, { headers: corsHeaders() });
        
      } catch (stripeError) {
        console.error('Stripe Error:', stripeError);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500, headers: corsHeaders() });
      }
    }
    
    // Check payment status
    if (path === '/payments/status') {
      const { sessionId } = body;
      
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400, headers: corsHeaders() });
      }
      
      try {
        // Get session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        // Get payment transaction
        const transaction = await db.collection('payment_transactions').findOne({ sessionId });
        
        // Determine payment status
        let paymentResult = {
          status: session.status,
          paymentStatus: session.payment_status,
          amount: session.amount_total / 100,
          currency: session.currency,
        };
        
        // If payment is successful and not already processed
        if (session.payment_status === 'paid' && transaction && transaction.paymentStatus !== 'completed') {
          // Update payment transaction
          await db.collection('payment_transactions').updateOne(
            { sessionId },
            { 
              $set: { 
                status: 'complete',
                paymentStatus: 'completed',
                stripePaymentIntentId: session.payment_intent,
                updatedAt: new Date() 
              } 
            }
          );
          
          // Update booking payment status
          if (transaction.bookingId) {
            await db.collection('bookings').updateOne(
              { id: transaction.bookingId },
              { 
                $set: { 
                  paymentStatus: 'deposit_paid',
                  depositAmount: DEPOSIT_AMOUNT,
                  amountPaid: DEPOSIT_AMOUNT,
                  paymentMethod: 'stripe',
                  stripeSessionId: sessionId,
                  updatedAt: new Date() 
                } 
              }
            );
          }
        } else if (session.status === 'expired') {
          // Update transaction as expired
          await db.collection('payment_transactions').updateOne(
            { sessionId },
            { 
              $set: { 
                status: 'expired',
                paymentStatus: 'expired',
                updatedAt: new Date() 
              } 
            }
          );
        }
        
        return NextResponse.json(paymentResult, { headers: corsHeaders() });
        
      } catch (stripeError) {
        console.error('Stripe Status Error:', stripeError);
        return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500, headers: corsHeaders() });
      }
    }
    
    // Stripe webhook handler
    if (path === '/webhook/stripe') {
      // For webhooks, we need raw body - but in this simplified version, 
      // we rely on polling for status updates
      return NextResponse.json({ received: true }, { headers: corsHeaders() });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function PUT(request, { params }) {
  const db = await getDb();
  
  const pathSegments = params.path || [];
  const path = '/' + pathSegments.join('/');
  
  try {
    const body = await request.json();
    
    // Update booking
    if (path.startsWith('/bookings/') && pathSegments.length === 2) {
      const bookingId = pathSegments[1];
      const updateData = { ...body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData._id;
      delete updateData.createdAt;
      
      const result = await db.collection('bookings').updateOne(
        { id: bookingId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      
      const updated = await db.collection('bookings').findOne({ id: bookingId });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }
    
    // Update customer
    if (path.startsWith('/customers/') && pathSegments.length === 2) {
      const customerId = pathSegments[1];
      const updateData = { ...body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData._id;
      delete updateData.createdAt;
      
      const result = await db.collection('customers').updateOne(
        { id: customerId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404, headers: corsHeaders() });
      }
      
      const updated = await db.collection('customers').findOne({ id: customerId });
      return NextResponse.json(updated, { headers: corsHeaders() });
    }
    
    // Update pricing settings
    if (path === '/pricing') {
      const updateData = { ...body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData._id;
      
      await db.collection('pricing_settings').updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );
      
      const updated = await db.collection('pricing_settings').findOne({});
      return NextResponse.json(updated, { headers: corsHeaders() });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}

export async function DELETE(request, { params }) {
  const db = await getDb();
  
  const pathSegments = params.path || [];
  const path = '/' + pathSegments.join('/');
  
  try {
    // Delete booking
    if (path.startsWith('/bookings/') && pathSegments.length === 2) {
      const bookingId = pathSegments[1];
      const result = await db.collection('bookings').deleteOne({ id: bookingId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
