const User = require('../models/user');
const crypto = require('crypto');
const { sendResponse } = require('../utilities/helping_functions');
const nodemailer = require('nodemailer');

exports.signin = async (req, res) => {
    const { email, password } = req.body;

    const hashPassword = crypto.createHash('sha256').update(password).digest('base64');
    const user = await User.findOne({ email, password: hashPassword });

    if (user) {
        const authToken = await user.generateToken();
        sendResponse(res, 201, { 'result': 'success', authToken })
    }
    else {
        sendResponse(res, 400, { 'result': 'failed', 'message': 'Credentials are invalid' });
    }
}

exports.signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user) {
            sendResponse(res, 403, { 'result': 'exists', 'message': 'User already exists, please consider to login' });
        }
        else {
            const hashPassword = crypto.createHash('sha256').update(password).digest('base64')
            const user = new User({
                email,
                password: hashPassword
            })
            await user.save();
            const authToken = await user.generateToken();
            sendResponse(res, 201, { 'result': 'success', authToken });
        }
    } catch (err) {
        sendResponse(res, 400, err)
    }
}

exports.logout = async (req, res) => {
    try {
        await req.user.logout(req.token);
        sendResponse(res, 200, { 'result': 'success' });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

exports.sendAuthToken = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            sendResponse(res, 400, { 'message': 'email is required' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            sendResponse(res, 400, { 'message': 'User isn\'t found' });
            return;
        }

        const token = await user.generateRecoverPasswordToken();
        const url = process.env.WEBSITE_URL + '/forget-password/' + token;
        await sendEmail(process.env.email, process.env.password, url, email);

        sendResponse(res, 201, { 'result': 'success' });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

async function sendEmail(user, pass, url, email) {
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user,
                pass
            },
        });

        var mailOptions = {
            from: 'Anno-Historia',
            to: email,
            subject: 'Recover Password',
            html: `
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the link below to reset your password:</p>
            <p><a href="${url}">Reset Password</a></p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br>Anno-Historia</p>
          `,
        };

        await transporter.sendMail(mailOptions);
    }
    catch (err) {
        throw new Error(err);
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            sendResponse(res, 400, { 'message': 'password is required' });
            return;
        }

        req.user.password = crypto.createHash('sha256').update(password).digest('base64');
        req.user.recoverPasswordToken = undefined;
        await req.user.save();

        sendResponse(res, 201, { 'result': 'success' });
    }
    catch (err) {
        sendResponse(res, 500, err);
    }
}

