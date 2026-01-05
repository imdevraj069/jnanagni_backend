import User from "../models/user.model.js";
import { Event } from "../models/event.model.js";
import { Registration } from "../models/registration.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// --- DASHBOARD OVERVIEW STATS ---
export const getDashboardStats = asyncHandler(async (req, res) => {
    // Run all count queries in parallel for performance
    const [
        totalUsers, 
        totalEvents, 
        totalRegistrations, 
        pendingPayments
    ] = await Promise.all([
        User.countDocuments({}),
        Event.countDocuments({}),
        Registration.countDocuments({}),
        User.countDocuments({ paymentStatus: { $in: ['pending', 'none'] }, role: 'student' }) // Adjust filter as needed
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            totalUsers,
            totalEvents,
            totalRegistrations,
            pendingPayments
        }, "Dashboard stats fetched successfully")
    );
});

// --- ANALYTICS DATA (FOR CHARTS) ---
export const getAnalyticsData = asyncHandler(async (req, res) => {
    
    // 1. User Growth (Group by CreatedAt Month)
    const userGrowth = await User.aggregate([
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } },
        { $limit: 6 } // Last 6 months
    ]);

    // 2. Registrations by Event Category
    const registrationsByCategory = await Registration.aggregate([
        {
            $lookup: {
                from: "events",
                localField: "event",
                foreignField: "_id",
                as: "eventDetails"
            }
        },
        { $unwind: "$eventDetails" },
        {
            $lookup: {
                from: "eventcategories",
                localField: "eventDetails.category",
                foreignField: "_id",
                as: "categoryDetails"
            }
        },
        { $unwind: "$categoryDetails" },
        {
            $group: {
                _id: "$categoryDetails.name",
                count: { $sum: 1 }
            }
        }
    ]);

    // 3. Payment Status Distribution
    const paymentStats = await User.aggregate([
        {
            $group: {
                _id: "$paymentStatus",
                count: { $sum: 1 }
            }
        }
    ]);

    // 4. College Distribution (Top 5)
    const collegeStats = await User.aggregate([
        { $match: { college: { $ne: null } } },
        { $group: { _id: "$college", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            userGrowth,
            registrationsByCategory,
            paymentStats,
            collegeStats
        }, "Analytics data fetched successfully")
    );
});