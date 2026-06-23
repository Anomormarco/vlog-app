const express = require("express");
const authController = require("./auth.controller");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { authMiddleware } = require("../../shared/middlewares/auth.middleware");

const router = express.Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.me));

module.exports = router;
