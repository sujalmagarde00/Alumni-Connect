const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const app = express();
const multer = require('multer');
const auth = require("./middleware/auth");
const adminOnly = require("./middleware/adminOnly");

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(express.json());

const http = require("http");
const { Server } = require("socket.io");

//socket io install 
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// 🔥 SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on("send_message", (data) => {
    const { receiver_id } = data;

    // emit to receiver
    io.to(`user_${receiver_id}`).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


/*========== for image uploads ===========*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});


// Test route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// ================= REGISTER API =================

app.post('/register', (req, res) => {

  const {
    email,
    phone,
    password,
    role,
    full_name,
    department,
    batch,
    company,
    designation
  } = req.body;

  const userSql = `
    INSERT INTO userauth
    (email, phone_number, password, role, is_verified, is_active)
    VALUES (?, ?, ?, ?, true, true)
  `;

  db.query(
    userSql,
    [email, phone, password, role],
    (err, userResult) => {

      if (err) return res.send('User already exists');

      const userId = userResult.insertId;

      // STUDENT
      if (role === 'STUDENT') {
        db.query(
          'INSERT INTO Student (user_id, full_name, department, batch) VALUES (?, ?, ?, ?)',
          [userId, full_name, department, batch],
          (err) => {
            if (err) console.error("Error inserting student:", err);
          }
        );
      }

      // ALUMNI
      else {
        db.query(
          'INSERT INTO Alumni (user_id, full_name, department, batch, company, designation) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, full_name, department, batch, company, designation],
          (err) => {
            if (err) console.error("Error inserting alumni:", err);
          }
        );
      }

      res.send('Registration successful');
    }
  );
});

// ================= LOGIN API =================
// ================= LOGIN API =================
app.post('/login', (req, res) => {

  const { email, password } = req.body;

  db.query(
    'SELECT * FROM userauth WHERE email = ?',
    [email],
    (err, rows) => {

      if (err) return res.status(500).json({ message: "Server error" });

      if (!rows.length) {
        return res.json({ message: 'User not found' });
      }

      const user = rows[0];

      if (!user.is_active) {
        return res.json({ message: 'Account deactivated' });
      }

      // ✅ PASSWORD CHECK
      if (password !== user.password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // ✅ LOGIN SUCCESS
      res.json({
        message: 'Login successful',
        user_id: user.user_id,
        role: user.role
      });
    }
  );
});

// ================= POSTS / FEED =================
app.post("/post", upload.single("image"), (req, res) => {
  const { post_type, content, created_by, external_link } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    "SELECT role FROM UserAuth WHERE user_id = ?",
    [created_by],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(403).send("Unauthorized");
      }

      if (rows[0].role !== "ALUMNI") {
        return res.status(403).send("Only alumni can create posts");
      }

      const sql = `
        INSERT INTO Post (post_type, content, image_url, external_link, created_by)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          post_type,
          content,
          image_url,
          external_link || null, // 🔥 THIS FIXES JOB APPLY
          created_by
        ],
        (err) => {
          if (err) {
            console.error(err);
            return res.send("Error creating post");
          }
          res.send("Post created");
        }
      );
    }
  );
});


//feed

app.get("/feed", (req, res) => {
  const sql = `SELECT 
  Post.*,
  Alumni.full_name AS author_name,
  Alumni.profile_image AS author_image,
  Alumni.user_id AS author_user_id
FROM Post
JOIN Alumni ON Post.created_by = Alumni.alumni_id
WHERE Post.post_type IN ('ARTICLE', 'IMAGE')
ORDER BY Post.created_at DESC;`


  db.query(sql, (err, rows) => {
    if (err) {
  console.error(err);
  return res.status(500).json([]); // ✅ always array
}
    res.json(rows);
  });
});


/* ========== Likes ==============*/
app.post('/post/like', (req, res) => {
  const { post_id, user_id } = req.body;

  db.query(
    'INSERT IGNORE INTO PostLike (post_id, user_id) VALUES (?, ?)',
    [post_id, user_id],
    (err) => {
      if (err) return res.status(500).send('Error liking post');
      res.send('Post liked');
    }
  );
});
app.get('/post/:postId/likes/count', (req, res) => {
  db.query(
    'SELECT COUNT(*) AS count FROM PostLike WHERE post_id = ?',
    [req.params.postId],
    (err, rows) => {
      if (err) return res.status(500).send('Error');
      res.json(rows[0]);
    }
  );
});

//unlike
app.delete('/post/like', (req, res) => {
  const { post_id, user_id } = req.body;

  db.query(
    'DELETE FROM PostLike WHERE post_id = ? AND user_id = ?',
    [post_id, user_id],
    (err) => {
      if (err) return res.status(500).send('Error unliking post');
      res.send('Post unliked');
    }
  );
});
/*================= Comment =================*/

app.post('/post/comment', (req, res) => {
  const { post_id, user_id, comment_text } = req.body;

  db.query(
    'INSERT INTO PostComment (post_id, user_id, comment_text) VALUES (?, ?, ?)',
    [post_id, user_id, comment_text],
    (err) => {
      if (err) return res.status(500).send('Error adding comment');
      res.send('Comment added');
    }
  );
});
app.get('/post/:postId/comments/count', (req, res) => {
  db.query(
    'SELECT COUNT(*) AS count FROM PostComment WHERE post_id = ?',
    [req.params.postId],
    (err, rows) => {
      if (err) return res.status(500).send('Error');
      res.json(rows[0]);
    }
  );
});

//show
app.get('/post/:postId/comments', (req, res) => {
  const postId = req.params.postId;

  db.query(
    `
    SELECT pc.comment_text, pc.commented_at, u.email
    FROM PostComment pc
    JOIN UserAuth u ON pc.user_id = u.user_id
    WHERE pc.post_id = ?
    ORDER BY pc.commented_at
    `,
    [postId],
    (err, rows) => {
      if (err) return res.status(500).send('Error fetching comments');
      res.json(rows);
    }
  );
});

/*================= EVENTS =================*/

app.post('/event', (req, res) => {
  const { title, description, event_date, venue, allowed_role, created_by, creator_role } = req.body;

  const sql = `
    INSERT INTO Event (title, description, event_date, venue, allowed_role, created_by, creator_role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, description, event_date, venue, allowed_role, created_by, creator_role],
    (err) => {
      if (err) return res.send('Error creating event');
      res.send('Event created');
    }
  );
});

app.get('/events', (req, res) => {
  db.query('SELECT * FROM Event ORDER BY event_date', (err, rows) => {
    if (err) return res.send('Error');
    res.json(rows);
  });
});

app.post('/event/register', (req, res) => {
  const { user_id, event_id } = req.body;

  db.query(
    'INSERT INTO EventRegistration (user_id, event_id) VALUES (?, ?)',
    [user_id, event_id],
    (err) => {
      if (err) return res.send('Already registered');
      res.send('Registered for event');
    }
  );
});

// GET JOBS
app.get("/jobs", (req, res) => {
  db.query(
    "SELECT * FROM Post WHERE post_type = 'JOB' ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.send("Error");
      res.json(rows);
    }
  );
});


// ================= CHAT =================
app.post("/chat", (req, res) => {
  const { sender_id, receiver_id, batch_id, message_text } = req.body;

  if (!sender_id || !receiver_id || !message_text) {
    return res.status(400).send("Missing required fields");
  }

  const sql = `
    INSERT INTO ChatMessage (sender_id, receiver_id, batch_id, message_text)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [sender_id, receiver_id, batch_id || null, message_text],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error sending message");
      }
      res.send("Message sent");
    }
  );
});


app.get("/chat/conversation", (req, res) => {
  const { user1, user2 } = req.query;

  const sql = `
    SELECT *
    FROM ChatMessage
    WHERE 
      (sender_id = ? AND receiver_id = ?)
      OR
      (sender_id = ? AND receiver_id = ?)
    ORDER BY sent_at
  `;

  db.query(sql, [user1, user2, user2, user1], (err, rows) => {
    if (err) return res.status(500).send("Error");
    res.json(rows);
  });
});

//1 endpoint fetch users=================
app.get("/chat/contacts/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT DISTINCT
      CASE
        WHEN sender_id = ? THEN receiver_id
        ELSE sender_id
      END AS contact_id
    FROM ChatMessage
    WHERE sender_id = ? OR receiver_id = ?
  `;

  db.query(sql, [userId, userId, userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching contacts");
    }

    res.json(rows.map(r => r.contact_id));
  });
});

//fetch names===========
app.get("/users/by-ids", (req, res) => {
  const ids = req.query.ids;

  if (!ids || ids.trim() === "") {
    return res.json([]);
  }

  const idArray = ids
    .split(",")
    .map(Number)
    .filter(Boolean);

  if (idArray.length === 0) {
    return res.json([]);
  }

  const sql = `
    SELECT 
      u.user_id AS id,
      COALESCE(s.full_name, a.full_name) AS name
    FROM userauth u
    LEFT JOIN student s ON s.user_id = u.user_id
    LEFT JOIN alumni a ON a.user_id = u.user_id
    WHERE u.user_id IN (?)
  `;

  db.query(sql, [idArray], (err, rows) => {
    if (err) {
      console.error("USERS BY IDS SQL ERROR:", err);
      return res.status(500).json({ error: "DB Error" });
    }

    res.json(rows);
  });
});





// ================= SERVER =================
const PORT = 5000;
server.listen(PORT, () => {
  console.log('Server running on port 5000'+PORT);
});

/*==============Profile=================*/
//get

app.get("/profile/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT email, phone_number, role FROM UserAuth WHERE user_id = ?",
    [userId],
    (err, authRows) => {
      if (err || !authRows.length) {
        return res.status(404).json({ message: "User not found" });
      }

      const { email, phone_number, role } = authRows[0];

      // 🔥 STUDENT PROFILE
      if (role === "STUDENT") {
        db.query(
          `SELECT full_name, batch, profile_image
           FROM Student
           WHERE user_id = ?`,
          [userId],
          (err, rows) => {
            if (err || !rows.length) {
              return res.status(404).json({ message: "Student profile not found" });
            }

            return res.json({
              role,
              email,
              phone: phone_number,
              ...rows[0],
            });
          }
        );
      }

      // 🔥 ALUMNI PROFILE
      else {
        db.query(
          `SELECT full_name, batch, company, designation, profile_image
           FROM Alumni
           WHERE user_id = ?`,
          [userId],
          (err, rows) => {
            if (err || !rows.length) {
              return res.status(404).json({ message: "Alumni profile not found" });
            }

            return res.json({
              role,
              email,
              phone: phone_number,
              ...rows[0],
            });
          }
        );
      }
    }
  );
});

//update
app.put("/profile/:userId", upload.single("image"), (req, res) => {
  const userId = req.params.userId;
  const { full_name, phone, batch, company, designation } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // 1️⃣ Get role
  db.query(
    "SELECT role FROM UserAuth WHERE user_id = ?",
    [userId],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(404).send("User not found");
      }

      const role = rows[0].role;

      // 2️⃣ STUDENT UPDATE
      if (role === "STUDENT") {
        db.query(
          `
          UPDATE Student
          SET full_name = ?,
              batch = ?,
              profile_image = COALESCE(?, profile_image)
          WHERE user_id = ?
          `,
          [full_name, batch || null, image, userId],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Profile update failed");
            }

            db.query(
              "UPDATE UserAuth SET phone_number = ? WHERE user_id = ?",
              [phone, userId],
              () => res.send("Profile updated")
            );
          }
        );
      }

      // 3️⃣ ALUMNI UPDATE
      else {
        db.query(
          `
          UPDATE Alumni
          SET full_name = ?,
              batch = ?,
              company = ?,
              designation = ?,
              profile_image = COALESCE(?, profile_image)
          WHERE user_id = ?
          `,
          [
            full_name,
            batch || null,
            company || null,
            designation || null,
            image,
            userId,
          ],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Profile update failed");
            }

            db.query(
              "UPDATE UserAuth SET phone_number = ? WHERE user_id = ?",
              [phone, userId],
              () => res.send("Profile updated")
            );
          }
        );
      }
    }
  );
});
//admindashboard
app.get("/admin/users", auth, adminOnly, (req, res) => {
  const sql = `
    SELECT user_id, email, role, is_active, is_verified, created_at
    FROM userauth
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});
app.patch(
  "/admin/users/:id/status",
  auth,
  adminOnly,
  (req, res) => {
    const targetUserId = Number(req.params.id);
    const { is_active } = req.body;

    // prevent admin from disabling himself
    if (targetUserId === req.user.user_id) {
      return res
        .status(400)
        .send("Admin cannot deactivate himself");
    }

    const sql = `
      UPDATE userauth
      SET is_active = ?
      WHERE user_id = ?
    `;

    db.query(sql, [is_active ? 1 : 0, targetUserId], (err) => {
      if (err) return res.status(500).send("DB error");
      res.send("User status updated");
    });
  }
);
// GET all posts
app.get("/admin/posts", auth, adminOnly, (req, res) => {
  const sql = `
    SELECT post_id, content, created_by, created_at
    FROM post
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

// DELETE post
app.delete("/admin/posts/:id", auth, adminOnly, (req, res) => {
  const sql = `DELETE FROM post WHERE post_id = ?`;
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).send("DB error");
    res.send("Post removed");
  });
});

//adminevent
app.get("/admin/events", auth, adminOnly, (req, res) => {
  db.query("SELECT * FROM events", (err, rows) => {
    if (err) return res.status(500).send("DB error");
    res.json(rows);
  });
});

app.delete("/admin/events/:id", auth, adminOnly, (req, res) => {
  db.query(
    "DELETE FROM events WHERE event_id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send("DB error");
      res.send("Event deleted");
    }
  );
});
