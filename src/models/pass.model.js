import mongoose, { Schema } from "mongoose";

const passSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true 
    }, // e.g., "Gamer's Pass", "All Access"
    type: {
      type: String,
      enum: ["egames", "workshop", "edm", "supersaver"],
      required: true,
      unique: true // Ensure only one active pass configuration per type exists
    },
    price: { 
      type: Number, 
      required: true 
    },
    description: String,
    qrCode: { 
      type: String, // Path to the uploaded QR image
      required: true // Admin must upload a QR for payment
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

export const Pass = mongoose.model("Pass", passSchema);