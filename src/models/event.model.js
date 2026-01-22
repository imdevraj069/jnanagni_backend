import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    // ... existing fields ...
    name: { type: String, required: true },
    description: { type: String, required: true },
    
    // ===== NEW: DYNAMIC ROUNDS SYSTEM =====
    // Rounds created/managed by admin dynamically
    rounds: [
      {
        _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, required: true }, // e.g., "Preliminary", "Semi-Final", "Final"
        sequenceNumber: { type: Number, required: true }, // 1, 2, 3... determines order
        isActive: { type: Boolean, default: false }, // Only one round is active at a time
        resultsPublished: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    
    // Track which round is currently active (index in rounds array)
    currentRoundIndex: { type: Number, default: -1 }, // -1 means no round started yet
    
    slug: { type: String, required: true, unique: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },
    requiredPassType: {
      type: String,
      enum: ["none", "egames", "workshop", "edm", "supersaver"],
      default: "none"
    },

    // --- Media & Resources ---
    poster: { type: String },
    images: [String],

    rulesetFile: { type: String },
    rulesetUrl: { type: String },

    // ... Participation Config ...
    participationType: {
      type: String,
      enum: ["solo", "group"],
      default: "solo",
      required: true,
    },
    maxRegistrations: { type: Number, default: 0 },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 1 },

    // ... Forms & Access ...
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
        fieldType: { type: String, default: "text" },
        fieldName: String,
        required: { type: Boolean, default: false },
        options: [String],
      },
    ],

    coordinators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    volunteers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // ... Standard Details ...
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