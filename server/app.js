const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const socketIo = require("./util/socket");
dotenv.config();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "images");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    return cb(null, true);
  }
  return cb(null, false);
};

//routes
const postRoute = require("./routers/post");
const authRoute = require("./routers/auth");
const userRoute = require("./routers/user");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "/images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT,GET,POST,PATCH,DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  next();
});

app.use("/feed", postRoute);
app.use("/auth", authRoute);
app.use(userRoute);

app.use((error, req, res, next) => {
  let status = error.statusCode || 500;
  let message =
    error.statusCode === "500"
      ? "There is something wrong with server"
      : error.message;
  console.log(error);
  res.status(status).json({ message: message });
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    //app.listen(PORT, () => console.log(`server listening at port ${PORT}`))
    const server = app.listen(8080);
    const io = socketIo.init(server);
    io.on("connection", () => {
      console.log("client connected");
    });
    console.log("You are connected to the server successfully");
  })
  .catch(err => {
    console.log(err);
  });
