const express = require("express")
const router = express.Router()
const {body} = require("express-validator")
const User = require("../models/user")

const authController = require("../controllers/auth")

router.put("/signup",
body("email")
.isEmail().withMessage("Enter valid email")
.custom(value => {
    return User.findOne({email: value})
    .then(userDoc => {
        if(userDoc) {
            return Promise.reject("Email already in use")
        }                                              
        return true;
    })
})
.normalizeEmail(),
body("password")
.trim().isLength({min: 5})
.custom((value, {req}) => {
    if(value !== req.body.passwordConformation) {
        return Promise.reject("Password conformation is incorrect")
    }
    return true;
}),
authController.signup)
router.post("/login", authController.login)

module.exports = router;