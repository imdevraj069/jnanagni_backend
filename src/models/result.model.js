import mongoose, { Schema } from "mongoose";

const resultSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // NEW: Specify which round these results are for
    round: {
      type: String,
      enum: ["Preliminary", "Quarter-Final", "Semi-Final", "Final"], 
      required: true
    },
    // Array of qualifiers/winners
    winners: [
      {
        rank: { type: Number }, // Rank in this specific round
        registration: { 
          type: Schema.Types.ObjectId, 
          ref: "Registration", 
          required: true 
        },
        score: { type: String, trim: true },
        // NEW: specific flag to say if they move to next round
        qualified: { type: Boolean, default: true } 
      }
    ],
    published: { type: Boolean, default: false },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// COMPOUND INDEX: One result set per round per event
resultSchema.index({ event: 1, round: 1 }, { unique: true });

export const Result = mongoose.model("Result", resultSchema);