const { HttpError } = require("../../shared/utils/http-error");
const { publishNotificationEvent } = require("../../shared/mq/rabbitmq-http");
const postRepository = require("./post.repository");

const allowedReactions = new Set(["LIKE", "DISLIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"]);

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean).join(",");
  }

  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");
}

function withReactionSummary(post) {
  const summary = post.reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {});

  return {
    ...post,
    reactionSummary: summary,
  };
}

function normalizePostData({ title, body, mediaUrl, thumbnailUrl, category, tags, published }, partial = false) {
  const data = {};

  if (!partial || title !== undefined) {
    if (!title || !title.trim()) {
      throw new HttpError(400, "title is required");
    }
    data.title = title.trim();
  }

  if (!partial || body !== undefined) {
    if (!body || !body.trim()) {
      throw new HttpError(400, "body is required");
    }
    data.body = body.trim();
  }

  if (mediaUrl !== undefined) {
    data.mediaUrl = mediaUrl ? String(mediaUrl).trim() : null;
  }

  if (thumbnailUrl !== undefined) {
    data.thumbnailUrl = thumbnailUrl ? String(thumbnailUrl).trim() : null;
  }

  if (category !== undefined) {
    data.category = category ? String(category).trim().toLowerCase() : "general";
  }

  if (tags !== undefined) {
    data.tags = normalizeTags(tags);
  }

  if (published !== undefined) {
    data.published = Boolean(published);
  }

  return data;
}

async function createPost(userId, { title, body, mediaUrl, thumbnailUrl, category, tags, published }) {
  const post = await postRepository.createPost(
    userId,
    normalizePostData({ title, body, mediaUrl, thumbnailUrl, category, tags, published })
  );
  return withReactionSummary(post);
}

async function listPosts(query = {}) {
  const filters = {
    search: query.search ? String(query.search).trim() : undefined,
    category: query.category ? String(query.category).trim().toLowerCase() : undefined,
    tag: query.tag ? String(query.tag).trim() : undefined,
    authorId: query.authorId ? Number(query.authorId) : undefined,
    reaction: query.reaction ? String(query.reaction).toUpperCase() : undefined,
    sort: query.sort,
    published: query.published === "false" ? false : true,
  };

  if (filters.reaction && !allowedReactions.has(filters.reaction)) {
    throw new HttpError(400, "Invalid reaction filter");
  }

  const posts = await postRepository.listPosts(filters);
  return posts.map(withReactionSummary);
}

async function getPost(id) {
  const post = await postRepository.findPostById(Number(id));

  if (!post) {
    throw new HttpError(404, "Post not found");
  }

  return withReactionSummary(post);
}

async function updatePost(postId, userId, body) {
  const post = await getPost(postId);

  if (post.authorId !== userId) {
    throw new HttpError(403, "You can update only your own post");
  }

  const updatedPost = await postRepository.updatePost(
    Number(postId),
    normalizePostData(body, true)
  );
  return withReactionSummary(updatedPost);
}

async function deletePost(postId, userId) {
  const post = await getPost(postId);

  if (post.authorId !== userId) {
    throw new HttpError(403, "You can delete only your own post");
  }

  await postRepository.deletePost(Number(postId));
  return { success: true, message: "Post deleted" };
}

async function createComment(postId, userId, { body }) {
  if (!body || !body.trim()) {
    throw new HttpError(400, "body is required");
  }

  const post = await getPost(postId);
  const comment = await postRepository.createComment(Number(postId), userId, body.trim());

  if (post.authorId !== userId) {
    publishNotificationEvent({
      type: "comment.created",
      postId: post.id,
      postTitle: post.title,
      postAuthorId: post.authorId,
      commentId: comment.id,
      commentAuthorId: comment.authorId,
      commentAuthorName: comment.author?.name,
      createdAt: comment.createdAt,
    }).catch((error) => {
      console.error("Could not publish notification event:", error.message);
    });
  }

  return comment;
}

async function getOwnedComment(postId, commentId, userId) {
  const comment = await postRepository.findCommentById(Number(commentId));

  if (!comment || comment.postId !== Number(postId)) {
    throw new HttpError(404, "Comment not found");
  }

  if (comment.authorId !== userId) {
    throw new HttpError(403, "You can change only your own comment");
  }

  return comment;
}

async function updateComment(postId, commentId, userId, { body }) {
  if (!body || !body.trim()) {
    throw new HttpError(400, "body is required");
  }

  await getOwnedComment(postId, commentId, userId);
  return postRepository.updateComment(Number(commentId), body.trim());
}

async function deleteComment(postId, 
  commentId, userId) {
  await getOwnedComment(postId,    commentId, userId);
  await postRepository.deleteComment (Number(commentId));
  return { 
    success: true, 
    message: "Comment ustlaa" };
}

async function reactToPost(postId, userId, { type }) {
  if (!allowedReactions.has(type)) {
    throw new HttpError(400, "bad request");
  }

  const post = await getPost(postId);
  const reaction = await postRepository.upsertReaction(Number(postId), userId, type);

  if (post.authorId !== userId) {
    publishNotificationEvent({
      type: "reaction.created",
      reactionType: reaction.type,
      postId: post.id,
      postTitle: post.title,
      postAuthorId: post.authorId,
      actorId: reaction.userId,
      actorName: reaction.user?.name,
      createdAt: reaction.createdAt,
    }).catch((error) => {
      console.error("Could not publish notification event:", error.message);
    });
  }

  return getPost(postId);
}

async function removeReaction(postId, userId) {
  await getPost(postId);
  await postRepository.deleteReaction(Number(postId), userId);
  return getPost(postId);
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
