import {Schema} from "mongoose";

const QuerySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open',
    },
    resolved: {
        type: Boolean,
        default: false,
    },
    resolvedAt: {
        date: Date,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
    },
}, {timestamps: true});

const QueryModel = mongoose.model("Query", QuerySchema);
export default QueryModel;