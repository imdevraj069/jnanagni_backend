import mongoose, { Schema } from "mongoose";

const passSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true 
    }, 
    type: {
      type: String,
      enum: ["egames", "workshop", "edm", "supersaver"],
      required: true,
      unique: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    description: String,
    
    // CHANGED: Replaced qrCode image path with UPI ID
    upiId: {
      type: String,
      required: true, 
      trim: true
    },
    
    // NEW: The full string string used to generate the QR on frontend
    // Format: upi://pay?pa={upiId}&am={price}
    paymentUrl: {
      type: String
    },

    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate the paymentUrl if upiId or price changes
passSchema.pre('save', function(next) {
    if (this.isModified('upiId') || this.isModified('price')) {
        // Construct standard UPI intent link
        // pa = payee address (UPI ID)
        // pn = payee name (Optional, using Jnanagni)
        // am = amount
        // cu = currency
        this.paymentUrl = `upi://pay?pa=${this.upiId}&pn=Jnanagni&am=${this.price}&cu=INR`;
    }
    next();
});

export const Pass = mongoose.model("Pass", passSchema);