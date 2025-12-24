import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNo: { type: String, required: true, trim: true },
    whatsappNo: { type: String, required: true, trim: true },

    // Academic Fields
    college: { type: String, trim: true },
    branch: { type: String, trim: true },
    campus: { type: String, enum: ["FET", "University", "KGC"], trim: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: [
        "student",
        "gkvian",
        "fetian",
        "faculty",
      ],
      default: "student",
    },
    specialRoles: [
      {
        type: String,
        enum: ["event_coordinator", "volunteer", "category_lead", "admin", "finance_team", "None"],
        default: "None",
      }
    ],

    // Unique Jnanagni Identifier

    jnanagniId: { type: String, unique: true, uppercase: true, trim: true },

    // --- VERIFICATION FIELDS ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpire: Date,

    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ... (Keep existing pre-save hash and comparePassword methods) ...
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET || "BLACKBIRDCODELABS",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ... (Keep generateResetOtp) ...
userSchema.methods.generateResetOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return otp;
};

// --- NEW VERIFICATION TOKEN GENERATOR ---
userSchema.methods.generateVerificationToken = function () {
  // 1. Generate 128-character hex string (64 bytes)
  const token = crypto.randomBytes(64).toString("hex");

  // 2. Hash it before saving to DB
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // 3. Set expiry for 30 minutes
  this.verificationExpire = Date.now() + 30 * 60 * 1000;

  // 4. Return plain token to send in email
  return token;
};

const User = mongoose.model("User", userSchema);
export default User;
