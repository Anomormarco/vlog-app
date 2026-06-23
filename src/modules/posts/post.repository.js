const prisma = require("../../config/prisma");

const postInclude = {
  author: { select: { id: true, name: true, email: true } },
  comments: {
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true } } },
  },
  reactions: {
    include: { user: { select: { id: true, name: true } } },
  },
};

function createPost(authorId, data) {
  return prisma.post.create({
    data: { ...data, authorId },
    include: postInclude,
  });
}

function listPosts(filters = {}) {
  const where = {
    published: filters.published,
    authorId: filters.authorId,
    category: filters.category,
    AND: [],
  };

  if (filters.search) {
    where.AND.push({
      OR: [
        { title: { contains: filters.search } },
        { body: { contains: filters.search } },
        { category: { contains: filters.search } },
        { tags: { contains: filters.search } },
      ],
    });
  }

  if (filters.tag) {
    where.AND.push({ tags: { contains: filters.tag } });
  }

  if (filters.reaction) {
    where.reactions = { some: { type: filters.reaction } };
  }

  if (where.AND.length === 0) {
    delete where.AND;
  }

  return prisma.post.findMany({
    where,
    orderBy: filters.sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" },
    include: postInclude,
  });
}

function findPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: postInclude,
  });
}

function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data,
    include: postInclude,
  });
}

function deletePost(id) {
  return prisma.post.delete({
    where: { id },
  });
}

function createComment(postId, authorId, body) {
  return prisma.comment.create({
    data: { postId, authorId, body },
    include: { author: { select: { id: true, name: true } } },
  });
}

function findCommentById(id) {
  return prisma.comment.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
}

function updateComment(id, body) {
  return prisma.comment.update({
    where: { id },
    data: { body },
    include: { author: { select: { id: true, name: true } } },
  });
}

function deleteComment(id) {
  return prisma.comment.delete({
    where: { id },
  });
}

function upsertReaction(postId, userId, type) {
  return prisma.postReaction.upsert({
    where: { postId_userId: { postId, userId } },
    update: { type },
    create: { postId, userId, type },
  });
}

function deleteReaction(postId, userId) {
  return prisma.postReaction.deleteMany({
    where: { postId, userId },
  });
}

module.exports = {
  createPost,
  listPosts,
  findPostById,
  updatePost,
  deletePost,
  createComment,
  findCommentById,
  updateComment,
  deleteComment,
  upsertReaction,
  deleteReaction,
};
