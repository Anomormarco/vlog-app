import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003/api";

const emptyVlogForm = {
  title: "",
  body: "",
  mediaUrl: "",
  thumbnailUrl: "",
  category: "daily",
  tags: "",
};

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [vlogForm, setVlogForm] = useState(emptyVlogForm);
  const [commentInputs, setCommentInputs] = useState({});
  const [filters, setFilters] = useState({ search: "", category: "", tag: "", reaction: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  }

  async function loadNotifications(activeToken = token) {
    if (!activeToken) return;
    const data = await request("/notifications", {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    setNotifications(data.notifications);
  }

  async function openNotifications() {
    if (!notificationsOpen && unreadCount > 0) {
      const data = await request("/notifications/read-all", {
        method: "PATCH",
        headers: authHeaders,
      });
      setNotifications(data.notifications);
    }
    setNotificationsOpen((isOpen) => !isOpen);
  }

  async function clearNotifications() {
    await request("/notifications", {
      method: "DELETE",
      headers: authHeaders,
    });
    setNotifications([]);
    setNotificationsOpen(false);
  }

  async function openNotification(notification) {
    if (!notification.read) {
      const data = await request(`/notifications/${notification.id}/read`, {
        method: "PATCH",
        headers: authHeaders,
      });
      setNotifications(data.notifications);
    }
    setNotificationsOpen(false);

    if (!notification.commentId) return;

    const commentElement = document.getElementById(`comment-${notification.commentId}`);
    if (!commentElement) return;

    commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedCommentId(notification.commentId);
    window.setTimeout(() => setHighlightedCommentId(null), 2500);
  }

  async function loadMe(activeToken = token) {
    if (!activeToken) return;
    const data = await request("/auth/me", {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    setUser(data.user);
  }

  async function loadPosts(activeToken = token, options = {}) {
    if (!activeToken) return;

    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const data = await request(`/posts?${query.toString()}`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    setPosts(data.posts);
  }

  useEffect(() => {
    if (!token) return;
    loadPosts(token, { notify: true }).catch((error) => setMessage(error.message));
  }, [filters.category, filters.reaction]);

  useEffect(() => {
    if (!token) return;
    loadMe(token)
      .then(() => Promise.all([loadPosts(token), loadNotifications(token)]))
      .catch(() => logout());
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (!token || !user) return undefined;

    const intervalId = window.setInterval(() => {
      loadPosts(token, { activeUser: user, notify: true }).catch((error) => setMessage(error.message));
      loadNotifications(token).catch((error) => setMessage(error.message));
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [token, user]);

  async function submitAuth(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const data = await request(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (authMode === "register") {
        setAuthMode("login");
        setAuthForm({ name: "", email: authForm.email, password: "" });
        setMessage(data.message || "Account created. Please login.");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      setMessage("Signed in");
      await Promise.all([
        loadPosts(data.token, { activeUser: data.user }),
        loadNotifications(data.token),
      ]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createVlog(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await request("/posts", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ...vlogForm,
          tags: vlogForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      setVlogForm(emptyVlogForm);
      await loadPosts();
      setMessage("Vlog posted");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function reactToPost(postId, type) {
    if (!user) {
      setMessage("Please login first.");
      return;
    }

    try {
      await request(`/posts/${postId}/reaction`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ type }),
      });
      await loadPosts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addComment(postId) {
    if (!user) {
      setMessage("Please login first.");
      return;
    }

    const body = (commentInputs[postId] || "").trim();
    if (!body) return;

    try {
      const data = await request(`/posts/${postId}/comments`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ body }),
      });
      setCommentInputs({ ...commentInputs, [postId]: "" });
      await loadPosts();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updatePost(post) {
    const title = window.prompt("Title", post.title);
    if (title === null) return;

    const body = window.prompt("Description", post.body);
    if (body === null) return;

    try {
      await request(`/posts/${post.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ title, body }),
      });
      await loadPosts();
      setMessage("Vlog updated");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deletePost(postId) {
    if (!window.confirm("Delete this vlog?")) return;

    try {
      await request(`/posts/${postId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await loadPosts();
      setMessage("Vlog deleted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateComment(postId, comment) {
    const body = window.prompt("Comment", comment.body);
    if (body === null) return;

    try {
      await request(`/posts/${postId}/comments/${comment.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ body }),
      });
      await loadPosts();
      setMessage("Comment updated");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteComment(postId, commentId) {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await request(`/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await loadPosts();
      setMessage("Comment deleted");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setPosts([]);
    setNotifications([]);
  }

  return (
    <main className="shell">
      <section className="topbar">
          <div>
            <p className="eyebrow">Vlog platform</p>
          <h1>{user ? "Vlog Content" : "Login"}</h1>
          </div>
        {user && (
          <div className="account">
            <span>{user.name}</span>
            <div className="notification-menu">
              <button type="button" className="ghost notification-button" onClick={openNotifications}>
                Notifications
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <div className="notification-head">
                    <strong>Notifications</strong>
                    {notifications.length > 0 && (
                      <button type="button" className="text-button" onClick={clearNotifications}>
                        Clear
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="muted">No notifications yet</p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        type="button"
                        className="notification-item"
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.body}</span>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button type="button" className="ghost" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </section>

      {!user ? (
        <section className="auth-layout">
            <form className="panel auth-panel" onSubmit={submitAuth}>
              <div className="tabs">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
              </div>

              {authMode === "register" && (
                <label>
                  Name
                  <input
                    value={authForm.name}
                    onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                    placeholder="Your name"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  placeholder="Password"
                />
              </label>
              <button type="submit" className="primary" disabled={loading}>
                {authMode === "login" ? "Login" : "Create account"}
              </button>
            </form>
        </section>
      ) : (
        <section className="layout">
          <aside className="side">
            <form className="panel vlog-form" onSubmit={createVlog}>
              <div className="panel-title">
                <h2>New vlog</h2>
                <button type="submit" className="primary" disabled={loading}>
                  Post
                </button>
              </div>
              <label>
                Title
                <input
                  value={vlogForm.title}
                  onChange={(event) => setVlogForm({ ...vlogForm, title: event.target.value })}
                  placeholder="Vlog title"
                />
              </label>
              <label>
                Description
                <textarea
                  value={vlogForm.body}
                  onChange={(event) => setVlogForm({ ...vlogForm, body: event.target.value })}
                  placeholder="What is this vlog about?"
                />
              </label>
              <label>
                Video URL
                <input
                  value={vlogForm.mediaUrl}
                  onChange={(event) => setVlogForm({ ...vlogForm, mediaUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label>
                Thumbnail URL
                <input
                  value={vlogForm.thumbnailUrl}
                  onChange={(event) =>
                    setVlogForm({ ...vlogForm, thumbnailUrl: event.target.value })
                  }
                  placeholder="https://..."
                />
              </label>
              <div className="field-grid">
                <label>
                  Category
                  <input
                    value={vlogForm.category}
                    onChange={(event) =>
                      setVlogForm({ ...vlogForm, category: event.target.value })
                    }
                    placeholder="travel"
                  />
                </label>
                <label>
                  Tags
                  <input
                    value={vlogForm.tags}
                    onChange={(event) => setVlogForm({ ...vlogForm, tags: event.target.value })}
                    placeholder="mn, daily"
                  />
                </label>
              </div>
            </form>
          </aside>

          <section className="feed">
            <section className="panel filters-panel">
              <div className="filters">
                <input
                  value={filters.search}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                  onKeyDown={(event) => event.key === "Enter" && loadPosts()}
                  placeholder="Search vlogs"
                />
                <input
                  value={filters.category}
                  onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                  placeholder="Category"
                />
                <input
                  value={filters.tag}
                  onChange={(event) => setFilters({ ...filters, tag: event.target.value })}
                  placeholder="Tag"
                />
                <select
                  value={filters.reaction}
                  onChange={(event) => setFilters({ ...filters, reaction: event.target.value })}
                >
                  <option value="">All reactions</option>
                  <option value="LIKE">Liked</option>
                  <option value="DISLIKE">Disliked</option>
                </select>
                <button type="button" className="ghost" onClick={() => loadPosts()}>
                  Search
                </button>
              </div>
            </section>

            <div className="post-list">
              {posts.length === 0 ? (
                <div className="empty">No vlogs found</div>
              ) : (
                posts.map((post) => (
                  <article className="panel post-card" key={post.id}>
                  {post.thumbnailUrl && (
                    <img className="thumb" src={post.thumbnailUrl} alt={post.title} />
                  )}
                  <div className="post-body">
                    <div className="post-head">
                      <div>
                        <h2>{post.title}</h2>
                        <p className="muted">
                          {post.author?.name} · {post.category}
                        </p>
                      </div>
                        <div className="actions">
                        {post.authorId === user.id && (
                          <>
                            <button type="button" className="ghost" onClick={() => updatePost(post)}>
                              Edit
                            </button>
                            <button type="button" className="ghost" onClick={() => deletePost(post.id)}>
                              Delete
                            </button>
                          </>
                        )}
                        <button type="button" className="ghost" onClick={() => reactToPost(post.id, "LIKE")}>
                          Like {post.reactionSummary?.LIKE || 0}
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => reactToPost(post.id, "DISLIKE")}
                        >
                          Dislike {post.reactionSummary?.DISLIKE || 0}
                        </button>
                      </div>
                    </div>

                    <p>{post.body}</p>
                    {post.mediaUrl && (
                      <a className="media-link" href={post.mediaUrl} target="_blank" rel="noreferrer">
                        Open vlog video
                      </a>
                    )}
                    {post.tags && (
                      <div className="meta">
                        {post.tags.split(",").map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <section className="comments">
                      <h3>Comments</h3>
                      {post.comments.length === 0 ? (
                        <p className="muted">No comments yet</p>
                      ) : (
                        post.comments.map((comment) => (
                          <div
                            id={`comment-${comment.id}`}
                            className={`comment ${
                              highlightedCommentId === comment.id ? "comment-highlight" : ""
                            }`}
                            key={comment.id}
                          >
                            <div>
                              <strong>{comment.author?.name}</strong>
                              <span>{comment.body}</span>
                            </div>
                            {comment.authorId === user.id && (
                              <div className="comment-actions">
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => updateComment(post.id, comment)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="ghost"
                                  onClick={() => deleteComment(post.id, comment.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      <div className="comment-form">
                        <input
                          value={commentInputs[post.id] || ""}
                          onChange={(event) =>
                            setCommentInputs({ ...commentInputs, [post.id]: event.target.value })
                          }
                          placeholder={user ? "Write a comment" : "Login to comment"}
                          disabled={!user}
                        />
                        <button
                          type="button"
                          className="primary"
                          disabled={!user}
                          onClick={() => addComment(post.id)}
                        >
                          Comment
                        </button>
                      </div>
                    </section>
                  </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      )}

      {message && <div className="toast">{message}</div>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
