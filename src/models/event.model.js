// models/event.model.js
import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // Link to the parent Category
    category: {
      type: Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },

    // --- ACCESS CONTROL ---
    // Coordinators: Can EDIT this specific event
    coordinators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Volunteers: Can VIEW details/registrations only
    volunteers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // --- DYNAMIC FORM CONFIGURATION ---
    // This defines what the frontend needs to render
    // Example: [ { type: 'text', label: 'Team Name', name: 'team_name' }, { type: 'file', label: 'Resume', name: 'resume_url' } ]
    formFields: [
      {
        label: String, // e.g., "GitHub Link"
        fieldType: {
          type: String,
          enum: ["text", "number", "email", "file", "dropdown"],
          default: "text",
        },
        fieldName: String, // key for the database, e.g., "github_url"
        required: { type: Boolean, default: false },
        options: [String], // For dropdowns, e.g., ["Solo", "Duo"]
      },
    ],

    // Event Rules and Guidelines
    ruleset: {
      type: String,
      default: "",
    },

    // Standard details
    venue: String,
    date: Date,
    isRegistrationOpen: { type: Boolean, default: true },
    createdby: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
