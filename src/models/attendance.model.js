import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Link back to the main registration (the Team or Solo entry)
    registration: {
      type: Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    // The specific student being scanned
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Supports multiple stages: "entry", "qualifier", "semi-final", "final"
    round: {
      type: String,
      default: "check-in", 
      trim: true
    },
    // Who scanned them? (Security audit)
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Ensure a user can only be marked present ONCE per round per event
attendanceSchema.index({ event: 1, user: 1, round: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);