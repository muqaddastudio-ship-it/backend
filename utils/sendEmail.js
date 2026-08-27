const { Resend } = require('resend');
const nodemailer = require('nodemailer');

/**
 * Universal Instant Email Sender
 * Primary: Resend API (HTTPS Port 443 - Instant 0.2s delivery on Render & Cloud)
 * Fallback: Nodemailer Gmail SMTP
 */
const dispatchEmail = async ({ to, subject, html, fromName = 'Muqaddas Studio' }) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  // Method 1: Resend API (Primary - Instant on Render/Cloud with verified domain)
  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const resend = new Resend(apiKey);
      const fromEmail = (process.env.RESEND_FROM_EMAIL || 'orders@muqaddastudio.store').trim();
      
      const result = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      });

      if (!result.error) {
        console.log(`⚡ [Resend Instant] Email delivered to ${to} (Message ID: ${result.data?.id})`);
        return result;
      }
      console.error(`⚠️ [Resend Error] ${result.error.message}. Switching to Gmail SMTP fallback...`);
    } catch (err) {
      console.error(`⚠️ [Resend Exception] ${err.message}. Switching to Gmail SMTP fallback...`);
    }
  }

  // Method 2: Nodemailer Gmail SMTP (Backup with short timeout so it never hangs)
  const rawPass = (process.env.SMTP_PASS || 'fyll hpvm ters vlwk').replace(/\s+/g, '');
  const userEmail = (process.env.SMTP_USER || 'muqaddastudio@gmail.com').trim();

  if (userEmail && rawPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        connectionTimeout: 5000, // 5s timeout max
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
          user: userEmail,
          pass: rawPass
        }
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${userEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html
      });
      
      console.log(`✅ [Gmail SMTP] Email delivered to ${to} (ID: ${info.messageId})`);
      return info;
    } catch (err) {
      console.error(`❌ [Gmail SMTP Error] ${err.message}`);
    }
  }
};

/**
 * Send Order Confirmation email to Customer
 */
const sendCustomerOrderEmail = async (order, customerEmail) => {
  if (!customerEmail || !customerEmail.includes('@')) {
    console.error('❌ Cannot send customer order email: Invalid customer email address:', customerEmail);
    return;
  }

  // Use live domain for email tracking link so it opens on all devices/browsers
  const clientUrl = (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'))
    ? process.env.CLIENT_URL.split(',')[0].trim()
    : 'https://muqaddastudio.store';
  const trackingUrl = `${clientUrl}/track-order?id=${order.trackingId || order._id}`;

  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
        <img src="${item.image}" alt="${item.name}" width="50" height="65" style="object-fit: cover; border-radius: 4px; vertical-align: middle; margin-right: 10px;" />
        <strong>${item.name}</strong><br/>
        <span style="font-size: 12px; color: #666;">Size: ${item.size} | Color: ${item.color || 'Default'}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${item.qty}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: bold;">PKR ${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; color: #111111;">
      <!-- Header -->
      <div style="background: #0a0904; padding: 30px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 26px; margin: 0; letter-spacing: 4px; text-transform: uppercase;">MUQADDAS STUDIO</h1>
        <p style="color: #cccccc; font-size: 11px; letter-spacing: 3px; margin-top: 5px; text-transform: uppercase;">Refined Pakistani Couture</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h2 style="font-size: 20px; color: #111111; margin-top: 0;">Order Confirmation — Thank You!</h2>
        <p style="font-size: 14px; color: #444444; line-height: 1.6;">
          Dear <strong>${order.shippingAddress.name}</strong>,<br/>
          Aap ka order successfully place ho gaya hai! We are quality inspecting your parcel for dispatch via ${order.courier || 'TCS Express'}.
        </p>

        <!-- Tracking Box -->
        <div style="background: #faf7f2; border: 1px dashed #c9a84c; border-radius: 6px; padding: 18px; margin: 20px 0; text-align: center;">
          <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</span>
          <div style="font-size: 22px; font-weight: bold; color: #0a0904; letter-spacing: 2px; margin: 6px 0;">${order.trackingId || order._id}</div>
          <span style="font-size: 12px; color: #888888;">Courier: ${order.courier || 'TCS Express'} | Expected Delivery: ${order.estimatedDelivery || '3-4 Days'}</span><br/><br/>
          <a href="${trackingUrl}" style="background: #0a0904; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px; display: inline-block;">TRACK YOUR PARCEL NOW</a>
        </div>

        <!-- Order Items -->
        <h3 style="font-size: 16px; border-bottom: 2px solid #111; padding-bottom: 6px; margin-top: 25px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f9f9f9; text-align: left;">
              <th style="padding: 10px;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="margin-top: 20px; text-align: right; font-size: 14px; line-height: 1.8;">
          <p style="margin: 4px 0;">Subtotal: <strong>PKR ${order.subtotal.toLocaleString()}</strong></p>
          <p style="margin: 4px 0;">Shipping Fee: <strong>${order.shippingFee === 0 ? 'FREE' : `PKR ${order.shippingFee}`}</strong></p>
          <p style="margin: 8px 0; font-size: 18px; color: #0a0904;">Total Amount (COD): <strong>PKR ${order.total.toLocaleString()}</strong></p>
        </div>

        <!-- Shipping Info -->
        <div style="background: #f9f9f9; border-radius: 6px; padding: 15px; margin-top: 25px; font-size: 13px;">
          <strong style="color: #0a0904;">Delivery Address:</strong><br/>
          ${order.shippingAddress.name}<br/>
          ${order.shippingAddress.street}, ${order.shippingAddress.city}<br/>
          Phone: ${order.shippingAddress.phone}<br/>
          Payment Method: Cash on Delivery (COD)
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777777;">
        <p style="margin: 0;">Muqaddas Studio — Luxury Pakistani Women's Fashion</p>
        <p style="margin: 5px 0 0 0;">Need help? Email us at <a href="mailto:muqaddastudio@gmail.com" style="color: #111;">muqaddastudio@gmail.com</a></p>
      </div>
    </div>
  `;

  return await dispatchEmail({
    to: customerEmail,
    subject: `🛍️ Order Placed! Confirmation #${order.trackingId || order._id} — Muqaddas Studio`,
    html: htmlContent,
    fromName: 'Muqaddas Studio Orders'
  });
};

/**
 * Send New Order Notification email to Admin (muqaddastudio@gmail.com)
 */
const sendAdminOrderEmail = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'muqaddastudio@gmail.com';

  const itemsText = order.items.map(item => `- ${item.name} (${item.size}) x${item.qty} = PKR ${(item.price * item.qty).toLocaleString()}`).join('<br/>');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dddddd; padding: 25px; border-radius: 8px;">
      <h2 style="color: #b8902e; margin-top: 0;">🎉 NEW ORDER RECEIVED!</h2>
      <p style="font-size: 15px; color: #222222;">
        A new order has been placed on <strong>Muqaddas Studio</strong>. Please prepare for dispatch.
      </p>

      <div style="background: #f7f7f7; padding: 15px; border-left: 4px solid #b8902e; margin: 15px 0;">
        <strong>Tracking ID:</strong> ${order.trackingId || order._id}<br/>
        <strong>Customer Name:</strong> ${order.shippingAddress.name}<br/>
        <strong>Customer Phone:</strong> ${order.shippingAddress.phone}<br/>
        <strong>Customer Email:</strong> ${order.guestEmail || (order.user ? order.user.email : 'N/A')}<br/>
        <strong>Delivery City:</strong> ${order.shippingAddress.city}<br/>
        <strong>Full Address:</strong> ${order.shippingAddress.street}<br/>
        <strong>Payment Method:</strong> Cash on Delivery (COD)<br/>
        <strong>Total Order Value:</strong> <span style="color: #008000; font-size: 16px; font-weight: bold;">PKR ${order.total.toLocaleString()}</span>
      </div>

      <h3>Ordered Items:</h3>
      <div style="background: #fff; border: 1px solid #eee; padding: 12px; font-size: 14px; line-height: 1.6;">
        ${itemsText}
      </div>

      <p style="margin-top: 20px; font-size: 13px; color: #666666;">
        Log in to your Admin Dashboard to update order status or dispatch courier tracking.
      </p>
    </div>
  `;

  return await dispatchEmail({
    to: adminEmail,
    subject: `🚨 NEW ORDER ALERT #${order.trackingId || order._id} — PKR ${order.total.toLocaleString()} (${order.shippingAddress.city})`,
    html: htmlContent,
    fromName: 'Muqaddas Admin Alert'
  });
};

/**
 * Send Order Status Update email to Customer
 */
const sendOrderStatusUpdateEmail = async (order, newStatus, customerEmail) => {
  if (!customerEmail || !customerEmail.includes('@')) {
    console.error('❌ Cannot send status update email: Invalid customer email address:', customerEmail);
    return;
  }

  const clientUrl = (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'))
    ? process.env.CLIENT_URL.split(',')[0].trim()
    : 'https://muqaddastudio.store';
  const trackingUrl = `${clientUrl}/track-order?id=${order.trackingId || order._id}`;

  const statusConfig = {
    confirmed: {
      emoji: '✨',
      title: 'Order Confirmed & Quality Checked',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      desc: `Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br/>Aap ka order successfully <strong>Confirm</strong> ho gaya hai aur quality inspection mukammal ho chuki hai. Hamara studio team jald parcel courier ko hand over kar raha hai.`
    },
    shipped: {
      emoji: '🚚',
      title: 'Parcel Dispatched & On Its Way!',
      badgeBg: '#f3e8ff',
      badgeColor: '#7e22ce',
      desc: `Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br/>Great news! Aap ka parcel dispatch kar diya gaya hai via <strong>${order.courier || 'TCS Express'}</strong>. Expected delivery time <strong>${order.estimatedDelivery || '2-3 Business Days'}</strong> hai.`
    },
    delivered: {
      emoji: '🎉',
      title: 'Order Delivered Successfully!',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      desc: `Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br/>Aap ka parcel successfully deliver ho chuka hai. Umeed hai aapko Muqaddas Studio ke kapray aur stitching pasand aayi hogi! Thank you for trusting us.`
    },
    cancelled: {
      emoji: '⚠️',
      title: 'Order Cancelled',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
      desc: `Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br/>Aap ka order #${order.trackingId || order._id} cancel kar diya gaya hai. Agar aapko koi sawal ho to hamare helpline par rabta karein.`
    }
  };

  const currentCfg = statusConfig[newStatus] || {
    emoji: '📦',
    title: `Order Status Updated: ${newStatus.toUpperCase()}`,
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    desc: `Dear <strong>${order.shippingAddress?.name || 'Customer'}</strong>,<br/>Aap ke order ka status update ho kar <strong>${newStatus}</strong> ho gaya hai.`
  };

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; color: #111111;">
      <!-- Header -->
      <div style="background: #0a0904; padding: 30px; text-align: center;">
        <h1 style="color: #c9a84c; font-size: 26px; margin: 0; letter-spacing: 4px; text-transform: uppercase;">MUQADDAS STUDIO</h1>
        <p style="color: #cccccc; font-size: 11px; letter-spacing: 3px; margin-top: 5px; text-transform: uppercase;">Refined Pakistani Couture</p>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background: ${currentCfg.badgeBg}; color: ${currentCfg.badgeColor}; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding: 6px 16px; border-radius: 20px;">
            ${newStatus.toUpperCase()}
          </span>
          <h2 style="font-size: 22px; color: #111111; margin: 12px 0 6px 0;">${currentCfg.title}</h2>
        </div>

        <p style="font-size: 14px; color: #444444; line-height: 1.6;">
          ${currentCfg.desc}
        </p>

        <!-- Tracking Card -->
        <div style="background: #faf7f2; border: 1px dashed #c9a84c; border-radius: 6px; padding: 18px; margin: 25px 0; text-align: center;">
          <span style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</span>
          <div style="font-size: 22px; font-weight: bold; color: #0a0904; letter-spacing: 2px; margin: 6px 0;">${order.trackingId || order._id}</div>
          <span style="font-size: 12px; color: #888888;">Courier: ${order.courier || 'TCS Express'} | Total: PKR ${(order.total || 0).toLocaleString()} (COD)</span><br/><br/>
          <a href="${trackingUrl}" style="background: #0a0904; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; letter-spacing: 1px; display: inline-block;">TRACK LIVE STATUS NOW</a>
        </div>

        <!-- Delivery Address Recap -->
        <div style="background: #f9f9f9; border-radius: 6px; padding: 15px; margin-top: 20px; font-size: 13px;">
          <strong style="color: #0a0904;">Destination Address:</strong><br/>
          ${order.shippingAddress?.name}<br/>
          ${order.shippingAddress?.street}, ${order.shippingAddress?.city}<br/>
          Phone: ${order.shippingAddress?.phone}
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777777;">
        <p style="margin: 0;">Muqaddas Studio — Luxury Pakistani Women's Fashion</p>
        <p style="margin: 5px 0 0 0;">WhatsApp / Email Support: <a href="mailto:muqaddastudio@gmail.com" style="color: #111;">muqaddastudio@gmail.com</a></p>
      </div>
    </div>
  `;

  return await dispatchEmail({
    to: customerEmail,
    subject: `${currentCfg.emoji} Order Update #${order.trackingId || order._id} is now ${newStatus.toUpperCase()} — Muqaddas Studio`,
    html: htmlContent,
    fromName: 'Muqaddas Studio'
  });
};

module.exports = {
  dispatchEmail,
  sendCustomerOrderEmail,
  sendAdminOrderEmail,
  sendOrderStatusUpdateEmail
};
