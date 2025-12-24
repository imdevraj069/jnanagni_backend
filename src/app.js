// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Core Application Imports
// |
// | This section imports all necessary Node.js and third-party modules.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
import express from "express";
import morgan from "morgan"; // HTTP request logger middleware
import cors from "cors"; // Cross-Origin Resource Sharing middleware
import helmet from "helmet"; // Security middleware for setting HTTP headers
import path from "path"; // Node.js utility for handling file paths
import { fileURLToPath } from "url"; // Utility to resolve ES module file paths
import errm from "./middlewares/error.middleware.js"; // Custom global error handler

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | API Route Imports
// |
// | Import modular route handlers for different API resources.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
import { authRouter } from "./apis/auth.api.js";
import { userRouter } from "./apis/user.api.js";
import { eventRouter } from "./apis/event.api.js"; // Import Event Router
import { adminRouter } from "./apis/admin.api.js"; // Import Admin Router
// import { seedRouter } from "./apis/seed.api.js";

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Express Application Initialization
// |
// | Create the primary Express application instance.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
const app = express();

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Security Middleware (Helmet)
// |
// | Initialize Helmet to apply a default set of security headers, protecting
// | against common web vulnerabilities (e.g., XSS, clickjacking, etc.).
// | This should be one of the first middleware applied.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
app.use(helmet());

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | HTTP Request Logging (Morgan)
// |
// | Use Morgan in 'dev' format for concise, color-coded logging of HTTP
// | requests to the console during development.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
app.use(morgan("dev"));

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Body Parser Middleware
// |
// | Configure Express to parse incoming request bodies.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
const limit = process.env.LIMIT || "10mb";

// Parses incoming JSON payloads.
app.use(
  express.json({
    limit: limit, // Set a common payload size limit
  })
);

// Parses incoming 'application/x-www-form-urlencoded' payloads.
app.use(
  express.urlencoded({
    extended: true, // Allows for rich objects and arrays to be encoded
    limit: limit, // Set a common payload size limit
  })
);

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Cross-Origin Resource Sharing (CORS) Configuration
// |
// | Enable and configure CORS to control which external origins are allowed
// | to make requests to this API.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
const corsOptions = {

  // Define the allowed origin(s). '*' is a fallback for development.
  origin: "*",

  // Allow browsers to send credentials (e.g., cookies) with requests
  credentials: true,

  // Specify the allowed HTTP methods
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",

  // Specify the headers allowed in a request
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

  // Specify the headers that can be exposed in the response
  exposedHeaders: ["X-Total-Count", "Authorization"],

  // Set the status code for successful OPTIONS (pre-flight) requests
  optionsSuccessStatus: 204,
  
};
app.use(cors(corsOptions));

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Static Asset Serving
// |
// | Configure path resolution for ES modules and serve static files.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// Replicate __filename and __dirname behavior for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve files from the 'uploads' directory under the '/uploads' URL path
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Health Check Route
// |
// | A simple root endpoint to verify the server is running and healthy.
// | Often used by load balancers, monitoring services, and for simple uptime checks.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Up",
    message: "Server is healthy",
  });
});

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | API Routes
// |
// | Mount the modular route handlers to their respective versioned base paths.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// All authentication routes will be prefixed with '/api/v1/auth'
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter); // Public & Student routes
app.use("/api/v1/admin", adminRouter);   // Protected Management routes
// app.use("/api/v1/seed", seedRouter);

// ----------------------------------------------------------------------------------------------------------------------------------------------------------
// | Global Error Handler
// |
// | This custom error handling middleware must be the LAST 'app.use' middleware.
// | It will catch all errors passed via 'next(error)' from any route handler.
// ----------------------------------------------------------------------------------------------------------------------------------------------------------
app.use(errm);

/**
 * Export the configured Express application.
 * This instance will be imported by the main server file (e.g., index.js)
 * to be started.
 */
export default app;
