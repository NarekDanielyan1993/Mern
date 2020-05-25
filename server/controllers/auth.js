const {validationResult} = require("express-validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
dotenv.config()

const User = require("../models/user")


exports.signup = (req, res, next) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const error = new Error("Validation failed")
        error.statusCode = 422;
        error.data = errors.array()                           
        return next(errors);                                  
    }                                                            
    const email = req.body.email;
    const password = req.body.password;                             
    const name = req.body.name;
    bcrypt.genSalt(+process.env.SALT_LENGTH, function(err, salt) {
        if(err) {
            console.log(err)
            return next(err);
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if(err) {
                console.log(err)
                return next(err);
            }
            const user = new User({
                name,
                password: hash,
                email
            })
            user.save((err, user) => {
                if(err) {
                    console.log(err)
                    return next(err);
                }
                res.status(200).json({message: "You Successfully signup", data: user._id})
            })
        })
    })
}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let userData;
    User.findOne({email: email})
    .then(user => {
        if(!user) {
            const error = new Error("User not found")
            error.statusCode = 401;
            return next(error)
        }
        userData = user;
        return bcrypt.compare(password, user.password);
    })
    .then(isPasswordMatch => {
        if(!isPasswordMatch) {
            const error = new Error("Password does not correct")
            error.statusCode = 401;
            return next(error)
        }
        const token = jwt.sign({
            email: userData.email, 
            userId: userData._id.toString()
        }, process.env.JWT_SECRET_KEY,
        {expiresIn: "8640000000"})
        res.status(200).json({message: "Success", token: token, userId: userData._id.toString()})
    }) 
    .catch(err => {
        next(err) 
    })
}