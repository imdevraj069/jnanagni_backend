import mongoose, { Schema } from "mongoose";

const resultSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // Only one result set per event
    },
    // Array of winners (Rank 1, 2, 3, etc.)
    winners: [
      {
        rank: { 
          type: Number, 
          required: true 
        }, // e.g., 1, 2, 3
        registration: { 
          type: Schema.Types.ObjectId, 
          ref: "Registration", 
          required: true 
        },
        // Optional: Score or specific note (e.g., "Time: 10.5s")
        score: { type: String, trim: true },
      }
    ],
    published: {
      type: Boolean,
      default: false,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Result = mongoose.model("Result", resultSchema);