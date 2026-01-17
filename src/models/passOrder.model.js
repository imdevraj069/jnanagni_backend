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
    // For upgrades: track the previous pass that was upgraded from
    previousPassId: {
      type: Schema.Types.ObjectId,
      ref: "Pass",
      default: null,
    },
    // Amount credited from previous pass (for upgrades)
    creditedAmount: {
      type: Number,
      default: 0,
    },
    // Payment method
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cash"],
      required: true,
    },
    // Payment status
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    // Transaction/Order ID from payment gateway (if applicable)
    transactionId: {
      type: String,
      trim: true,
    },
    // Order notes or remarks
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const PassOrder = mongoose.model("PassOrder", passOrderSchema);
