const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Store OTP temporarily
const otpStore = {};

// ===============================
// EMAIL CONFIGURATION
// ===============================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// ===============================
// TEST SERVER
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "GovtConnect OTP server is running"
    });
});


// ===============================
// SEND OTP
// ===============================

app.post("/send-otp", async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Generate 6 digit OTP
        const otp =
            Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP
        otpStore[email] = {
            otp: otp,
            expires: Date.now() + 5 * 60 * 1000
        };

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "GovtConnect Email Verification OTP",

            text:
`Your GovtConnect verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.`
        });

        console.log("OTP sent to:", email);

        res.json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (error) {

        console.log("Email error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to send OTP"
        });

    }

});


// ===============================
// VERIFY OTP
// ===============================

app.post("/verify-otp", (req, res) => {

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
    }

    const savedOTP = otpStore[email];

    if (!savedOTP) {
        return res.status(400).json({
            success: false,
            message: "OTP not found. Please request a new OTP."
        });
    }

    // Check expiration
    if (Date.now() > savedOTP.expires) {

        delete otpStore[email];

        return res.status(400).json({
            success: false,
            message: "OTP expired. Please request a new OTP."
        });
    }

    // Check OTP
    if (savedOTP.otp !== otp.toString()) {

        return res.status(400).json({
            success: false,
            message: "Incorrect OTP"
        });
    }

    // OTP correct
    delete otpStore[email];

    res.json({
        success: true,
        message: "Email verified successfully"
    });

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

    console.log(
        `GovtConnect OTP server running on http://localhost:${PORT}`
    );

});