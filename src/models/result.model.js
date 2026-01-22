import mongoose, { Schema } from "mongoose";

const resultSchema = new Schema(
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
      // This references Event.rounds[].\_id
    },
    
    roundName: {
      type: String,
      required: true,
      // e.g., "Preliminary", "Semi-Final", "Final"
    },
    
    roundSequenceNumber: {
      type: Number,
      required: true,
      // 1, 2, 3... to track order
    },

    // Winners/Results for this round
    results: [
      {
        rank: { type: Number },
        registration: { 
          type: Schema.Types.ObjectId, 
          ref: "Registration", 
          required: true 
        },
        score: { type: String, trim: true },
        won: { type: Boolean, default: false } // True if made top 3
      }
    ],

    // NEW: Admin-selected users who qualify for NEXT round
    qualifiedForNextRound: [
      {
        type: Schema.Types.ObjectId,
        ref: "Registration"
      }
    ],

    published: { type: Boolean, default: false },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// NEW: Compound unique index - only one result per round per event
resultSchema.index({ event: 1, roundId: 1 }, { unique: true });

export const Result = mongoose.model("Result", resultSchema);