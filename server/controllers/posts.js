const { validationResult } = require("express-validator");
const deleteOldImage = require("../util/deleteImage");
const ObjectId = require("mongoose").Types.ObjectId;
const socket = require("../util/socket");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  let currentPage = req.query.page || 1;
  let totalItems;
  const ITEMS_PER_PAGE = 6;
  try {
    const count = await Post.countDocuments();
    totalItems = count;
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("creator")
      .skip((currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    res.status(200).json({
      posts: posts,
      totalItems: totalItems,
      message: "get your posts"
    });
  } catch (error) {
    console.log(err);
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 402;
    throw error;
  }
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    throw err;
  }
  const host = req.get("host");
  const image = {};
  image.url = `${req.protocol}://${host}/${req.file.path}`;
  image.name = req.file.originalname;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    creator: req.userId,
    title,
    content,
    image: image
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    socket.getIo().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: user._id, name: user.name } }
    });
    res.status(201).json({ post: post, message: "post create successfully" });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ post: post, message: "success" });
    })
    .catch(err => {
      err.message = "Something wrong with the server";
      err.statusCode = 500;
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageName = req.body.image;
  if (!errors.isEmpty()) {
    console.log(errors.array());
    const err = new Error("Validation failed");
    err.statusCode = 422;
    throw err;
  }
  if (req.file) {
    imageName = req.file.originalname;
  }
  if (!imageName) {
    let error = new Error("Image not found");
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .populate("creator")
    .then(post => {
      if (!post) {
        let error = new Error("Post Not found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        return next(error);
      }
      let image_base_url;
      if (!imageName && imageName !== post.image.name) {
        image_base_url = `${req.protocol}://${req.get("host")}/${
          req.file.path
        }`;
        deleteOldImage(post.image.name, err => {
          if (err) {
            console.log(err);
          }
        });
      }
      post.title = title;
      post.content = content;
      post.image.url = req.body.url || image_base_url || post.image.url;
      post.image.name = imageName;
      return post.save();
    })
    .then(result => {
      console.log(result);
      socket.getIo().emit("posts", { action: "update", post: result });
      res.status(200).json({ message: "post updated", post: result });
    })
    .catch(err => {
      err.statusCode = 500;
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  let deletedPost;
  Post.findById(postId)
    .populate("creator")
    .then(post => {
      if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
      }
      if (post.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
      deleteOldImage(post.image.name, err => {
        if (err) {
          console.log(err);
          console.log("Failed to delete old image.");
        }
      });
      deletedPost = post;
      return Post.findByIdAndDelete(postId);
    })
    .then(post => {
      return User.findById(req.userId);
    })
    .then(user => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }
      user.posts.pull(postId);
      return user.save();
    })
    .then(user => {
      socket.getIo().emit("posts", { action: "delete", post: deletedPost });
      res.status(200).json({ message: "Post deleted successfully" });
    })
    .catch(err => {
      next(err);
    });
};
