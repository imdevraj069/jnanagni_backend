import app from "./app.js";
import { connectDB } from "./configs/connectDB.js";
const PORT = process.env.PORT || 8001;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start server due to database connection error:', error);
    });
