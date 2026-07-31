const Faq         = require('../models/Faq');
const Facility    = require('../models/Facility');
const News        = require('../models/News');
const HealthTip   = require('../models/HealthTip');
const Insurance   = require('../models/Insurance');
const Testimonial = require('../models/Testimonial');
const Enquiry     = require('../models/Enquiry');
const Contact     = require('../models/Contact');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail    = require('../utils/sendEmail');

// ── GET /api/faqs ─────────────────────────────────────────────────────────────
const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await Faq.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  const categories = [...new Set(faqs.map(f => f.category))];
  res.status(200).json({ success: true, faqs, categories });
});

// ── GET /api/facilities ───────────────────────────────────────────────────────
const getFacilities = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({ isActive: true }).lean();
  res.status(200).json({ success: true, count: facilities.length, facilities });
});

// ── GET /api/news?limit=6 ─────────────────────────────────────────────────────
const getNews = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
  const query = News.find({ isActive: true }).sort({ date: -1, createdAt: -1 });
  if (limit > 0) query.limit(limit);
  const news = await query.lean();
  res.status(200).json({ success: true, count: news.length, news });
});

// ── GET /api/health-tips?limit=6 ─────────────────────────────────────────────
const getHealthTips = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
  const query = HealthTip.find({ isActive: true }).sort({ date: -1, createdAt: -1 });
  if (limit > 0) query.limit(limit);
  const tips = await query.lean();
  res.status(200).json({ success: true, count: tips.length, healthTips: tips });
});

// ── GET /api/insurance-partners ───────────────────────────────────────────────
const getInsurancePartners = asyncHandler(async (req, res) => {
  const partners = await Insurance.find({ isActive: true }).lean();
  res.status(200).json({ success: true, count: partners.length, partners });
});

// ── GET /api/testimonials ─────────────────────────────────────────────────────
const getTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({ success: true, count: testimonials.length, testimonials });
});

// ── POST /api/enquiry ─────────────────────────────────────────────────────────
const submitEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, department, appointmentType, preferredDate, message } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, message: 'Phone number is required.' });
  }

  const enquiry = await Enquiry.create({
    name:            name.trim(),
    email:           email           || '',
    phone:           phone.trim(),
    department:      department      || '',
    appointmentType: appointmentType || '',
    preferredDate:   preferredDate   || '',
    message:         message         || '',
  });

  // Send acknowledgement (non-fatal)
  if (email && email.trim()) {
    sendEmail({
      to:      email.trim(),
      subject: 'HMS — Enquiry Received',
      html: `
        <p>Dear ${name},</p>
        <p>We have received your enquiry and our team will contact you within 24 hours.</p>
        <p>Reference: <strong>${enquiry.reference}</strong></p>
        <p>Thank you for choosing HMS Medical Centre.</p>
      `,
    }).catch(err => console.warn('[submitEnquiry] Email failed:', err.message));
  }

  res.status(201).json({
    success:   true,
    message:   'Your enquiry has been received. Our team will contact you within 24 hours.',
    reference: enquiry.reference,
    enquiry,
  });
});

// ── POST /api/contact ─────────────────────────────────────────────────────────
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const missing = [];
  if (!name    || !name.trim())    missing.push('name');
  if (!email   || !email.trim())   missing.push('email');
  if (!subject || !subject.trim()) missing.push('subject');
  if (!message || !message.trim()) missing.push('message');

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Required fields missing: ${missing.join(', ')}.`,
    });
  }

  const contact = await Contact.create({
    name:    name.trim(),
    email:   email.trim(),
    phone:   phone   || '',
    subject: subject.trim(),
    message: message.trim(),
  });

  // Send acknowledgement (non-fatal)
  sendEmail({
    to:      email.trim(),
    subject: 'HMS — We received your message',
    html: `
      <p>Dear ${name},</p>
      <p>Thank you for contacting HMS Medical Centre. We will get back to you within 24 hours.</p>
      <p>Your message: <em>"${subject}"</em></p>
    `,
  }).catch(err => console.warn('[submitContact] Email failed:', err.message));

  res.status(201).json({
    success: true,
    message: 'Message sent successfully. We will get back to you within 24 hours.',
    contact,
  });
});

// ── GET /api/hospital-stats ───────────────────────────────────────────────────
const getHospitalStats = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    stats: [
      { id: 'stat1', label: 'Specialist Doctors', value: 200,   suffix: '+', icon: 'FaUserMd',   color: '#1565C0' },
      { id: 'stat2', label: 'Departments',         value: 20,    suffix: '',  icon: 'FaHospital',  color: '#00897B' },
      { id: 'stat3', label: 'Happy Patients',      value: 50000, suffix: '+', icon: 'FaSmile',     color: '#F57C00' },
      { id: 'stat4', label: 'Years of Care',        value: 25,    suffix: '+', icon: 'FaCalendar',  color: '#E53935' },
      { id: 'stat5', label: 'ICU Beds',             value: 55,    suffix: '',  icon: 'FaBed',       color: '#37474F' },
      { id: 'stat6', label: 'Success Rate',         value: 98,    suffix: '%', icon: 'FaTrophy',    color: '#2E7D32' },
    ],
  });
});

module.exports = {
  getFaqs,
  getFacilities,
  getNews,
  getHealthTips,
  getInsurancePartners,
  getTestimonials,
  submitEnquiry,
  submitContact,
  getHospitalStats,
};
