const express = require("express");
const postController = require("./post.controller");
const { asyncHandler } = require("../../shared/utils/async-handler");
const { authMiddleware } = require("../../shared/middlewares/auth.middleware");


const router = express.Router();

router.get("/", asyncHandler(postController.listPosts));
router.get("/:postId", asyncHandler(postController.getPost));
router.post("/", authMiddleware, asyncHandler(postController.createPost));
router.patch("/:postId", authMiddleware, asyncHandler(postController.updatePost));
router.put("/:postId", authMiddleware, asyncHandler(postController.updatePost));
router.delete("/:postId", authMiddleware, asyncHandler(postController.deletePost));
router.post("/:postId/comments", authMiddleware, asyncHandler(postController.createComment));
router.patch("/:postId/comments/:commentId", authMiddleware, asyncHandler(postController.updateComment));
router.put("/:postId/comments/:commentId", authMiddleware, asyncHandler(postController.updateComment));
router.delete("/:postId/comments/:commentId", authMiddleware, asyncHandler(postController.deleteComment));
router.put("/:postId/reaction", authMiddleware, asyncHandler(postController.reactToPost));
router.delete("/:postId/reaction", authMiddleware, asyncHandler(postController.removeReaction));

module.exports = router;
