const path = require("path");
const fs = require("fs")

const removeImage = (image, cb) => {
    let imagePath = path.join(path.dirname(process.mainModule.filename), "images", image)
    fs.unlink(imagePath, (err) => {
        if(err) cb(err)
    })
    return cb(false)
}

module.exports = removeImage;