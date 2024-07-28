// const multer = require('multer'); 
// const upload = multer({ dest: 'uploads/' });

// module.exports = upload.single('product'), (req, res) => {
// if (req.file) {
// res.status(200).send('Image uploaded successfully: ' + req.file.filename);
// } else {
// res.status(400).send('No image uploaded.');
// }
// };
require ('dotenv').config9();
const Cloudinary = require ('cloudinary').v2;


 Cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY ,
    api_secret : process.env.CLOUDINARY_API_KEY,
 });
 const multer = require('multer');

 const storage = multer.diskStorage({
   filename: function (req,file,cb) {
     cb(null, file.originalname)
   }
 });
 
 const upload = multer({storage: storage});
 
 module.exports = upload;

 const express = require('express');
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/multer");

 app.post('/upload', upload.single('image'), function (req, res) {
  cloudinary.uploader.upload(req.file.path, function (err, result){
    if(err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error"
      })
    }

    res.status(200).json({
      success: true,
      message:"Uploaded!",
      data: result
    })
  })
});

module.exports = router;