const User  = require("../models/user")

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    res.status(200).json({message: "success", user: user})  
  } catch (error) {
      if(!error.statusCode) {
        console.log(error);
        error.message = "Something went wrong in the server";
        error.statusCode = 404;
        next(error);
      }
  }   
}

exports.modifyStatus = async (req, res, next) => {
    const status = req.query.status;
    console.log(req.query);
    try {
        const user = await User.findById(req.userId)
        user.status = status;
        const updatedUser = await user.save()
        res.status(200).json({message: "success", user: updatedUser})
    } catch (error) {
    
    }

}
