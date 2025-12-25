const User = require('../models/user');
const jwt = require("jsonwebtoken");
const { sendResponse } = require('../utilities/helping_functions');


// basic authentication
// purpose of auth is to allow users to only access their own resources (So they can't interfere in each other's work)
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByIdAndToken(decoded._id, token, decoded.onlyToRecoverPassword);
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        sendResponse(res, 401, { 'message': 'Not authorized to access this resource' });
    }
};

const forgetPasswordAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findAndVerifyForgetPasswordToken(decoded, token);
        if (!user) {
            throw new Error();
        }
        req.user = user;
        next();
    } catch (error) {
        sendResponse(res, 401, { 'message': 'Not authorized to access this resource' });
    }
};

module.exports = { auth, forgetPasswordAuth }
