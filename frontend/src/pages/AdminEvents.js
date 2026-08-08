import { useEffect, useState } from "react";
import api from "../api";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/events")
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Event fetch error:", err);
        setLoading(false);
      });
  }, []);

  const deleteEvent = (eventId) => {
    if (!window.confirm("Delete this event?")) return;

    api.delete(`/admin/events/${eventId}`).then(() => {
      setEvents((prev) =>
        prev.filter((e) => e.event_id !== eventId)
      );
    });
  };

  if (loading) {
    return <p style={{ padding: 24 }}>Loading events...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Manage Events</h2>

      {events.length === 0 && (
        <p>No events available</p>
      )}

      {events.map((e) => (
        <div
          key={e.event_id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <h4 style={{ marginBottom: 6 }}>
            {e.title}
          </h4>

          <p style={{ marginBottom: 6 }}>
            {e.description}
          </p>

          <small>
            📅 {new Date(e.date).toLocaleDateString()}
          </small>

          <div>
            <button
              onClick={() => deleteEvent(e.event_id)}
              style={{
                marginTop: 10,
                background: "#ff4d4f",
                color: "#fff",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Delete Event
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminEvents;
