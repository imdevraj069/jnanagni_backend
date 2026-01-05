import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Ensure directories exist
const createDir = (dir) => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // let uploadPath = "src/uploads/others"; // Default
    let uploadPath = path.join(process.cwd(), "src/uploads/others");

    if (file.fieldname === "poster" || file.fieldname === "banner" || file.fieldname === "images") {
        // uploadPath = "src/uploads/images";
        uploadPath = path.join(process.cwd(), "src/uploads/images");
    } else if (file.fieldname === "rulesetFile") {
        // uploadPath = "src/uploads/rulesets";
        uploadPath = path.join(process.cwd(), "src/uploads/rulesets");
    }

    createDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "rulesetFile") {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
            return cb(new Error('Please upload a PDF or Word document for rulesets'), false);
        }
    } else {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            return cb(new Error('Please upload an image file'), false);
        }
    }
    cb(null, true);
};

export const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});