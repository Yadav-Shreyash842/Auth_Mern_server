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

const allowedOrigins = ['http://localhost:5173']

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