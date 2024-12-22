import express, { type Request, type Response } from "express"
import cors from "cors";
import requestIp from "request-ip"
import cookieParser from "cookie-parser"
import { ApiError } from "./utils/ApiError";
import { morganMiddleware } from "./logger/morgan.logger";
import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit"


const app = express()

// Global middlewares 
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
    credentials: true
}))

// Middleware for retrieving a request's IP address.
app.use(requestIp.mw())

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req: Request, res: Response): string => {
        return String(req.clientIp); // IP address from requestIp.mw(), as opposed to req.ip
    },
    handler: (_, __, ___, options) => {
        throw new ApiError(
            options.statusCode || 500,
            `There are too many requests. You are only allowed ${options.limit
            } requests per ${options.windowMs / 60000} minutes`
        );
    },
});

// Apply the rate limiter to all requests
app.use(limiter);


app.use(express.static("public")); // Serve static files from the public directory
// Parse incoming JSON payloads
app.use(express.json({ limit: "20kb", }));
// Parse incoming URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
// Parse incoming cookies
app.use(cookieParser());


// Apply the morgan middleware
app.use(morganMiddleware)

// Api Routes 
import { errorHandler } from "./middlewares/error.middleware";
import healthCheakRouter from "./routes/healthcheck.routes";


// App Routes for version 1
app.use("/api/v1/healthcheck", healthCheakRouter)







// use error middleware always at the end
app.use(errorHandler)
export { app }