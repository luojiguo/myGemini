import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    // Mock success for any input for now, or match specific test user
    console.log(`Login attempt: ${email}`);
    res.json({ success: true, user: { email, name: email.split('@')[0] } });
});

app.post('/api/feedback', async (req, res) => {
    console.log('Received feedback request:', req.body);
    const { feedback, contact } = req.body;
    // Default contact if not provided
    const userContact = contact || 'jayyangluo@sina.com';

    if (!feedback) {
        console.error('Missing feedback content');
        return res.status(400).json({ error: 'Feedback content is required' });
    }

    try {
        const mailOptions = {
            from: process.env.SMTP_USER, // Must be authenticated user (163.com)
            to: process.env.SMTP_USER,   // Delivery address (163.com)
            replyTo: userContact,        // User's email (or default sina.com)
            subject: 'New Feedback from AI Chat App',
            text: `User Feedback:\n${feedback}\n\nContact Info:\n${userContact}`
        };

        console.log(`Sending email to ${mailOptions.to} (Reply-To: ${mailOptions.replyTo})`);

        // Verify connection first
        await transporter.verify();
        console.log('SMTP connection verified');

        await transporter.sendMail(mailOptions);
        console.log('Feedback email sent successfully');
        res.json({ success: true, message: 'Feedback sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send feedback email', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
