const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

const allowedOrigins = [
    'http://localhost:5173',
    'https://auth-mern-client-nine.vercel.app',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send('API working'));

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
