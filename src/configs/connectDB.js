import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // 1. Destructure env variables with defaults
        const {
            DB_USER,
            DB_PASS,
            DB_HOST = 'localhost',
            DB_PORT = '27017',
            DB_NAME = 'jnanagni',
            MONGODB_URI // Allow override via full URI
        } = process.env;

        // 2. Construct the URI
        // If MONGODB_URI exists, use it. Otherwise, build it dynamically.
        // We use ?authSource=admin because the root user in Docker is created in the admin db.
        let uri = MONGODB_URI;
        
        if (!uri) {
            const credentials = DB_USER && DB_PASS 
                ? `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@` 
                : '';
            
            uri = `mongodb://${credentials}${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
        }
        // final URI example:
        // mongodb://username:password@localhost:27017/jnanagni?authSource=admin

        // 3. Connection Options
        // Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+ 
        // and default to true, but we'll leave an empty object for extensibility.
        const options = {}; 

        // 4. Connect
        const connectionInstance = await mongoose.connect(uri, options);
        
        console.log(`\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error('❌ MONGODB connection FAILED ', error);
        // It is often better to exit the process so Docker can restart the container
        process.exit(1);
    }
}