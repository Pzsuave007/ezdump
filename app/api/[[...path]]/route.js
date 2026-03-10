import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { 
  sendBookingConfirmation, 
  sendDayOfReminder, 
  sendJobCompletedEmail,
  sendTrailerDroppedOffEmail,
  sendTrailerPickedUpEmail,
  sendJobCompletedNotification,
  testEmailConnection,
  isEmailConfigured,
  emailTemplates 
} from '@/lib/email';

// Initialize Stripe with Secret Key (for server-side operations)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || 'placeholder', {
  apiVersion: '2024-12-18.acacia',
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
    
    // ============================================
    // DISCOUNT CODES
    // ============================================
    
    // Get all discount codes
    if (path === '/discount-codes') {
      const codes = await db.collection('discount_codes').find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json(codes, { headers: corsHeaders() });
    }
    
    // Validate a discount code (public endpoint for booking form)
    if (path === '/discount-codes/validate') {
      const code = searchParams.get('code');
      const orderAmount = parseFloat(searchParams.get('amount')) || 0;
      
      if (!code) {
        return NextResponse.json({ valid: false, error: 'Code required' }, { headers: corsHeaders() });
      }
      
      const discountCode = await db.collection('discount_codes').findOne({ 
        code: code.toUpperCase(),
        isActive: true
      });
      
      if (!discountCode) {
        return NextResponse.json({ valid: false, error: 'Invalid discount code' }, { headers: corsHeaders() });
      }
      
      // Check if expired
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        return NextResponse.json({ valid: false, error: 'This code has expired' }, { headers: corsHeaders() });
      }
      
      // Check max uses
      if (discountCode.maxUses > 0 && (discountCode.usedCount || 0) >= discountCode.maxUses) {
        return NextResponse.json({ valid: false, error: 'This code has reached its usage limit' }, { headers: corsHeaders() });
      }
      
      // Check minimum order amount
      if (discountCode.minOrderAmount > 0 && orderAmount < discountCode.minOrderAmount) {
        return NextResponse.json({ 
          valid: false, 
          error: `Minimum order of $${discountCode.minOrderAmount} required for this code` 
        }, { headers: corsHeaders() });
      }
      
      // Calculate discount
      let discountAmount = 0;
      if (discountCode.type === 'percentage') {
        discountAmount = (orderAmount * discountCode.value) / 100;
      } else {
        discountAmount = discountCode.value;
      }
      
      // Cap discount at order amount
      discountAmount = Math.min(discountAmount, orderAmount);
      
      return NextResponse.json({
        valid: true,
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        description: discountCode.description,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100
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
    
    // Get email settings (admin)
    if (path === '/email/settings') {
      let settings = await db.collection('email_settings').findOne({});
      if (!settings) {
        // Create default settings
        settings = {
          id: uuidv4(),
          confirmationEnabled: true,
          reminderEnabled: true,
          reminderTime: '07:00', // 7 AM
          followupEnabled: true,
          followupDelay: 1, // 1 day after completion
          isConfigured: isEmailConfigured(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.collection('email_settings').insertOne(settings);
      }
      settings.isConfigured = isEmailConfigured();
      return NextResponse.json(settings, { headers: corsHeaders() });
    }
    
    // Get email logs (admin)
    if (path === '/email/logs') {
      const logs = await db.collection('email_logs')
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      return NextResponse.json(logs, { headers: corsHeaders() });
    }
    
    // Test email connection
    if (path === '/email/test') {
      const result = await testEmailConnection();
      return NextResponse.json(result, { headers: corsHeaders() });
    }
    
    // Email template preview
    if (path === '/email/preview') {
      const url = new URL(request.url);
      const type = url.searchParams.get('type') || 'confirmation';
      
      // Sample booking data for preview
      const sampleBooking = {
        customerName: 'John Smith',
        email: 'john@example.com',
        phone: '(509) 555-1234',
        address: '1234 Main St, Spokane, WA 99201',
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '9:00 AM',
        rentalDuration: 4,
        loadType: 'Household Junk / Furniture',
        estimatedPrice: 225,
        finalPrice: 225,
        depositPaid: true,
        paymentStatus: 'paid',
        discountCode: '',
        discountAmount: 0,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      
      let template;
      let templateName;
      
      switch (type) {
        case 'confirmation_paid':
          template = emailTemplates.bookingConfirmation({ ...sampleBooking, paymentStatus: 'paid', depositPaid: true });
          templateName = 'Booking Confirmation (Paid)';
          break;
        case 'confirmation_unpaid':
          template = emailTemplates.bookingConfirmation({ ...sampleBooking, paymentStatus: 'pending', depositPaid: false });
          templateName = 'Booking Confirmation (Unpaid)';
          break;
        case 'reminder':
          template = emailTemplates.dayOfReminder(sampleBooking);
          templateName = 'Day-of Reminder';
          break;
        case 'dropped_off':
          template = emailTemplates.trailerDroppedOff(sampleBooking);
          templateName = 'Trailer Dropped Off';
          break;
        case 'picked_up':
          template = emailTemplates.trailerPickedUp(sampleBooking);
          templateName = 'Trailer Picked Up';
          break;
        case 'completed':
          template = emailTemplates.jobCompletedNotification(sampleBooking);
          templateName = 'Job Completed (with REPEAT10 code)';
          break;
        case 'followup':
          template = emailTemplates.jobCompleted(sampleBooking);
          templateName = 'Follow-up / Review Request';
          break;
        default:
          template = emailTemplates.bookingConfirmation(sampleBooking);
          templateName = 'Booking Confirmation (Paid)';
      }
      
      return NextResponse.json({
        html: template.html,
        subject: template.subject,
        templateName,
        type
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
    
    // ============================================
    // DISCOUNT CODES - CREATE
    // ============================================
    if (path === '/discount-codes') {
      const { code, type, value, description, maxUses, minOrderAmount, expiresAt, isActive } = body;
      
      if (!code || !value) {
        return NextResponse.json({ error: 'Code and value required' }, { status: 400, headers: corsHeaders() });
      }
      
      // Check if code already exists
      const existingCode = await db.collection('discount_codes').findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return NextResponse.json({ error: 'This code already exists' }, { status: 400, headers: corsHeaders() });
      }
      
      const newCode = {
        id: uuidv4(),
        code: code.toUpperCase(),
        type: type || 'percentage',
        value: parseFloat(value),
        description: description || '',
        maxUses: parseInt(maxUses) || 0,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        expiresAt: expiresAt || null,
        isActive: isActive !== false,
        usedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('discount_codes').insertOne(newCode);
      
      return NextResponse.json(newCode, { headers: corsHeaders() });
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
        finalPrice: clientFinalPrice,
        deliveryFee: clientDeliveryFee,
        discountCode,
        discountAmount
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
        discountCode: discountCode || null,
        discountAmount: discountAmount || 0,
        requestType: requestType || 'booking',
        agreedToTerms: agreedToTerms || false,
        distanceTier: distanceTier || 'standard',
        deliveryFee,
        status: 'pending',
        estimatedPrice,
        finalPrice: clientFinalPrice || estimatedPrice,
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
      
      // Increment discount code usage if one was applied
      if (discountCode) {
        await db.collection('discount_codes').updateOne(
          { code: discountCode },
          { $inc: { usedCount: 1 } }
        );
      }
      
      // Check email automation settings and send confirmation email
      const emailSettings = await db.collection('email_settings').findOne({});
      if (emailSettings?.confirmationEnabled !== false) {
        // Send booking confirmation email (async, don't wait)
        sendBookingConfirmation(booking).then(result => {
          if (result.success) {
            // Log successful email
            db.collection('email_logs').insertOne({
              id: uuidv4(),
              bookingId: booking.id,
              type: 'booking_confirmation',
              to: booking.email,
              status: 'sent',
              messageId: result.messageId,
              createdAt: new Date()
            });
          } else {
            // Log failed email
            db.collection('email_logs').insertOne({
              id: uuidv4(),
              bookingId: booking.id,
              type: 'booking_confirmation',
              to: booking.email,
              status: result.demo ? 'demo' : 'failed',
              error: result.error,
              createdAt: new Date()
            });
          }
        }).catch(console.error);
      }
      
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
      const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
      if (!stripeKey || stripeKey === 'placeholder' || stripeKey.length < 20) {
        // Return a demo response for testing - indicates Stripe is ready but needs real key
        return NextResponse.json({ 
          demo: true,
          message: 'Stripe payment integration is ready. Add your Stripe Secret Key to enable live payments.',
          bookingId: bookingId,
          amount: DEPOSIT_AMOUNT
        }, { headers: corsHeaders() });
      }
      
      try {
        // First, create or get Stripe customer
        let stripeCustomerId = booking.stripeCustomerId;
        
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: booking.email,
            name: booking.customerName,
            phone: booking.phone,
            metadata: {
              bookingId: bookingId,
            },
          });
          stripeCustomerId = customer.id;
          
          // Save customer ID to booking
          await db.collection('bookings').updateOne(
            { id: bookingId },
            { $set: { stripeCustomerId: stripeCustomerId, updatedAt: new Date() } }
          );
        }
        
        // Create Stripe checkout session with setup_future_usage to save the card
        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomerId,
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
          payment_intent_data: {
            setup_future_usage: 'off_session', // This saves the card for future charges
          },
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
          // Get the payment intent to retrieve the payment method
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          const paymentMethodId = paymentIntent.payment_method;
          
          // Update payment transaction
          await db.collection('payment_transactions').updateOne(
            { sessionId },
            { 
              $set: { 
                status: 'complete',
                paymentStatus: 'completed',
                stripePaymentIntentId: session.payment_intent,
                stripePaymentMethodId: paymentMethodId,
                updatedAt: new Date() 
              } 
            }
          );
          
          // Update booking payment status with saved payment method
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
                  stripePaymentMethodId: paymentMethodId,
                  status: 'confirmed', // Auto-confirm when paid
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
    
    // Charge remaining balance using saved card
    if (path === '/payments/charge-balance') {
      const { bookingId, amount } = body;
      
      if (!bookingId || !amount) {
        return NextResponse.json({ error: 'Booking ID and amount required' }, { status: 400, headers: corsHeaders() });
      }
      
      // Get booking
      const booking = await db.collection('bookings').findOne({ id: bookingId });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      
      // Check if we have saved payment method
      if (!booking.stripeCustomerId || !booking.stripePaymentMethodId) {
        return NextResponse.json({ 
          error: 'No saved payment method. Customer needs to pay manually.',
          noSavedCard: true 
        }, { status: 400, headers: corsHeaders() });
      }
      
      try {
        // Create payment intent to charge the saved card
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          customer: booking.stripeCustomerId,
          payment_method: booking.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `Remaining balance for booking ${bookingId}`,
          metadata: {
            bookingId: bookingId,
            type: 'balance_payment',
          },
        });
        
        if (paymentIntent.status === 'succeeded') {
          // Update booking
          const newAmountPaid = (booking.amountPaid || 0) + amount;
          const totalPrice = booking.finalPrice || booking.estimatedPrice;
          const isFullyPaid = newAmountPaid >= totalPrice;
          
          await db.collection('bookings').updateOne(
            { id: bookingId },
            { 
              $set: { 
                amountPaid: newAmountPaid,
                paymentStatus: isFullyPaid ? 'paid' : 'deposit_paid',
                balanceChargedAt: new Date(),
                updatedAt: new Date() 
              } 
            }
          );
          
          // Record transaction
          await db.collection('payment_transactions').insertOne({
            id: uuidv4(),
            bookingId: bookingId,
            amount: amount,
            currency: 'usd',
            status: 'complete',
            paymentStatus: 'completed',
            type: 'balance_payment',
            stripePaymentIntentId: paymentIntent.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          return NextResponse.json({ 
            success: true,
            message: `Successfully charged $${amount}`,
            amountCharged: amount,
            totalPaid: newAmountPaid,
            isFullyPaid: isFullyPaid,
          }, { headers: corsHeaders() });
        } else {
          return NextResponse.json({ 
            error: 'Payment not completed',
            status: paymentIntent.status 
          }, { status: 400, headers: corsHeaders() });
        }
        
      } catch (stripeError) {
        console.error('Stripe Charge Error:', stripeError);
        
        // Handle specific errors
        if (stripeError.code === 'card_declined') {
          return NextResponse.json({ 
            error: 'Card was declined. Please contact customer for alternative payment.',
            code: 'card_declined'
          }, { status: 400, headers: corsHeaders() });
        }
        
        return NextResponse.json({ 
          error: stripeError.message || 'Failed to charge card'
        }, { status: 500, headers: corsHeaders() });
      }
    }
    
    // Update email settings
    if (path === '/email/settings') {
      const { confirmationEnabled, reminderEnabled, reminderTime, followupEnabled, followupDelay } = body;
      
      const updateData = {
        updatedAt: new Date()
      };
      
      if (typeof confirmationEnabled === 'boolean') updateData.confirmationEnabled = confirmationEnabled;
      if (typeof reminderEnabled === 'boolean') updateData.reminderEnabled = reminderEnabled;
      if (reminderTime) updateData.reminderTime = reminderTime;
      if (typeof followupEnabled === 'boolean') updateData.followupEnabled = followupEnabled;
      if (typeof followupDelay === 'number') updateData.followupDelay = followupDelay;
      
      await db.collection('email_settings').updateOne(
        {},
        { $set: updateData },
        { upsert: true }
      );
      
      const settings = await db.collection('email_settings').findOne({});
      settings.isConfigured = isEmailConfigured();
      return NextResponse.json(settings, { headers: corsHeaders() });
    }
    
    // Send test email
    if (path === '/email/test') {
      const { email, type } = body;
      
      if (!email) {
        return NextResponse.json({ error: 'Email address required' }, { status: 400, headers: corsHeaders() });
      }
      
      // Create a dummy booking for the test - mark as paid/confirmed
      const testBooking = {
        id: 'test-booking',
        customerName: 'Test Customer',
        email: email,
        phone: '(509) 555-1234',
        address: '123 Test Street, Spokane, WA 99201',
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '9:00 AM',
        rentalDuration: 2,
        loadType: 'household',
        estimatedPrice: 214,
        finalPrice: 214,
        paymentStatus: 'deposit_paid', // Mark as paid so confirmation shows "CONFIRMED"
        depositPaid: true,
        depositAmount: 50,
        status: 'confirmed'
      };
      
      let result;
      switch (type) {
        case 'reminder':
          result = await sendDayOfReminder(testBooking);
          break;
        case 'followup':
          result = await sendJobCompletedEmail(testBooking);
          break;
        case 'dropped_off':
          result = await sendTrailerDroppedOffEmail(testBooking);
          break;
        case 'picked_up':
          result = await sendTrailerPickedUpEmail(testBooking);
          break;
        case 'completed':
          result = await sendJobCompletedNotification(testBooking);
          break;
        case 'confirmation':
        default:
          result = await sendBookingConfirmation(testBooking);
          break;
      }
      
      // Log the test email
      await db.collection('email_logs').insertOne({
        id: uuidv4(),
        bookingId: 'test',
        type: `test_${type || 'confirmation'}`,
        to: email,
        status: result.success ? 'sent' : (result.demo ? 'demo' : 'failed'),
        messageId: result.messageId,
        error: result.error,
        createdAt: new Date()
      });
      
      return NextResponse.json(result, { headers: corsHeaders() });
    }
    
    // Manually trigger email for a booking
    if (path === '/email/send') {
      const { bookingId, type } = body;
      
      if (!bookingId || !type) {
        return NextResponse.json({ error: 'Booking ID and email type required' }, { status: 400, headers: corsHeaders() });
      }
      
      const booking = await db.collection('bookings').findOne({ id: bookingId });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders() });
      }
      
      let result;
      switch (type) {
        case 'reminder':
          result = await sendDayOfReminder(booking);
          break;
        case 'followup':
          result = await sendJobCompletedEmail(booking);
          break;
        case 'dropped_off':
          result = await sendTrailerDroppedOffEmail(booking);
          break;
        case 'picked_up':
          result = await sendTrailerPickedUpEmail(booking);
          break;
        case 'completed':
          result = await sendJobCompletedNotification(booking);
          break;
        case 'confirmation':
        default:
          result = await sendBookingConfirmation(booking);
          break;
      }
      
      // Log the email
      await db.collection('email_logs').insertOne({
        id: uuidv4(),
        bookingId: bookingId,
        type: type,
        to: booking.email,
        status: result.success ? 'sent' : (result.demo ? 'demo' : 'failed'),
        messageId: result.messageId,
        error: result.error,
        createdAt: new Date()
      });
      
      return NextResponse.json(result, { headers: corsHeaders() });
    }
    
    // Process scheduled emails (called by cron or manually)
    if (path === '/email/process-scheduled') {
      const settings = await db.collection('email_settings').findOne({});
      const today = new Date().toISOString().split('T')[0];
      const results = { reminders: 0, followups: 0, errors: [] };
      
      // Process day-of reminders
      if (settings?.reminderEnabled !== false) {
        const todayBookings = await db.collection('bookings').find({
          preferredDate: today,
          status: { $in: ['pending', 'confirmed'] }
        }).toArray();
        
        for (const booking of todayBookings) {
          // Check if reminder already sent
          const existingReminder = await db.collection('email_logs').findOne({
            bookingId: booking.id,
            type: 'reminder',
            createdAt: { $gte: new Date(today) }
          });
          
          if (!existingReminder) {
            const result = await sendDayOfReminder(booking);
            await db.collection('email_logs').insertOne({
              id: uuidv4(),
              bookingId: booking.id,
              type: 'reminder',
              to: booking.email,
              status: result.success ? 'sent' : (result.demo ? 'demo' : 'failed'),
              messageId: result.messageId,
              error: result.error,
              createdAt: new Date()
            });
            if (result.success) results.reminders++;
            else results.errors.push({ bookingId: booking.id, type: 'reminder', error: result.error });
          }
        }
      }
      
      // Process follow-up emails for completed jobs
      if (settings?.followupEnabled !== false) {
        const followupDelay = settings?.followupDelay || 1;
        const followupDate = new Date();
        followupDate.setDate(followupDate.getDate() - followupDelay);
        const followupDateStr = followupDate.toISOString().split('T')[0];
        
        const completedBookings = await db.collection('bookings').find({
          status: 'completed',
          preferredDate: { $lte: followupDateStr }
        }).toArray();
        
        for (const booking of completedBookings) {
          // Check if followup already sent
          const existingFollowup = await db.collection('email_logs').findOne({
            bookingId: booking.id,
            type: 'followup'
          });
          
          if (!existingFollowup) {
            const result = await sendJobCompletedEmail(booking);
            await db.collection('email_logs').insertOne({
              id: uuidv4(),
              bookingId: booking.id,
              type: 'followup',
              to: booking.email,
              status: result.success ? 'sent' : (result.demo ? 'demo' : 'failed'),
              messageId: result.messageId,
              error: result.error,
              createdAt: new Date()
            });
            if (result.success) results.followups++;
            else results.errors.push({ bookingId: booking.id, type: 'followup', error: result.error });
          }
        }
      }
      
      return NextResponse.json(results, { headers: corsHeaders() });
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
    
    // Update discount code
    if (path.startsWith('/discount-codes/') && pathSegments.length === 2) {
      const codeId = pathSegments[1];
      const updateData = { ...body, updatedAt: new Date() };
      delete updateData.id;
      delete updateData._id;
      delete updateData.createdAt;
      
      const result = await db.collection('discount_codes').updateOne(
        { id: codeId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Discount code not found' }, { status: 404, headers: corsHeaders() });
      }
      
      const updated = await db.collection('discount_codes').findOne({ id: codeId });
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
    
    // Delete discount code
    if (path.startsWith('/discount-codes/') && pathSegments.length === 2) {
      const codeId = pathSegments[1];
      const result = await db.collection('discount_codes').deleteOne({ id: codeId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Discount code not found' }, { status: 404, headers: corsHeaders() });
      }
      
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
  }
}
