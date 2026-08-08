import { useEffect, useState } from "react";
import api from "../api";

function AdminPosts() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get("/admin/posts").then((res) => {
      setPosts(res.data);
    });
  }, []);

  const deletePost = (id) => {
    if (!window.confirm("Delete this post?")) return;

    api.delete(`/admin/posts/${id}`).then(() => {
      setPosts((prev) => prev.filter((p) => p.post_id !== id));
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Posts</h2>

      {posts.length === 0 && <p>No posts found</p>}

      {posts.map((p) => (
        <div
          key={p.post_id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 10,
          }}
        >
          <p>{p.content}</p>
          <small>Post ID: {p.post_id}</small>

          <div>
            <button
              onClick={() => deletePost(p.post_id)}
              style={{
                marginTop: 6,
                background: "#ff4d4f",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminPosts;
