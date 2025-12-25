const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    authTokens: {
        type: [String]
    },
    recoverPasswordToken: {
        type: String
    },
}, { timestamps: true });

userSchema.methods.generateToken = async function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    this.authTokens.push(token);
    await this.save();
    return token;
}

userSchema.statics.findByIdAndToken = async (_id, token, onlyToRecoverPassword) => {
    if (onlyToRecoverPassword) {
        return undefined;
    }
    const user = await User.findOne({ _id, authTokens: token });
    return user;
}

userSchema.methods.logout = async function (token) {
    this.authTokens = this.authTokens.filter((item) => item !== token);
    await this.save();
}

userSchema.methods.generateRecoverPasswordToken = async function () {
    const token = jwt.sign(
        { _id: this._id, onlyToRecoverPassword: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    this.recoverPasswordToken = token;
    await this.save();
    return token;
}

userSchema.statics.findAndVerifyForgetPasswordToken = async (decoded, token) => {
    if (decoded.onlyToRecoverPassword) {
        const user = await User.findOne({ _id: decoded._id, recoverPasswordToken: token });
        return user;
    }
    return undefined;
}

const User = mongoose.model('User', userSchema);
module.exports = User;