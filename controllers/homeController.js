// controllers/homeController.js
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const ContactMessage = require("../models/ContactMessage");
const { sendEmail } = require("../utils/emailSender");

/**
 * @swagger
 * tags:
 *   name: Home Page API
 *   description: Endpoints for home page features
 */

/**
 * @swagger
 * /api/home/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Home Page API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully subscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thank you for subscribing to our newsletter!
 *       400:
 *         description: Invalid input or already subscribed
 *       500:
 *         description: Server error
 */
exports.subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    if (existingSubscriber) {
      return res
        .status(400)
        .json({ message: "This email is already subscribed" });
    }

    // Create new subscriber
    const subscriber = new NewsletterSubscriber({ email });
    await subscriber.save();

    // Send confirmation email with logo at top
    await sendEmail({
      to: email,
      subject: "Thanks for Subscribing to ATIGS Network",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.atigsnetwork.org/logo.png" alt="ATIGS Network Logo" style="max-width: 200px; height: auto;">
          </div>
          <h2 style="color: #2c3e50; text-align: center;">Welcome to ATIGS Network Updates</h2>
          <p style="text-align: center;">You've successfully subscribed to our newsletter.</p>
          <p style="text-align: center;">You'll now receive the latest trade news, market updates, and industry insights.</p>
          <p style="text-align: center; font-size: 0.9em; color: #7f8c8d;">
            If you didn't request this subscription, please ignore this email.
          </p>
        </div>
      `,
    });

    res
      .status(200)
      .json({ message: "Thank you for subscribing to our newsletter!" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ message: "Failed to process subscription" });
  }
};

/**
 * @swagger
 * /api/home/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Home Page API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               message:
 *                 type: string
 *                 example: I have questions about membership
 *     responses:
 *       200:
 *         description: Message received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thank you for your message. We'll get back to you soon.
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Save contact message
    const contactMessage = new ContactMessage({
      name,
      email,
      message,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await contactMessage.save();

    // Email template with logo
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.atigsnetwork.org/logo1.png" alt="ATIGS Network Logo" style="max-width: 200px; height: auto;">
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
          {{CONTENT}}
        </div>
        <p style="text-align: center; font-size: 0.8em; color: #7f8c8d; margin-top: 20px;">
          ATIGS Network &copy; ${new Date().getFullYear()}
        </p>
      </div>
    `;

    // Send email to support
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || "support@atigsnetwork.org",
      subject: "New Contact Form Submission",
      html: emailTemplate.replace(
        "{{CONTENT}}",
        `
        <h2 style="color: #2c3e50;">New Contact Message</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${req.ip}</p>
      `
      ),
    });

    // Send confirmation to user
    await sendEmail({
      to: email,
      subject: "Thank You for Contacting ATIGS Network",
      html: emailTemplate.replace(
        "{{CONTENT}}",
        `
        <h2 style="color: #2c3e50;">We've Received Your Message</h2>
        <p>Thank you for reaching out to ATIGS Network. We've received your message and our team will get back to you soon.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <p>For urgent inquiries, you can call us at +233 (853) 123-457 during business hours.</p>
      `
      ),
    });

    res
      .status(200)
      .json({
        message: "Thank you for your message. We'll get back to you soon.",
      });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to submit contact form" });
  }
};

/**
 * @swagger
 * /api/home/join-network:
 *   post:
 *     summary: SJoin Network with full name and email
 *     tags: [Home Page API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Successfully joined network
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Thank you for joining our network!
 *       400:
 *         description: Invalid input or already joined network
 *       500:
 *         description: Server error
 */
exports.joinNetwork = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Validate inputs
    if (!fullName || !email) {
      return res
        .status(400)
        .json({ message: "Please provide both full name and email" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Check if already subscribed
    const existingSubscriber = await NewsletterSubscriber.findOne({ email });
    if (existingSubscriber) {
      return res
        .status(400)
        .json({ message: "This email is already subscribed" });
    }

    // Create new subscriber with name
    const subscriber = new NewsletterSubscriber({
      email,
      fullName,
      subscribedAt: new Date(),
    });
    await subscriber.save();

    // Send confirmation email with personalized message
    await sendEmail({
      to: email,
      subject: "Thanks for Joining ATIGS Network",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.atigsnetwork.org/logo.png" alt="ATIGS Network Logo" style="max-width: 200px; height: auto;">
          </div>
          <h2 style="color: #2c3e50; text-align: center;">Welcome, ${fullName}, to the ATIGS Network Updates</h2>
          <p style="text-align: center;">You've successfully joined our network.</p>
          <p style="text-align: center;">You'll now receive the latest trade news, market updates, and industry insights.</p>
          <p style="text-align: center; font-size: 0.9em; color: #7f8c8d;">
            If you didn't request this subscription, please ignore this email.
          </p>
        </div>
      `,
    });

    res
      .status(200)
      .json({ message: "Thank you for subscribing to our newsletter!" });
  } catch (error) {
    console.error("Newsletter subscription with name error:", error);
    res.status(500).json({ message: "Failed to process subscription" });
  }
};
