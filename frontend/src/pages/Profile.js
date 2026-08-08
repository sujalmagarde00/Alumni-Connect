import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

function Profile() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const storedUserId = localStorage.getItem("userId");
  const loggedInUserId = storedUserId ? Number(storedUserId) : null;

  const profileUserId = paramUserId
    ? Number(paramUserId)
    : loggedInUserId;

  const isOwnProfile = profileUserId === loggedInUserId;

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    batch: "",
    company: "",
    designation: "",
    profile_image: null,
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    if (!loggedInUserId) navigate("/login");
  }, [loggedInUserId, navigate]);

  /* 📡 FETCH PROFILE */
  useEffect(() => {
    if (!profileUserId) return;

    api.get(`/profile/${profileUserId}`).then((res) => {
      setRole(res.data.role);
      setProfile({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        batch: res.data.batch || "",
        company: res.data.company || "",
        designation: res.data.designation || "",
        profile_image: res.data.profile_image || null,
      });
      setLoading(false);
    });
  }, [profileUserId]);

  /* 💾 SAVE PROFILE */
  const saveProfile = () => {
    const formData = new FormData();
    formData.append("full_name", profile.full_name);
    formData.append("phone", profile.phone);
    formData.append("batch", profile.batch);
    formData.append("company", profile.company);
    formData.append("designation", profile.designation);

    if (imageFile) formData.append("image", imageFile);

    api.put(`/profile/${loggedInUserId}`, formData).then(() => {
      alert("Profile updated");
      setEditMode(false);

      if (imageFile) {
        setProfile((p) => ({
          ...p,
          profile_image: preview,
        }));
        setImageFile(null);
        setPreview(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card glass">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card glass">
        <h2>{isOwnProfile ? "My Profile" : "Profile"}</h2>

        {/* AVATAR */}
        <div className="profile-avatar-lg">
          {preview ? (
            <img src={preview} alt="profile" />
          ) : profile.profile_image ? (
            <img src={`http://localhost:5000${profile.profile_image}`} alt="profile" />
          ) : (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          )}
        </div>

        {/* EDIT MODE */}
        {editMode && isOwnProfile && (
          <>
            <label className="change-photo">
              Change photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setImageFile(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>

            <div className="profile-inputs">
              <input
                placeholder="Full name"
                value={profile.full_name}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
              />

              <input
                placeholder="Phone number"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />

              <input
                placeholder="Batch year"
                value={profile.batch}
                onChange={(e) =>
                  setProfile({ ...profile, batch: e.target.value })
                }
              />

              {role === "ALUMNI" && (
                <>
                  <input
                    placeholder="Company"
                    value={profile.company}
                    onChange={(e) =>
                      setProfile({ ...profile, company: e.target.value })
                    }
                  />

                  <input
                    placeholder="Designation"
                    value={profile.designation}
                    onChange={(e) =>
                      setProfile({ ...profile, designation: e.target.value })
                    }
                  />
                </>
              )}

              <button className="save-btn" onClick={saveProfile}>
                Save Changes
              </button>

              <button
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setPreview(null);
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* VIEW MODE */}
        {!isOwnProfile && role === "ALUMNI" && localStorage.getItem("role") === "STUDENT" && (
        <button
         className="post-btn"
         onClick={() => navigate(`/chat?user=${profileUserId}`)}
        >
        Message
     </button>
         )}

        {!editMode && (
          <div className="profile-info">
            <p><strong>Name:</strong> {profile.full_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Batch:</strong> {profile.batch}</p>

            {role === "ALUMNI" && (
              <>
                <p><strong>Company:</strong> {profile.company}</p>
                <p><strong>Designation:</strong> {profile.designation}</p>
              </>
            )}

            {isOwnProfile && (
              <button className="edit-btn" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
