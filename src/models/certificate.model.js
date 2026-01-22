import mongoose,{Schema} from "mongoose";

const certificateSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["participation", "excellence", "completion", "winner"],
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
    
    // NEW: Track the highest round the user reached
    roundReached: {
        type: String,
        default: "Check-In"
    },
    
    // NEW: If user won (top 3), track that
    isWinner: {
        type: Boolean,
        default: false
    },
    
    winnerRank: {
        type: Number,
        default: null
        // 1, 2, or 3 for final round winners
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
},{
    timestamps: true
});


export const Certificate = mongoose.model("Certificate", certificateSchema);

