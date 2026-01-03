import { Event } from "../models/event.model.js";
import { EventCategory } from "../models/eventcategory.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// =========================================================================
// 1. VERIFY CATEGORY LEADERSHIP
// Usage: For Creating Events or Modifying Categories
// Logic: Checks if the user is the 'lead' of the category they are trying to use.
// =========================================================================
export const verifyCategoryOwnership = asyncHandler(async (req, res, next) => {
    // Admin bypass
    if (req.user.role === 'admin' || req.user.specialRoles.includes('admin')) {
        return next();
    }

    // Determine where the ID is coming from
    // 1. Creating an Event? ID is in req.body.categoryId
    // 2. Modifying a Category? ID is in req.params.id
    const categoryId = req.body.categoryId || req.params.id;

    if (!categoryId) {
        throw new ApiError(400, "Category ID is required for ownership check");
    }

    const category = await EventCategory.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Check if the current user is the lead
    if (category.lead.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access Denied: You are not the Lead of this Category.");
    }

    next();
});


// =========================================================================
// 2. VERIFY EVENT AUTHORITY (Coordinators & Leads)
// Usage: For Updating/Deleting Events or managing Sub-resources
// Logic: Admin > Category Lead (of that event) > Coordinator (of that event)
// =========================================================================
export const verifyEventAuthority = asyncHandler(async (req, res, next) => {
    // Admin bypass
    if (req.user.role === 'admin' || req.user.specialRoles.includes('admin')) {
        return next();
    }

    const eventId = req.params.id || req.params.eventId; // Handle different route params

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Populate category to check for Lead status
    const event = await Event.findById(eventId).populate('category');

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const userId = req.user._id.toString();

    // 1. Check if User is the Category Lead for this event
    const isCategoryLead = event.category.lead.toString() === userId;

    // 2. Check if User is in the Coordinators list
    const isCoordinator = event.coordinators.some(id => id.toString() === userId);

    if (!isCategoryLead && !isCoordinator) {
        throw new ApiError(403, "Access Denied: You are not authorized to manage this event.");
    }

    next();
});


// =========================================================================
// 3. VERIFY EVENT STAFF ACCESS (View Only / Volunteers)
// Usage: For Viewing Registrations
// Logic: Admin > Category Lead > Coordinator > Volunteer (of that event)
// =========================================================================
export const verifyEventStaffAccess = asyncHandler(async (req, res, next) => {
    // Admin bypass
    if (req.user.role === 'admin' || req.user.specialRoles.includes('admin')) {
        return next();
    }

    const eventId = req.params.eventId || req.params.id;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    const event = await Event.findById(eventId).populate('category');

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    const userId = req.user._id.toString();

    // 1. Check Category Lead
    const isCategoryLead = event.category.lead.toString() === userId;

    // 2. Check Coordinator
    const isCoordinator = event.coordinators.some(id => id.toString() === userId);

    // 3. Check Volunteer
    const isVolunteer = event.volunteers.some(id => id.toString() === userId);

    if (!isCategoryLead && !isCoordinator && !isVolunteer) {
        throw new ApiError(403, "Access Denied: You are not assigned to this event.");
    }

    next();
});