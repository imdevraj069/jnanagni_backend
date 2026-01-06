import mongoose, { Schema } from "mongoose";

const volunteerRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Dynamic form data – store as key/value map
    formData: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Optional: reason for rejection / admin notes
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// A user should normally have only one active request per event
volunteerRequestSchema.index(
  { user: 1, event: 1 },
  { unique: true } // adjust if you want multiple attempts
);

export const VolunteerRequest = mongoose.model(
  "VolunteerRequest",
  volunteerRequestSchema
);
