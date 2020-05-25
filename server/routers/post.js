const express = require("express")
const {body} = require("express-validator")
const isAuth = require("../middleware/isAuth")

const router = express.Router()

//controllers
const postController = require("../controllers/posts")

router.get("/posts", isAuth, postController.getPosts)

router.post("/post",  isAuth, [
body("title").trim().isLength({min: 3}),
body("content").trim().isLength({min: 5})
],
postController.createPost)

router.post("/post/:postId", isAuth, postController.getSinglePost)

router.put("/post/:postId", isAuth,
body("title").trim().isLength({min: 3}),
body("content").trim().isLength({min: 5}),
postController.updatePost)

router.delete("/post/:postId", isAuth, postController.deletePost)

module.exports = router;