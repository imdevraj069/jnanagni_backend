import {VolunteerRequest} from '../models/volunteerRequest.model.js';
import {Event} from '../models/event.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper: Auto-add volunteer to event volunteers list
const addVolunteerToEventInternal = async (userId, eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (event && !event.volunteers.includes(userId)) {
      event.volunteers.push(userId);
      await event.save();
    }
  } catch (err) {
    // Don't throw - non-critical operation
  }
};

// 1. Student submits volunteer request
export const submitVolunteerRequest = asyncHandler(async (req, res) => {
  let formData = req.body;
  const userId = req.user.id;
  const eventId = await req.params.eventId;

  if (!eventId) {
    throw new ApiError(400, 'Event ID is required');
  }

  // Parse FormData if string
  if (typeof formData === 'string') {
    try {
      formData = JSON.parse(formData);
    } catch (e) {
      formData = {};
    }
  }

  // Validate event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Check if user already submitted request for this event
  const existing = await VolunteerRequest.findOne({
    user: userId,
    event: eventId,
  });

  let request;

  if (existing) {
    // Update existing request (reset status to pending on re-submit)
    existing.formData = formData;
    existing.status = 'pending';
    existing.adminNote = undefined;
    request = await existing.save();
  } else {
    // Create new request
    request = await VolunteerRequest.create({
      user: userId,
      event: eventId,
      formData: formData || {},
    });
  }

  return res.status(201).json(
    new ApiResponse(201, request, 'Volunteer request submitted successfully')
  );
});

// 2. Get requests for a single event (Admin/Lead/Coordinator/Volunteer)
export const getVolunteerRequestsByEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const requests = await VolunteerRequest.find({ event: eventId })
    .populate('user', 'name email jnanagniId contactNo college')
    .populate('event', 'name date')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalDocs = await VolunteerRequest.countDocuments({ event: eventId });

  return res.status(200).json(
    new ApiResponse(200, {
      requests,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
      },
    }, 'Volunteer requests fetched successfully')
  );
});

// 3. Approve/Reject request (Admin/Lead/Coordinator Only)
export const updateVolunteerRequestStatus = asyncHandler(async (req, res) => {
  const requestId = req.params.id;
  const { status, adminNote } = req.body;

  // Validate status
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const request = await VolunteerRequest.findById(requestId)
    .populate('user', 'name email')
    .populate({
      path: 'event',
      populate: { path: 'category' },
    });

  if (!request) {
    throw new ApiError(404, 'Volunteer request not found');
  }

  // Update status
  request.status = status;
  if (adminNote !== undefined) {
    request.adminNote = adminNote;
  }
  await request.save();

  // Auto-add volunteer to event on approval
  if (status === 'approved') {
    await addVolunteerToEventInternal(request.user._id, request.event._id);
  }

  return res.status(200).json(
    new ApiResponse(200, request, `Volunteer request ${status} successfully`)
  );
});

// 4. Get my volunteer requests (Student Only)
export const getMyVolunteerRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const requests = await VolunteerRequest.find({ user: userId })
    .populate('event', 'name date venue category')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, requests, 'Your volunteer requests fetched successfully')
  );
});
