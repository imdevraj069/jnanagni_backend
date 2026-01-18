import mongoose, { Schema } from "mongoose";

const passOrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    passId: {
      type: Schema.Types.ObjectId,
      ref: "Pass",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["purchase", "upgrade"],
      required: true,
    },
    previousPassId: {
      type: Schema.Types.ObjectId,
      ref: "Pass",
      default: null,
    },
    creditedAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "rejected"], // Removed 'failed', added 'rejected'
      default: "pending",
    },
    transactionId: {
      type: String,
      required: true, // UTR is now mandatory for this flow
      unique: true,   // Ensure uniqueness
      trim: true,
    },
    remarks: {
      type: String, // User notes
      trim: true,
    },
    adminComments: {
      type: String, // Reason for rejection
      trim: true
    }
  },
  { timestamps: true }
);

export const PassOrder = mongoose.model("PassOrder", passOrderSchema);