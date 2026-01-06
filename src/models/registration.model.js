import mongoose, { Schema } from "mongoose";

const registrationSchema = new Schema(
  {
    // The "Owner" of the registration (Solo User or Team Leader)
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    // --- Group Logic ---
    teamName: { type: String, trim: true },
    
    // Team Members (Excluding Leader)
    teamMembers: [
        {
            user: { type: Schema.Types.ObjectId, ref: "User" }, // Linked when accepted
            email: { type: String }, // Used for invitation
            status: { 
                type: String, 
                enum: ['pending', 'accepted', 'rejected'], 
                default: 'pending' 
            },
            invitedAt: { type: Date, default: Date.now },
            submissionData: { type: Map, of: Schema.Types.Mixed } // Member specific data
        }
    ],

    // Data filled by the Leader (or Solo user)
    submissionData: {
      type: Map,
      of: Schema.Types.Mixed,
    },

    // submissionDataByMember: {
    //   type: Map,
    //   of: new Schema(
    //     {
    //       data: { type: Map, of: Schema.Types.Mixed },
    //       submittedAt: { type: Date, default: Date.now },
    //     },
    //     { _id: false }
    //   ),
    // },

    // Overall Status (e.g. if Admin disqualifies the whole team)
    status: {
      type: String,
      enum: ["active", "cancelled", "disqualified"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index to ensure a User is not a Leader in multiple active teams for same event
registrationSchema.index({ registeredBy: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", registrationSchema);