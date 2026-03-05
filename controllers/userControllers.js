const User = require ("../models/user");

exports.getUserData = async (req, res) => {

    try {

        const userId = req.userId;

        const user = await User.findById(userId);

        if(!user){
            return res.status(400).json({success: false, message : "Invalid user"})
        }

        res.json({
            success : true,
            userData : {
                name : user.name,
                isAccountVerified: user.isAccountVerified
            }
        })

    } catch(error){

        res.json({success : false , message : "Something went wrong"})

    }

}