import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
        agreedToTerms
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
      
      // Get pricing
      const pricing = await db.collection('pricing_settings').findOne({});
      const hours = parseInt(rentalDuration);
      const baseHours = 2;
      const extraHours = Math.max(0, hours - baseHours);
      
      const estimatedPrice = pricing.baseRentalFee + pricing.deliveryFee + pricing.dumpFee + (extraHours * pricing.extraHourFee);
      
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
