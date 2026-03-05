const jwt = require ("jsonwebtoken");

const userAuth = (req, res, next) => {
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({success: false, message : "Not authenticated", isAuthenticated: false})
    }
    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET);
        if(decoded.id){
            req.userId = decoded.id;
        } else{
            return res.status(401).json({success: false, message : "Invalid token", isAuthenticated: false})
        }

        next();

    }
    catch (error){
        console.log('[AUTH] Token verification failed:', error.message);
        return res.status(401).json({success: false, message : "Token expired or invalid", isAuthenticated: false})
    }
    
}

module.exports = userAuth;  