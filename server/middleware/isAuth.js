const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
dotenv.config()

module.exports = (req, res, next) => {
    let token = req.headers.authorization;
    if(!token) {
        const error = new Error("No credentials sent!")
        error.statusCode = 401;
        throw error;
    } 
    token = token.split(" ")[1] 
    if(!token) {
        const error = new Error("Authorization failed")
        error.statusCode = 401;
        throw error;
    }                                                         
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    } catch (err) {
        err.statusCode = 500;
        throw err;                                            
    }
    if(!decodedToken) {
        const error = new Error("Not authenticated")
        error.statusCode = 401;
        throw error;
    }
    req.userId = decodedToken.userId;
    next()
}