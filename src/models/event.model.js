import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    // ... existing fields ...
    name: { type: String, required: true },
    description: { type: String, required: true },
    round: {
      type: String,
      enum: ["Preliminary", "Quarter-Final", "Semi-Final", "Final", "Check-In"],
      default: "Check-In",
      required: true,
    },
    slug: { type: String, required: true, unique: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },
    requiredPassType: {
      type: String,
      enum: ["none", "egames", "workshop", "edm", "supersaver"], // 'none' for general free events
      default: "none"
    },

    // --- Media & Resources ---
    poster: { type: String }, // Path to image file
    images: [String], // Additional gallery images

    // Ruleset can be a file download OR a google doc link
    rulesetFile: { type: String }, // Path to PDF/Doc
    rulesetUrl: { type: String }, // External Link

    // ... Participation Config (keep existing) ...
    participationType: {
      type: String,
      enum: ["solo", "group"],
      default: "solo",
      required: true,
    },
    maxRegistrations: { type: Number, default: 0 },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 1 },

    // ... Forms & Access (keep existing) ...
    registrationFields: [
      {
        fieldLabel: String,
        fieldType: { type: String, default: "text" },
        fieldName: String,
        required: { type: Boolean, default: false },
        options: [String],
      },
    ],
    memberFields: [
      {
        fieldLabel: String,
        fieldType: { type: String, default: "text" },
        fieldName: String,
        required: { type: Boolean, default: false },
      },
    ],
    volunteerFields: [
      {
        fieldLabel: String,
        fieldType: { type: String, default: "text" }, // text, number, url, select etc.
        fieldName: String,
        required: { type: Boolean, default: false },
        options: [String],
      },
    ],

    coordinators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    volunteers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // ... Standard Details (keep existing) ...
    venue: String,
    date: Date,
    time: String,
    prize: {
      type: String,
      default: "TBA",
    },

    isRegistrationOpen: { type: Boolean, default: true },
    createdby: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);