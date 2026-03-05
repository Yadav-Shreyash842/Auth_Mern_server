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
    process.env.CLIENT_URL
].filter(Boolean);

app.use(express.json());

app.use(cookieParser());

app.use(cors({
    origin: allowedOrigins,
    credentials : true
}));

app.get("/", (req , res) => res.send("API working "))

app.use('/api/auth', authRouter)

app.use('/api/user', userRouter)

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

})