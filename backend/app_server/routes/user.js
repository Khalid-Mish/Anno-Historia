var express = require('express');
var router = express.Router();
const userCtrl = require('../controllers/user');
const { auth, forgetPasswordAuth } = require('../middleware/authentication');

router.post('/signup', userCtrl.signup);
router.post('/signin', userCtrl.signin);
router.post('/logout', auth, userCtrl.logout);
router.post('/send-recover-password-token', userCtrl.sendAuthToken);
router.post('/reset-password', forgetPasswordAuth, userCtrl.resetPassword);

module.exports = router;
