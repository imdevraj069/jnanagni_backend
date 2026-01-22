import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    
    // NEW: Link to the round in Event.rounds array
    roundId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    
    roundName: {
      type: String,
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
    
    // Who scanned them? (Security audit)
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Ensure a user can only be marked present ONCE per round per event
attendanceSchema.index({ event: 1, roundId: 1, user: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);