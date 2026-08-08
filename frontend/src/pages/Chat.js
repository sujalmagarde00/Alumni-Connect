import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api";

const socket = io("http://localhost:5000");

function Chat() {
  const userId = Number(localStorage.getItem("userId"));
  const [searchParams] = useSearchParams();

  // from feed → /chat?user=5
  const initialUser = searchParams.get("user")
    ? Number(searchParams.get("user"))
    : null;

  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]); // [user_id]
  const [activeUser, setActiveUser] = useState(initialUser);
  const [text, setText] = useState("");
  const [userMap, setUserMap] = useState({}); // { userId: name }

  /* ================= JOIN SOCKET ================= */
  useEffect(() => {
    if (!userId) return;
    socket.emit("join", userId);
  }, [userId]);

  /* ================= LOAD CONTACTS ================= */
  useEffect(() => {
    if (!userId) return;

    api
      .get(`/chat/contacts/${userId}`)
      .then((res) => {
        // force number conversion
        setContacts((res.data || []).map(Number));
      })
      .catch(console.error);
  }, [userId]);

  /* ================= FETCH CONTACT NAMES ================= */
  useEffect(() => {
    if (contacts.length === 0) return;

    api
      .get("/users/by-ids", {
        params: { ids: contacts.join(",") },
      })
      .then((res) => {
        const map = {};
        res.data.forEach((u) => {
          map[Number(u.id)] = u.name;
        });
        setUserMap(map);
      })
      .catch(console.error);
  }, [contacts]);

  /* ================= FETCH CONVERSATION ================= */
  useEffect(() => {
    if (!userId || !activeUser) return;

    api
      .get("/chat/conversation", {
        params: {
          user1: userId,
          user2: activeUser,
        },
      })
      .then((res) => {
        setMessages(res.data || []);
      });
  }, [userId, activeUser]);

  /* ================= RECEIVE MESSAGE ================= */
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);

      const other =
        data.sender_id === userId
          ? data.receiver_id
          : data.sender_id;

      if (!contacts.includes(other)) {
        setContacts((prev) => [...prev, other]);
      }
    });

    return () => socket.off("receive_message");
  }, [contacts, userId]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = () => {
    if (!text.trim() || !activeUser) return;

    const payload = {
      sender_id: userId,
      receiver_id: activeUser,
      batch_id: null,
      message_text: text,
    };

    api.post("/chat", payload);
    socket.emit("send_message", payload);

    setMessages((prev) => [...prev, payload]);
    setText("");

    if (!contacts.includes(activeUser)) {
      setContacts((prev) => [...prev, activeUser]);
    }
  };

  return (
    <div className="chat-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="chat-sidebar">
        <h3>Chats</h3>

        {contacts.length === 0 && (
          <p className="empty-text">No conversations yet</p>
        )}

        {contacts.map((id) => (
          <div
            key={id}
            className={`chat-contact ${
              activeUser === id ? "active" : ""
            }`}
            onClick={() => setActiveUser(id)}
          >
            <span className="contact-name">
              {userMap[id] || "Loading..."}
            </span>
          </div>
        ))}
      </aside>

      {/* ===== CHAT MAIN ===== */}
      <main className="chat-main">
        {!activeUser ? (
          <div className="chat-empty">Select a chat</div>
        ) : (
          <>
            <div className="chat-header">
              {userMap[activeUser] || "Chat"}
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <p className="empty-text">No messages yet 👋</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${
                      m.sender_id === userId ? "sent" : "received"
                    }`}
                  >
                    {m.message_text}
                  </div>
                ))
              )}
            </div>

            <div className="chat-input">
              <input
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && sendMessage()
                }
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Chat;
