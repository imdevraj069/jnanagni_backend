import { Router } from "express";
import { upload } from "../middlewares/upload.middleware.js";
import fs from "fs";

const testRouter = Router();

// Simple public route - No Auth, Just Upload
testRouter.post("/upload-check", (req, res) => {
    
    // Use the upload middleware manually to handle errors gracefully
    const uploadSingle = upload.single("image");

    uploadSingle(req, res, (err) => {
        if (err) {
            // This catches Multer errors (like File too large)
            console.error("❌ Multer Error:", err);
            return res.status(400).json({ 
                success: false, 
                message: "Upload Failed", 
                error: err.message,
                code: err.code 
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file received" });
        }

        const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ File Accepted: ${req.file.originalname} (${fileSizeMB} MB)`);

        // OPTIONAL: Delete the file immediately to save space
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) { console.error("Could not delete test file"); }

        return res.status(200).json({
            success: true,
            message: "File successfully reached Node.js!",
            fileDetails: {
                originalName: req.file.originalname,
                sizeBytes: req.file.size,
                sizeMB: fileSizeMB,
                mimetype: req.file.mimetype
            }
        });
    });
});

export default testRouter;