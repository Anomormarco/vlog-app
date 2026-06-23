const postService = require("./post.service");


async function createPost(req, res) {
  const post = await postService.createPost(req.user.id, req.body);
  res.status(201).json({ post });
}

async function listPosts(req, res) {
  const posts = await postService.listPosts(req.query);
  res.json({ posts });
}

async function getPost(req, res) {
  const post = await postService.getPost(req.params.postId);
  res.json({ post });
}

async function createComment(req, res) {
  const comment = await postService.createComment(req.params.postId, req.user.id, req.body);
  res.status(201).json({ comment });
}

async function updatePost(req, res) {
  const post = await postService.updatePost(req.params.postId, req.user.id, req.body);
  res.json({ post });
}

async function deletePost(req, res) {
  const result = await postService.deletePost(req.params.postId, req.user.id);
  res.json(result);
}

async function updateComment(req, res) {
  const comment = await postService.updateComment(
    req.params.postId,
    req.params.commentId,
    req.user.id,
    req.body
  );
  res.json({ comment });
}

async function deleteComment(req, res) {
  const result = await postService.deleteComment(
    req.params.postId,
    req.params.commentId,
    req.user.id
  );
  res.json(result);
}

async function reactToPost(req, res) {
  const post = await postService.reactToPost(req.params.postId, req.user.id, req.body);
  res.json({ post });
}



async function removeReaction(req, res) {
  const post = await postService.removeReaction(req.params.postId, req.user.id);
  res.json({ post });
}


module.exports = {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
  reactToPost,
  removeReaction,
};


