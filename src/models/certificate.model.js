import mongoose,{Schema} from "mongoose";

const certificateSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["participation", "excellence", "completion"],
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    registration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Registration",
        required: true
    },
    rank: {
        type: Number,
        default: null
    },
    teamName: {
        type: String,
        default: null
    },
    round: {
        type: String,
        default: "Check-In"
    },
    certificateId: {
        type: String,
        unique: true,
        required: true
    },
    isGenerated: {
        type: Boolean,
        default: false
    },
    issuedAt: {
        type: Date,
        default: null
    },
    maxRoundReached: {
        type: String,
        default: "Check-In"
    },
},{
    timestamps: true
});


export const Certificate = mongoose.model("Certificate", certificateSchema);

