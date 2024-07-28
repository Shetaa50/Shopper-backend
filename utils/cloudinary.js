const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: "dhxstvo2o",
  api_key: "636482951221671",
  api_secret: "a4E8oFA5s5xs4UDwseyBkvhcSi8"
});

module.exports = cloudinary;