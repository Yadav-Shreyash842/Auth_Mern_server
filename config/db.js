const mongoose = require ("mongoose");

const connectDB = async () => {
    mongoose.set('strictQuery', false);
    
    const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI, options)
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
        console.log(`📊 Database: ${conn.connection.name}`)
    } catch(error){
        console.error('❌ MongoDB Connection Error:', error.message)
        console.error('Full error:', error)
        // Retry connection after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...')
        setTimeout(connectDB, 5000);
    }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

module.exports = connectDB;