import { useEffect, useState } from "react";
import api from "../api";

function Events() {
  const [items, setItems] = useState([]); // events + jobs
  const [filteredItems, setFilteredItems] = useState([]);

  // create panel
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState("EVENT"); // EVENT | JOB

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [allowedRole, setAllowedRole] = useState("ALL");
  const [jobLink, setJobLink] = useState("");

  const userId = Number(localStorage.getItem("userId"));
  const role = localStorage.getItem("role");

  const canCreateEvent = role === "ALUMNI" || role === "ADMIN";
  const canCreateJob = role === "ALUMNI";
  const canRegisterEvent = role === "STUDENT" || role === "ALUMNI";

  /* ================= FETCH EVENTS + JOBS ================= */
  useEffect(() => {
    Promise.all([
      api.get("/events"),
      api.get("/jobs"),
    ]).then(([eventsRes, jobsRes]) => {
      const events = eventsRes.data.map((e) => ({
        ...e,
        type: "EVENT",
      }));

      const jobs = jobsRes.data.map((j) => ({
        ...j,
        type: "JOB",
      }));

      const combined = [...events, ...jobs];

      setItems(combined);
      setFilteredItems(combined);
    });
  }, []);

  /* ================= FILTERS ================= */
  const showAll = () => setFilteredItems(items);

  const showUpcoming = () =>
    setFilteredItems(
      items.filter(
        (i) =>
          i.type === "EVENT" &&
          new Date(i.event_date) >= new Date()
      )
    );

  const showJobs = () =>
    setFilteredItems(items.filter((i) => i.type === "JOB"));

  /* ================= CREATE ================= */
  const handleCreate = () => {
    if (!title.trim()) return alert("Title required");

    // CREATE EVENT
    if (createType === "EVENT") {
      if (!canCreateEvent) return alert("Not allowed");
      if (!description.trim() || !eventDate) {
        return alert("All event fields required");
      }

      api.post("/event", {
        title,
        description,
        event_date: eventDate,
        venue,
        allowed_role: allowedRole,
        created_by: userId,
        creator_role: role,
      }).then(() => window.location.reload());
    }

    // CREATE JOB
    if (createType === "JOB") {
      if (!canCreateJob) return alert("Only alumni can post jobs");
      if (!jobLink.trim()) return alert("Job link required");

      api.post("/post", {
        post_type: "JOB",
        content: title,          // job title stored here
        external_link: jobLink,  // backend must accept this
        created_by: userId,
      }).then(() => window.location.reload());
    }
  };

  /* ================= REGISTER EVENT ================= */
  const registerEvent = (eventId) => {
    api.post("/event/register", {
      user_id: userId,
      event_id: eventId,
    })
      .then((res) => alert(res.data))
      .catch(() => alert("Already registered"));
  };

  return (
    <div className="feed-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="feed-sidebar glass">
        <h3>Events & Jobs</h3>

        {(canCreateEvent || canCreateJob) && (
          <button
            className="sidebar-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            ➕ Create
          </button>
        )}

        <button className="sidebar-btn" onClick={showAll}>
          All
        </button>

        <button className="sidebar-btn" onClick={showUpcoming}>
          Upcoming Events
        </button>

        <button className="sidebar-btn" onClick={showJobs}>
          Jobs
        </button>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="feed-main">
        <div className="feed-content">

          {/* ===== CREATE PANEL ===== */}
          {showCreate && (
            <div className="create-post glass">
              <div className="post-type-toggle">
                <button
                  className={createType === "EVENT" ? "active" : ""}
                  onClick={() => setCreateType("EVENT")}
                >
                  Event
                </button>

                {canCreateJob && (
                  <button
                    className={createType === "JOB" ? "active" : ""}
                    onClick={() => setCreateType("JOB")}
                  >
                    Job
                  </button>
                )}
              </div>

              <input
                className="create-input"
                placeholder={
                  createType === "EVENT"
                    ? "Event title"
                    : "Job title"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {createType === "EVENT" && (
                <textarea
                  className="create-textarea"
                  placeholder="Describe the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}

              {createType === "EVENT" && (
                <>
                  <input
                    type="date"
                    className="create-input"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />

                  <input
                    className="create-input"
                    placeholder="Venue (optional)"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                  />

                  <select
                    className="create-input"
                    value={allowedRole}
                    onChange={(e) => setAllowedRole(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="STUDENT">Students</option>
                    <option value="ALUMNI">Alumni</option>
                  </select>
                </>
              )}

              {createType === "JOB" && (
                <input
                  className="create-input"
                  placeholder="Job application link"
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                />
              )}

              <button className="post-btn" onClick={handleCreate}>
                Publish
              </button>
            </div>
          )}

          {/* ===== LIST ===== */}
          {filteredItems.map((item) => (
            <div
              key={item.event_id || item.post_id}
              className="post-card glass"
            >
              <span className="badge">
                {item.type === "EVENT" ? "Event" : "Job"}
              </span>

              <h4>
                {item.type === "EVENT" ? item.title : item.content}
              </h4>

              {item.type === "EVENT" && (
                <p>{item.description}</p>
              )}

              {item.type === "EVENT" && (
                <p>
                  📅 {item.event_date}
                  {item.venue && ` · 📍 ${item.venue}`}
                </p>
              )}

              {item.type === "EVENT" &&
                canRegisterEvent &&
                (item.allowed_role === "ALL" ||
                  item.allowed_role === role) && (
                  <button
                    className="post-btn"
                    onClick={() =>
                      registerEvent(item.event_id)
                    }
                  >
                    Register
                  </button>
                )}

              {item.type === "JOB" && item.external_link && (
                <button
                  className="post-btn"
                  onClick={() =>
                    window.open(item.external_link, "_blank")
                  }
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Events;
