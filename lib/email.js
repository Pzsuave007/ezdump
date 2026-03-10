import nodemailer from 'nodemailer';

// SMTP Configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Sender info
const defaultFrom = {
  name: process.env.EMAIL_FROM_NAME || 'Easy Load & Dump',
  email: process.env.EMAIL_FROM_ADDRESS || 'bookings@ezloadndump.com',
};

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

// Check if email is configured
export function isEmailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Logo URL for emails
const LOGO_URL = process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png` : 'https://ez-load-booking.preview.emergentagent.com/logo.png';

// Email templates
export const emailTemplates = {
  bookingConfirmation: (booking) => {
    const isPaid = booking.paymentStatus === 'paid' || booking.depositPaid;
    const statusText = isPaid ? 'CONFIRMED & PAID' : 'Received - Pending Confirmation';
    const statusColor = isPaid ? '#16a34a' : '#f59e0b';
    const statusBg = isPaid ? '#d4edda' : '#fff3cd';
    const statusBorder = isPaid ? '#28a745' : '#ffc107';
    
    return {
      subject: isPaid ? `Booking CONFIRMED - ${booking.preferredDate}` : `Booking Received - ${booking.preferredDate}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
    <p style="color: #ccc; margin: 10px 0 0 0;">Dump Trailer Rental Service</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <div style="background: ${statusBg}; border: 2px solid ${statusBorder}; border-radius: 8px; padding: 15px; margin-bottom: 20px; text-align: center;">
      <h2 style="color: ${statusColor}; margin: 0;">${isPaid ? '✅ BOOKING CONFIRMED!' : '📋 Booking Received'}</h2>
      ${isPaid ? '<p style="margin: 5px 0 0 0; color: #155724;">Your $50 deposit has been received. Your trailer is reserved!</p>' : '<p style="margin: 5px 0 0 0; color: #856404;">We will contact you to confirm availability and arrange payment.</p>'}
    </div>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    ${isPaid 
      ? '<p>Thank you for your payment! Your dump trailer rental is <strong>confirmed and reserved</strong> for the date below. We look forward to serving you!</p>'
      : '<p>Thank you for your booking request with Easy Load & Dump! We have received your request and will contact you shortly to confirm availability.</p>'
    }
    
    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px;">📋 Booking Details</h3>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Status:</td>
          <td style="padding: 8px 0; font-weight: bold; color: ${statusColor};">${statusText}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Time:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.preferredTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Duration:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.rentalDuration} Hours</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Address:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Load Type:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.loadType}</td>
        </tr>
        ${isPaid ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Deposit Paid:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">$50.00 ✓</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: bold;">Estimated Total:</span>
          <span style="font-size: 24px; font-weight: bold; color: #16a34a;">$${booking.estimatedPrice}</span>
        </div>
        ${isPaid ? '<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Remaining balance due at pickup: $' + (booking.estimatedPrice - 50) + '</p>' : ''}
      </div>
    </div>
    
    <div style="background: ${isPaid ? '#d4edda' : '#fff3cd'}; border: 1px solid ${isPaid ? '#28a745' : '#ffc107'}; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: ${isPaid ? '#155724' : '#856404'};">📝 What Happens Next?</h4>
      <ol style="margin: 0; padding-left: 20px; color: ${isPaid ? '#155724' : '#856404'};">
        ${isPaid ? `
        <li>Your trailer is reserved for the scheduled date</li>
        <li>We'll send a reminder the morning of your appointment</li>
        <li>We'll drop off the trailer at the scheduled time</li>
        <li>You load it up, and we'll haul it away!</li>
        ` : `
        <li>We'll review your request and confirm availability</li>
        <li>We'll contact you to finalize the booking and collect deposit</li>
        <li>On the scheduled day, we'll drop off the trailer</li>
        <li>You load it up, and we'll haul it away!</li>
        `}
      </ol>
    </div>
    
    <p>If you have any questions, feel free to contact us:</p>
    <p>
      📞 <a href="tel:+15098633109" style="color: #1a1a1a;">(509) 863-3109</a><br>
      ✉️ <a href="mailto:info@ezloadndump.com" style="color: #1a1a1a;">info@ezloadndump.com</a>
    </p>
    
    <p>Thank you for choosing Easy Load & Dump!</p>
    
    <p style="margin-bottom: 0;">
      Best regards,<br>
      <strong>The Easy Load & Dump Team</strong>
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      Easy Load & Dump | Spokane, WA<br>
      Serving the Spokane area within a 50-mile radius
    </p>
  </div>
</body>
</html>
    `,
    text: `
${isPaid ? 'BOOKING CONFIRMED!' : 'Booking Received'}

Hi ${booking.customerName},

${isPaid 
  ? 'Thank you for your payment! Your dump trailer rental is CONFIRMED and reserved.'
  : 'Thank you for your booking request! We will contact you to confirm availability.'
}

BOOKING DETAILS:
- Status: ${statusText}
- Date: ${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${booking.preferredTime}
- Duration: ${booking.rentalDuration} Hours
- Address: ${booking.address}
- Load Type: ${booking.loadType}
- Estimated Total: $${booking.estimatedPrice}
${isPaid ? '- Deposit Paid: $50.00' : ''}

Questions? Call us at (509) 863-3109

Thank you for choosing Easy Load & Dump!
    `
    };
  },

  dayOfReminder: (booking) => ({
    subject: `Reminder: Your Dump Trailer Arrives Today at ${booking.preferredTime}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <h2 style="color: #1a1a1a; margin-top: 0;">📅 Your Trailer Arrives Today!</h2>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    <p>This is a friendly reminder that your dump trailer rental is <strong>scheduled for today</strong>!</p>
    
    <div style="background: #d4edda; border: 1px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 18px; color: #155724;">
        <strong>Arriving at ${booking.preferredTime}</strong><br>
        ${booking.address}
      </p>
    </div>
    
    <h3 style="color: #1a1a1a;">✅ Quick Checklist:</h3>
    <ul style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 15px 0;">
      <li>Clear the driveway/area where the trailer will be placed</li>
      <li>Have your items ready to load</li>
      <li>Someone should be present during drop-off</li>
      <li>Keep prohibited items separate (no hazardous materials, paint, tires, etc.)</li>
    </ul>
    
    <p>You'll have <strong>${booking.rentalDuration} hours</strong> to load the trailer. Take your time and fill it up!</p>
    
    <p>Need to reschedule? Call us ASAP at <a href="tel:+15098633109" style="color: #1a1a1a; font-weight: bold;">(509) 863-3109</a></p>
    
    <p>See you soon!</p>
    
    <p style="margin-bottom: 0;">
      <strong>The Easy Load & Dump Team</strong>
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">Easy Load & Dump | Spokane, WA</p>
  </div>
</body>
</html>
    `,
    text: `
Your Trailer Arrives Today!

Hi ${booking.customerName},

This is a reminder that your dump trailer rental is scheduled for TODAY!

Arriving at: ${booking.preferredTime}
Address: ${booking.address}

CHECKLIST:
- Clear the driveway/area for the trailer
- Have your items ready to load
- Someone should be present during drop-off
- Keep prohibited items separate

You'll have ${booking.rentalDuration} hours to load.

Need to reschedule? Call us at (509) 863-3109

See you soon!
The Easy Load & Dump Team
    `
  }),

  jobCompleted: (booking) => ({
    subject: `Thanks for using Easy Load & Dump! How did we do?`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <h2 style="color: #1a1a1a; margin-top: 0;">Thank You! 🎉</h2>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    <p>Thank you for choosing Easy Load & Dump for your recent junk removal! We hope the process was smooth and hassle-free.</p>
    
    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #1a1a1a;">How Did We Do?</h3>
      <p>We'd love to hear your feedback! Your review helps us improve and helps others find our service.</p>
      <p style="font-size: 32px; margin: 20px 0;">⭐⭐⭐⭐⭐</p>
      <p style="color: #666; font-size: 14px;">If you have a moment, please consider leaving us a review on Google or Facebook!</p>
    </div>
    
    <div style="background: #e7f3ff; border: 1px solid #0066cc; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0066cc;">🔄 Need Us Again?</h4>
      <p style="margin: 0; color: #0066cc;">
        Garage cleanout? Renovation debris? Moving out?<br>
        We're here whenever you need us!
      </p>
    </div>
    
    <p>Thank you for supporting local business. We look forward to serving you again!</p>
    
    <p style="margin-bottom: 0;">
      Best regards,<br>
      <strong>The Easy Load & Dump Team</strong><br>
      📞 (509) 863-3109
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      Easy Load & Dump | Spokane, WA<br>
      <a href="https://ezloadndump.com" style="color: #999;">www.ezloadndump.com</a>
    </p>
  </div>
</body>
</html>
    `,
    text: `
Thank You!

Hi ${booking.customerName},

Thank you for choosing Easy Load & Dump for your recent junk removal!

HOW DID WE DO?
We'd love to hear your feedback! Please consider leaving us a review on Google or Facebook.

NEED US AGAIN?
Garage cleanout? Renovation debris? Moving out?
We're here whenever you need us!

Thank you for supporting local business!

Best regards,
The Easy Load & Dump Team
(509) 863-3109
    `
  }),
  
  // Trailer Dropped Off notification
  trailerDroppedOff: (booking) => ({
    subject: `🚛 Your Trailer Has Been Delivered! - ${booking.preferredDate}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <h2 style="color: #155724; margin: 0;">🚛 Trailer Delivered!</h2>
    </div>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    <p>Great news! Your dump trailer has been <strong>delivered to your location</strong> and is ready to load!</p>
    
    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1a1a1a;">📍 Delivery Details</h3>
      <p><strong>Address:</strong> ${booking.address}</p>
      <p><strong>Rental Duration:</strong> ${booking.rentalDuration} Hours</p>
      <p><strong>Load Type:</strong> ${booking.loadType}</p>
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #856404;">📝 Quick Tips:</h4>
      <ul style="margin: 0; padding-left: 20px; color: #856404;">
        <li>Load items evenly to distribute weight</li>
        <li>Don't overfill - keep items below the trailer walls</li>
        <li>Avoid hazardous materials (paint, chemicals, batteries)</li>
        <li>Call us when you're done loading!</li>
      </ul>
    </div>
    
    <p>When you're finished loading, give us a call and we'll come pick it up!</p>
    
    <p>
      📞 <a href="tel:+15098633109" style="color: #1a1a1a; font-size: 18px; font-weight: bold;">(509) 863-3109</a>
    </p>
    
    <p style="margin-bottom: 0;">
      Happy loading!<br>
      <strong>The Easy Load & Dump Team</strong>
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      Easy Load & Dump | Spokane, WA<br>
      <a href="https://ezloadndump.com" style="color: #999;">www.ezloadndump.com</a>
    </p>
  </div>
</body>
</html>
    `,
    text: `
TRAILER DELIVERED! 🚛

Hi ${booking.customerName},

Great news! Your dump trailer has been delivered to your location and is ready to load!

DELIVERY DETAILS:
- Address: ${booking.address}
- Rental Duration: ${booking.rentalDuration} Hours
- Load Type: ${booking.loadType}

QUICK TIPS:
- Load items evenly to distribute weight
- Don't overfill - keep items below the trailer walls
- Avoid hazardous materials (paint, chemicals, batteries)
- Call us when you're done loading!

When you're finished loading, give us a call: (509) 863-3109

Happy loading!
The Easy Load & Dump Team
    `
  }),
  
  // Trailer Picked Up notification
  trailerPickedUp: (booking) => ({
    subject: `✅ Trailer Picked Up - We're Hauling It Away!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <div style="background: #e7f3ff; border: 2px solid #0066cc; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0066cc; margin: 0;">✅ Trailer Picked Up!</h2>
    </div>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    <p>We've picked up your loaded trailer and we're on our way to dump it!</p>
    
    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1a1a1a;">📋 Job Summary</h3>
      <p><strong>Service Date:</strong> ${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p><strong>Address:</strong> ${booking.address}</p>
      <p><strong>Load Type:</strong> ${booking.loadType}</p>
    </div>
    
    <p>We'll send you a final confirmation once the job is complete!</p>
    
    <p>Questions? Give us a call:</p>
    <p>
      📞 <a href="tel:+15098633109" style="color: #1a1a1a;">(509) 863-3109</a>
    </p>
    
    <p style="margin-bottom: 0;">
      Thank you for choosing Easy Load & Dump!<br>
      <strong>The Easy Load & Dump Team</strong>
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      Easy Load & Dump | Spokane, WA<br>
      <a href="https://ezloadndump.com" style="color: #999;">www.ezloadndump.com</a>
    </p>
  </div>
</body>
</html>
    `,
    text: `
TRAILER PICKED UP! ✅

Hi ${booking.customerName},

We've picked up your loaded trailer and we're on our way to dump it!

JOB SUMMARY:
- Service Date: ${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
- Address: ${booking.address}
- Load Type: ${booking.loadType}

We'll send you a final confirmation once the job is complete!

Questions? Call us: (509) 863-3109

Thank you for choosing Easy Load & Dump!
The Easy Load & Dump Team
    `
  }),
  
  // Job Completed notification
  jobCompletedNotification: (booking) => ({
    subject: `🎉 Job Complete - Thank You! - ${booking.preferredDate}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="Easy Load & Dump" style="max-width: 200px; height: auto;" />
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
    <div style="background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
      <h2 style="color: #155724; margin: 0;">🎉 Job Complete!</h2>
      <p style="color: #155724; margin: 10px 0 0 0;">Your junk has been hauled away!</p>
    </div>
    
    <p>Hi <strong>${booking.customerName}</strong>,</p>
    
    <p>Great news! Your dump trailer job is <strong>100% complete</strong>. Your junk has been properly disposed of and you can enjoy your clean space!</p>
    
    <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1a1a1a;">📋 Final Summary</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Service Date:</td>
          <td style="padding: 8px 0; font-weight: bold;">${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Address:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Load Type:</td>
          <td style="padding: 8px 0; font-weight: bold;">${booking.loadType}</td>
        </tr>
        <tr style="border-top: 2px solid #ddd;">
          <td style="padding: 12px 0; color: #666; font-size: 18px;">Total:</td>
          <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #16a34a;">$${booking.finalPrice || booking.estimatedPrice}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #856404;">⭐ How Did We Do?</h3>
      <p style="color: #856404;">We'd love your feedback! A quick review helps us improve and helps others find our service.</p>
      <p style="font-size: 28px; margin: 10px 0;">⭐⭐⭐⭐⭐</p>
    </div>
    
    <div style="background: #e7f3ff; border: 1px solid #0066cc; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0066cc;">🔄 Need Us Again?</h4>
      <p style="margin: 0; color: #0066cc;">
        Garage cleanout? Renovation debris? Moving out?<br>
        We're always here to help - just give us a call!
      </p>
    </div>
    
    <p>Thank you for choosing Easy Load & Dump. We truly appreciate your business!</p>
    
    <p style="margin-bottom: 0;">
      Best regards,<br>
      <strong>The Easy Load & Dump Team</strong><br>
      📞 (509) 863-3109
    </p>
  </div>
  
  <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
    <p style="color: #999; margin: 0; font-size: 12px;">
      Easy Load & Dump | Spokane, WA<br>
      <a href="https://ezloadndump.com" style="color: #999;">www.ezloadndump.com</a>
    </p>
  </div>
</body>
</html>
    `,
    text: `
JOB COMPLETE! 🎉

Hi ${booking.customerName},

Great news! Your dump trailer job is 100% complete. Your junk has been properly disposed of!

FINAL SUMMARY:
- Service Date: ${new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
- Address: ${booking.address}
- Load Type: ${booking.loadType}
- Total: $${booking.finalPrice || booking.estimatedPrice}

HOW DID WE DO?
We'd love your feedback! A quick review helps us improve and helps others find our service.

NEED US AGAIN?
Garage cleanout? Renovation debris? Moving out?
We're always here to help - just give us a call!

Thank you for choosing Easy Load & Dump!
(509) 863-3109
    `
  })
};

// Send email function
export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    console.log('Email not configured. Would have sent:', { to, subject });
    return { success: false, error: 'Email not configured', demo: true };
  }

  try {
    const transport = getTransporter();
    
    const result = await transport.sendMail({
      from: `"${defaultFrom.name}" <${defaultFrom.email}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

// Send booking confirmation email
export async function sendBookingConfirmation(booking) {
  const template = emailTemplates.bookingConfirmation(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Send day-of reminder email
export async function sendDayOfReminder(booking) {
  const template = emailTemplates.dayOfReminder(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Send job completed email
export async function sendJobCompletedEmail(booking) {
  const template = emailTemplates.jobCompleted(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Send trailer dropped off notification
export async function sendTrailerDroppedOffEmail(booking) {
  const template = emailTemplates.trailerDroppedOff(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Send trailer picked up notification
export async function sendTrailerPickedUpEmail(booking) {
  const template = emailTemplates.trailerPickedUp(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Send job completed notification (with review request)
export async function sendJobCompletedNotification(booking) {
  const template = emailTemplates.jobCompletedNotification(booking);
  return sendEmail({
    to: booking.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

// Test email connection
export async function testEmailConnection() {
  if (!isEmailConfigured()) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    return { success: true, message: 'SMTP connection successful' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default {
  sendEmail,
  sendBookingConfirmation,
  sendDayOfReminder,
  sendJobCompletedEmail,
  sendTrailerDroppedOffEmail,
  sendTrailerPickedUpEmail,
  sendJobCompletedNotification,
  testEmailConnection,
  isEmailConfigured,
  emailTemplates,
};
