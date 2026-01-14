import { Event } from "../models/event.model.js";
import { EventCategory } from "../models/eventcategory.model.js";
import User from "../models/user.model.js";
import { sendRoleAssignmentEmail } from "../services/email.service.js";

// Helper: Update role and send email
const assignRoleAndNotify = async (userId, role, contextName, contextType) => {
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (!user.specialRoles.includes(role)) {
    user.specialRoles.push(role);
    user.specialRoles = user.specialRoles.filter((r) => r !== "None");
    await user.save();
  }

  try {
    await sendRoleAssignmentEmail(user, role, contextName, contextType);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
  }
};

// Helper: Parse JSON from FormData strings
const parseJSON = (data) => {
  if (!data) return [];
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("JSON Parse error:", e);
      return [];
    }
  }
  return data;
};

//  ---- Event Category Controllers (Unchanged) ---- //

export const createEventCategory = async (req, res) => {
  try {
    const { name, description, leaduserId } = req.body;
    
    // Handle Banner Upload
    let bannerPath = null;
    if (req.file && req.file.fieldname === 'banner') {
        bannerPath = req.file.path;
    }

    let slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    let uniqueSlug = slug;
    let counter = 1;
    while (await EventCategory.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newCategory = await EventCategory.create({
      name,
      description,
      slug: uniqueSlug,
      lead: leaduserId,
      banner: bannerPath, // Save Banner
      createdby: req.user._id,
    });

    if (leaduserId) {
      await assignRoleAndNotify(leaduserId, "category_lead", name, "Category");
    }

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating event category", error });
  }
};

export const getAllEventCategories = async (req, res) => {
  try {
    const categories = await EventCategory.find()
      .populate("lead", "name email")
      .populate("createdby", "name email");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event categories", error });
  }
};

export const getEventCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await EventCategory.findById(categoryId)
      .populate("lead", "name email")
      .populate("createdby", "name email");
    if (!category) return res.status(404).json({ message: "Event category not found" });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event category", error });
  }
};

export const updateEventCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updates = { ...req.body };

    // Handle Banner Update
    if (req.file && req.file.fieldname === 'banner') {
        updates.banner = req.file.path;
    }

    if (updates.lead) {
      await assignRoleAndNotify(updates.lead, "category_lead", updates.name || "Updated Category", "Category");
    }

    const updatedCategory = await EventCategory.findByIdAndUpdate(categoryId, updates, { new: true });
    if (!updatedCategory) return res.status(404).json({ message: "Event category not found" });
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating event category", error });
  }
};

export const deleteEventCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existingEventsCount = await Event.countDocuments({ category: categoryId });
    if (existingEventsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It contains ${existingEventsCount} events. Please delete or move them first.`,
      });
    }
    const deletedCategory = await EventCategory.findByIdAndDelete(categoryId);
    if (!deletedCategory) return res.status(404).json({ message: "Event category not found" });
    res.status(200).json({ message: "Event category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event category", error });
  }
};

//  ---- Event Controllers (UPDATED) ---- //

export const createEvent = async (req, res) => {
  try {
    // 1. Handle File Paths
    let posterPath = null;
    let rulesetFilePath = null;
    
    if (req.files) {
        if (req.files.poster) posterPath = req.files.poster[0].path;
        if (req.files.rulesetFile) rulesetFilePath = req.files.rulesetFile[0].path;
    }

    // 2. Extract Body Fields
    // Note: When using FormData, everything comes as strings. 
    // We must use parseJSON for arrays/objects.
    const {
      name,
      description,
      date,
      time,
      venue,
      categoryId,
      rulesetUrl,
      participationType,
      minTeamSize,
      maxTeamSize,
      maxRegistrations,
      coordinatorIds, // Expecting JSON string for array
      volunteerIds,   // Expecting JSON string for array
      // customFields,   // Expecting JSON string for array
      registrationFields,
      memberFields,
      volunteerFields
    } = req.body;

    // 3. Generate Slug
    let slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    let uniqueSlug = slug;
    let counter = 1;
    while (await Event.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // 4. Parse Arrays from JSON strings
    const parsedCoordinators = parseJSON(coordinatorIds);
    const parsedVolunteers = parseJSON(volunteerIds);
    // const parsedCustomFields = parseJSON(customFields);
    const parsedRegistrationFields = parseJSON(registrationFields);
    const parsedMemberFields = parseJSON(memberFields);
    const parsedVolunteerFields = parseJSON(volunteerFields);


    const newEvent = await Event.create({
      name,
      description,
      slug: uniqueSlug,
      date,
      time,
      venue,
      category: categoryId,
      
      // File & URL Fields
      poster: posterPath,
      rulesetFile: rulesetFilePath,
      rulesetUrl: rulesetUrl || "",

      // Logic Config
      participationType: participationType || "solo",
      maxRegistrations: maxRegistrations || 0,
      minTeamSize: participationType === "group" ? (minTeamSize || 2) : 1,
      maxTeamSize: participationType === "group" ? (maxTeamSize || 5) : 1,
      
      // Form Config
      registrationFields: parsedRegistrationFields,
      memberFields: parsedMemberFields,
      // customFields: parsedCustomFields.map((f) => ({
      //     fieldLabel: f.fieldLabel,
      //     fieldType: f.fieldType,
      //     fieldName: f.fieldName,
      //     required: f.required || false,
      //     options: f.options || [],
      // })),
      volunteerFields: parsedVolunteerFields,

      isRegistrationOpen: true,
      createdby: req.user._id,
      
      // Access Control
      coordinators: parsedCoordinators,
      volunteers: parsedVolunteers,
    });

    // 5. Assign Roles & Notify
    for (const coordId of parsedCoordinators) {
      await assignRoleAndNotify(coordId, "event_coordinator", name, "Event");
    }

    for (const volId of parsedVolunteers) {
      await assignRoleAndNotify(volId, "volunteer", name, "Event"); // Fixed role string to 'volunteer'
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Error creating event", error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // 1. Fetch Existing Event (Required for Role Diffing)
    const existingEvent = await Event.findById(eventId);
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2. Prepare Updates Object
    const updates = { ...req.body };

    // 3. Handle File Paths (Only update if new file provided)
    if (req.files) {
        if (req.files.poster) updates.poster = req.files.poster[0].path;
        if (req.files.rulesetFile) updates.rulesetFile = req.files.rulesetFile[0].path;
    }

    // 4. Handle JSON Parsing for FormData updates
    // Parse Arrays from JSON strings
    if (updates.coordinatorIds) updates.coordinators = parseJSON(updates.coordinatorIds);
    if (updates.volunteerIds) updates.volunteers = parseJSON(updates.volunteerIds);
    if (updates.registrationFields) updates.registrationFields = parseJSON(updates.registrationFields);
    if (updates.memberFields) updates.memberFields = parseJSON(updates.memberFields);
    if (updates.volunteerFields) updates.volunteerFields = parseJSON(updates.volunteerFields);

    // Handle category field mapping
    if (updates.categoryId) {
      updates.category = updates.categoryId;
      delete updates.categoryId;
    }

    // Ensure participationType consistency with team sizes
    if (updates.participationType) {
      if (updates.participationType === "solo") {
        updates.minTeamSize = 1;
        updates.maxTeamSize = 1;
      } else if (updates.participationType === "group") {
        // Only set defaults if not explicitly provided
        if (!updates.minTeamSize) updates.minTeamSize = 2;
        if (!updates.maxTeamSize) updates.maxTeamSize = 5;
      }
    }

    // 5. Perform Update
    const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, { new: true })
      .populate("category")
      .populate("createdby", "name email")
      .populate("coordinators", "name email")
      .populate("volunteers", "name email");

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 6. Role Assignment Logic (Diffing)
    // Check for NEW Coordinators
    if (updates.coordinators && Array.isArray(updates.coordinators)) {
      const oldCoordIds = existingEvent.coordinators.map((id) => id.toString());
      const newCoordIds = updates.coordinators.map((id) => id.toString());
      
      const addedCoordinators = newCoordIds.filter((id) => !oldCoordIds.includes(id));
      
      for (const userId of addedCoordinators) {
        console.log(`Assigning event_coordinator role to ${userId}`);
        await assignRoleAndNotify(userId, "event_coordinator", updatedEvent.name, "Event");
      }
    }

    // Check for NEW Volunteers
    if (updates.volunteers && Array.isArray(updates.volunteers)) {
      const oldVolIds = existingEvent.volunteers.map((id) => id.toString());
      const newVolIds = updates.volunteers.map((id) => id.toString());

      const addedVolunteers = newVolIds.filter((id) => !oldVolIds.includes(id));
      
      for (const userId of addedVolunteers) {
        await assignRoleAndNotify(userId, "volunteer", updatedEvent.name, "Event");
      }
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};

// ... (getAllEvents, getEventById, getEventsByCategory, deleteEvent, addCoordinatorToEvent, addVolunteerToEvent remain unchanged) ...

export const getAllEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // FIX 1: Build a filter object based on query params
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const events = await Event.find(filter) // Apply filter
      .populate("category")
      .populate("createdby", "name email")
      .sort({ date: 1, _id: 1 }) 
      .skip(skip)
      .limit(limit);

    const totalDocs = await Event.countDocuments(filter); // Count filtered docs

    res.status(200).json({
      data: events,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
};

// FIX 2: New Controller for Fetching by Slug
export const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Event.findOne({ slug })
      .populate("category")
      .populate("createdby", "name email")
      .populate("coordinators", "name email")
      .populate("volunteers", "name email");
      
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event", error });
  }
};

export const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId)
      .populate("category")
      .populate("createdby", "name email")
      .populate("coordinators", "name email")
      .populate("volunteers", "name email");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error fetching event", error });
  }
};

export const getEventsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({ category: categoryId })
      .populate("category")
      .populate("createdby", "name email")
      // FIX: Added explicit sort here too. Without this, pagination is random.
      .sort({ date: 1, _id: 1 }) 
      .skip(skip)
      .limit(limit);

    const totalDocs = await Event.countDocuments({ category: categoryId });

    res.status(200).json({
      data: events,
      pagination: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching events by category", error });
  }
};

export const addCoordinatorToEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { coordinatorId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existingEvent = await Event.findOne({ coordinators: coordinatorId });
    if (existingEvent) {
      return res.status(400).json({
        message: existingEvent._id.toString() === eventId
            ? "User is already a coordinator for this event"
            : "User is already a coordinator for another event",
      });
    }

    event.coordinators.push(coordinatorId);
    await event.save();
    await assignRoleAndNotify(coordinatorId, "event_coordinator", event.name, "Event");

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Error adding coordinator", error });
  }
};

export const addVolunteerToEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { volunteerId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.volunteers.includes(volunteerId)) {
      return res.status(400).json({ message: "User is already a volunteer" });
    }

    event.volunteers.push(volunteerId);
    await event.save();
    await assignRoleAndNotify(volunteerId, "volunteer", event.name, "Event");

    res.status(200).json({ message: "Volunteer added successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error adding volunteer", error });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });

    const { Registration } = await import("../models/registration.model.js");
    await Registration.deleteMany({ event: eventId });

    res.status(200).json({ message: "Event and associated registrations deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting event", error });
  }
};