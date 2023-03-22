const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user")


router.get("/profile", UserController.getProfile)

module.exports = router;