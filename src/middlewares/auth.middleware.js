import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/user.model.js';

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        throw new ApiError(401, 'Not authorized to access this route');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BLACKBIRDCODELABS');

        // Check if user still exists
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
             throw new ApiError(401, 'User no longer exists');
        }

        next();
    } catch (err) {
        throw new ApiError(401, 'Not authorized to access this route');
    }
});