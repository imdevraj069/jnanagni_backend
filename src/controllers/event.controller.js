import { Event } from "../models/event.model.js";
import { EventCategory } from "../models/eventcategory.model.js";
import User from "../models/user.model.js";
import { sendRoleAssignmentEmail } from "../services/email.service.js";

// Helper function to update role and send email
const assignRoleAndNotify = async (userId, role, contextName, contextType) => {
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  // 1. Update Special Role if not present
  if (!user.specialRoles.includes(role)) {
    user.specialRoles.push(role);
    // Remove 'None' if it exists
    user.specialRoles = user.specialRoles.filter((r) => r !== "None");
    await user.save();
    console.log(`User ${user.email} promoted to ${role}.`);
  }

  // 2. Send Email Notification
  try {
    await sendRoleAssignmentEmail(user, role, contextName, contextType);
    console.log(`Notification email sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
  }
};

//  ---- Event Category Controllers ---- //

export const createEventCategory = async (req, res) => {
  try {
    const { name, description, leaduserId } = req.body;

    // 1. Generate Slug
    let slug = name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
    let uniqueSlug = slug;
    let counter = 1;
    while (await EventCategory.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    // 2. Create the Category
    const newCategory = await EventCategory.create({
      name,
      description,
      slug: uniqueSlug,
      lead: leaduserId,
      createdby: req.user._id,
    });

    // 3. Update User Role & Send Email
    if (leaduserId) {
      await assignRoleAndNotify(leaduserId, "category_lead", name, "Category");
    }

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creating event category", error });
  }
};

// ... (getAllEventCategories, getEventCategoryById, updateEventCategory, deleteEventCategory remain unchanged) ...
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
      if (!category) {
        return res.status(404).json({ message: "Event category not found" });
      }
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event category", error });
    }
  };
  
  export const updateEventCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const updates = req.body;
  
      // If lead is being changed, we might want to logic to demote the old lead, 
      // but usually we just promote the new one.
      // For now, let's just handle the new lead promotion.
      if (updates.lead) {
          await assignRoleAndNotify(updates.lead, "category_lead", updates.name || "Updated Category", "Category");
      }
  
      const updatedCategory = await EventCategory.findByIdAndUpdate(
        categoryId,
        updates,
        { new: true }
      );
      if (!updatedCategory) {
        return res.status(404).json({ message: "Event category not found" });
      }
      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Error updating event category", error });
    }
  };
  
  export const deleteEventCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
  
      const deletedCategory = await EventCategory.findByIdAndDelete(categoryId);
      if (!deletedCategory) {
        return res.status(404).json({ message: "Event category not found" });
      }
      res.status(200).json({ message: "Event category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting event category", error });
    }
  };

//  ---- Event Controllers ---- //

export const createEvent = async (req, res) => {
  try {
    const { name, description, date, time, venue, categoryId, coordinatorId, maxParticipants, prize, images, customFields, ruleset, coordinatorIds, volunteerIds } = req.body;

    let slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    let uniqueSlug = slug;
    let counter = 1;
    while (await Event.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const newEvent = await Event.create({
      name,
      description,
      slug: uniqueSlug,
      date,
      time,
      venue,
      category: categoryId,
      maxParticipants: maxParticipants || null,
      prize: prize || null,
      images: images || [],
      customFields: customFields && customFields.length > 0 ? customFields.map(f => ({
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        fieldName: f.fieldName,
        required: f.required || false,
        options: f.options || [],
      })) : [],
      ruleset: ruleset || "",
      isRegistrationOpen: true,
      createdby: req.user._id,
      coordinators: coordinatorIds || (coordinatorId ? [coordinatorId] : []),
      volunteers: volunteerIds || [],
    });

    // Assign coordinators and send notifications
    const allCoordinators = coordinatorIds || (coordinatorId ? [coordinatorId] : []);
    for (const coordId of allCoordinators) {
      await assignRoleAndNotify(coordId, "event_coordinator", name, "Event");
    }

    // Assign volunteers and send notifications
    const allVolunteers = volunteerIds || [];
    for (const volId of allVolunteers) {
      await assignRoleAndNotify(volId, "event_volunteer", name, "Event");
    }

    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: "Error creating event", error });
  }
};

// ... (getAllEvents, getEventById, getEventsByCategory remain unchanged) ...
export const getAllEvents = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const events = await Event.find()
        .populate("category")
        .populate("createdby", "name email")
        .sort({ date: 1 }) 
        .skip(skip)
        .limit(limit);
  
      const totalDocs = await Event.countDocuments();
  
      res.status(200).json({
        data: events,
        pagination: {
          totalDocs,
          totalPages: Math.ceil(totalDocs / limit),
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching events", error });
    }
  };
  
  export const getEventById = async (req, res) => {
    try {
      const eventId = req.params.id;
      const event = await Event.findById(eventId)
        .populate("category")
        .populate("createdby", "name email");
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
        .skip(skip)
        .limit(limit);
  
      const totalDocs = await Event.countDocuments({ category: categoryId });
  
      res.status(200).json({
        data: events,
        pagination: {
          totalDocs,
          totalPages: Math.ceil(totalDocs / limit),
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching events by category", error });
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
          : "User is already a coordinator for another event" 
      });
    }

    event.coordinators.push(coordinatorId);
    await event.save();

    // Update Role & Notify
    await assignRoleAndNotify(coordinatorId, "event_coordinator", event.title, "Event");

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

    // Update Role & Notify
    await assignRoleAndNotify(volunteerId, "volunteer", event.title, "Event");

    res.status(200).json({ message: "Volunteer added successfully", event });
  } catch (error) {
    res.status(500).json({ message: "Error adding volunteer", error });
  }
};

// ... (deleteEvent, updateEvent remain unchanged) ...
export const deleteEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
  
      const deletedEvent = await Event.findByIdAndDelete(eventId);
      if (!deletedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting event", error });
    }
  };
  
  export const updateEvent = async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;
  
      const updatedEvent = await Event.findByIdAndUpdate(eventId, updates, {
        new: true,
      });
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.status(200).json(updatedEvent);
    } catch (error) {
      res.status(500).json({ message: "Error updating event", error });
    }
  };