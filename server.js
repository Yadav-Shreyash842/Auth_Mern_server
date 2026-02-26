const express = require ("express");
const cors = require ("cors");
const dotenv = require ("dotenv");
dotenv.config();
const cookieParser = require ("cookie-parser");
const connectDB = require ("../server/config/db");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 3000;
connectDB();

// Allow multiple origins - localhost for development and production URL
const allowedOrigins = [
    'http://localhost:5173',
    process.env.CLIENT_URL // Your deployed client URL
].filter(Boolean); // Remove undefined values

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials : true}))

// api Endpoints
app.get("/", (req , res) => res.send("API working "))
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)

app.listen(port , () => {
    console.log(`Server is running on port http://localhost:${port}`);
})