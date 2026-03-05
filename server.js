const express = require ("express");
const cors = require ("cors");
const dotenv = require ("dotenv");
dotenv.config();
const cookieParser = require ("cookie-parser");

const connectDB = require ("./config/db");

const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

connectDB();

const allowedOrigins = [
    'http://localhost:5173',
    'https://auth-mern-client-nine.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

console.log('🌐 [CORS] Allowed origins:', allowedOrigins);

app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('❌ [CORS] Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req , res) => res.send("API working "))

app.use('/api/auth', authRouter)

app.use('/api/user', userRouter)

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

})