const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");


const isVerifiedUser = async (req, res, next) => {
    try{

        const { accessToken } = req.cookies;
        
        if(!accessToken){
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(accessToken, config.accessTokenSecret);

        const user = await User.findById(decodeToken._id);
        if(!user){
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        req.user = user;
        next();

    }catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
}

// Role-based access control middleware
const isAdminOrCashier = async (req, res, next) => {
    try {
        // Ensure user is verified first
        if (!req.user) {
            const error = createHttpError(401, "User not authenticated!");
            return next(error);
        }

        const allowedRoles = ["admin", "cashier"];
        
        if (!allowedRoles.includes(req.user.role)) {
            const error = createHttpError(403, "Access denied! Only admin and cashier can view transactions.");
            return next(error);
        }

        next();
    } catch (error) {
        const err = createHttpError(500, "Authorization error!");
        next(err);
    }
}

module.exports = { isVerifiedUser, isAdminOrCashier };