// models/registration.model.js
import mongoose, { Schema } from "mongoose";

const registrationSchema = new Schema(
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

    submissionData: {
      type: Map,
      of: Schema.Types.Mixed, // Allows strings, numbers, arrays etc.
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate registration
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", registrationSchema);
