import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Feed() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // create post
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postType, setPostType] = useState("ARTICLE");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // likes & comments
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const userId = Number(localStorage.getItem("userId"));
  const role = localStorage.getItem("role");
  const isAlumni = role === "ALUMNI";

  /* ================= TIME AGO ================= */
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  /* ================= FETCH FEED ================= */
  useEffect(() => {
    api.get("/feed").then((res) => {
      setPosts(res.data);
      setFilteredPosts(res.data);

      const likesMap = {};
      const commentsMap = {};

      res.data.forEach((post) => {
        api.get(`/post/${post.post_id}/likes/count`).then((r) => {
          likesMap[post.post_id] = r.data.count;
          setLikeCounts({ ...likesMap });
        });

        api.get(`/post/${post.post_id}/comments/count`).then((r) => {
          commentsMap[post.post_id] = r.data.count;
          setCommentCounts({ ...commentsMap });
        });
      });
    });
  }, []);

  /* ================= FILTER ================= */
  const showAll = () => setFilteredPosts(posts);
  const showImages = () =>
    setFilteredPosts(posts.filter((p) => p.image_url));
  const showArticles = () =>
    setFilteredPosts(posts.filter((p) => !p.image_url));

  /* ================= CREATE POST ================= */
  const handleCreatePost = () => {
    if (postType === "ARTICLE" && !content.trim()) {
      return alert("Article content required");
    }

    if (postType === "IMAGE" && !imageFile) {
      return alert("Please add an image");
    }

    const formData = new FormData();
    formData.append("post_type", postType);
    formData.append("content", content);
    formData.append("created_by", userId);

    if (postType === "IMAGE") {
      formData.append("image", imageFile);
    }

    api.post("/post", formData).then(() => {
      setContent("");
      setImageFile(null);
      setPostType("ARTICLE");
      setShowCreatePost(false);
      window.location.reload();
    });
  };

  /* ================= LIKE ================= */
  const toggleLike = (postId) => {
    const isLiked = likedPosts[postId];

    const req = isLiked
      ? api.delete("/post/like", {
          data: { post_id: postId, user_id: userId },
        })
      : api.post("/post/like", {
          post_id: postId,
          user_id: userId,
        });

    req.then(() => {
      setLikedPosts({ ...likedPosts, [postId]: !isLiked });
      setLikeCounts({
        ...likeCounts,
        [postId]: isLiked
          ? likeCounts[postId] - 1
          : likeCounts[postId] + 1,
      });
    });
  };

  /* ================= COMMENTS ================= */
  const toggleComments = (postId) => {
    if (activePost === postId) {
      setActivePost(null);
      return;
    }

    api.get(`/post/${postId}/comments`).then((res) => {
      setComments(res.data);
      setActivePost(postId);
    });
  };

  const addComment = () => {
    if (!commentText.trim()) return;

    api.post("/post/comment", {
      post_id: activePost,
      user_id: userId,
      comment_text: commentText,
    }).then(() => {
      setCommentText("");
      setCommentCounts({
        ...commentCounts,
        [activePost]: commentCounts[activePost] + 1,
      });
      toggleComments(activePost);
    });
  };

  return (
    <div className="feed-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="feed-sidebar glass">
        <h3>Feed</h3>

        {isAlumni && (
          <button
            className="sidebar-btn"
            onClick={() => setShowCreatePost(!showCreatePost)}
          >
            ➕ Create Post
          </button>
        )}

        <button className="sidebar-btn" onClick={showAll}>
          All Posts
        </button>
        <button className="sidebar-btn" onClick={showImages}>
          Images
        </button>
        <button className="sidebar-btn" onClick={showArticles}>
          Articles
        </button>
      </aside>

      {/* ===== MAIN FEED ===== */}
      <main className="feed-main">
        <div className="feed-content">
          {/* CREATE POST */}
          {showCreatePost && (
            <div className="create-post glass">
              <div className="post-type-toggle">
                <button
                  className={postType === "ARTICLE" ? "active" : ""}
                  onClick={() => {
                    setPostType("ARTICLE");
                    setImageFile(null);
                  }}
                >
                  Article
                </button>

                <button
                  className={postType === "IMAGE" ? "active" : ""}
                  onClick={() => setPostType("IMAGE")}
                >
                  Image
                </button>
              </div>

              <textarea
                className="create-input"
                placeholder="Share something with your network..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="create-actions">
                {postType === "IMAGE" && (
                  <label className="add-image">
                    <span>Add image</span>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) =>
                        setImageFile(e.target.files[0])
                      }
                    />
                  </label>
                )}

                <button className="post-btn" onClick={handleCreatePost}>
                  Post
                </button>
              </div>
            </div>
          )}

          {/* POSTS */}
          {filteredPosts.map((post) => (
            <div key={post.post_id} className="post-card glass">
              {/* AUTHOR */}
              <div
                className="post-header"
                onClick={() =>
                  navigate(`/profile/${post.author_user_id}`)
                }
              >
                <div className="post-avatar">
                  {post.author_image ? (
                    <img
                      src={`http://localhost:5000${post.author_image}`}
                      alt="author"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  )}
                </div>

                <span className="post-author">
                  {post.author_name}
                </span>
              </div>

              <div className="post-meta">
                <span className="post-author">{post.author_name}</span>
                <span className="post-time">
                  · {timeAgo(post.created_at)}
                </span>
              </div>

              <p>{post.content}</p>

              {post.image_url && (
                <img
                  src={`http://localhost:5000${post.image_url}`}
                  alt="post"
                />
              )}

              {/* ACTIONS */}
              <div className="post-actions">
                <div
                  className="icon-wrap"
                  onClick={() => toggleLike(post.post_id)}
                >
                  ❤️ {likeCounts[post.post_id] || 0}
                </div>

                <div
                  className="icon-wrap"
                  onClick={() => toggleComments(post.post_id)}
                >
                  💬 {commentCounts[post.post_id] || 0}
                </div>

                {/* ✅ MESSAGE BUTTON */}
                {post.author_user_id !== userId && (
                  <div
                    className="icon-wrap"
                    onClick={() =>
                      navigate(`/chat?user=${post.author_user_id}`)
                    }
                  >
                    ✉️ Message
                  </div>
                )}
              </div>

              {activePost === post.post_id && (
                <div className="comment-box">
                  {comments.map((c, i) => (
                    <p key={i}>
                      <strong>{c.email}</strong>: {c.comment_text}
                    </p>
                  ))}

                  <input
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) =>
                      setCommentText(e.target.value)
                    }
                  />
                  <button onClick={addComment}>Post</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Feed;
