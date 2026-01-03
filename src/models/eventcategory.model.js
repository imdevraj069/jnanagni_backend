import mongoose, { Schema } from "mongoose";

const EventCategorySchema = new Schema(
  {
    name: {
      type: String, // e.g., "Technical", "Cultural"
      required: true,
      unique: true,
    },
    slug: {
      type: String, // e.g., "technical", "cultural"
      required: true,
      unique: true,
    },
    // The Category Lead (Has access to ALL events in this category)
    lead: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: String,
    createdby: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const EventCategory = mongoose.model("EventCategory", EventCategorySchema);
