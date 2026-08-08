module.exports = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];

  if (!userId || !role) {
    return res.status(401).send("Unauthorized");
  }

  req.user = {
    user_id: Number(userId),
    role,
  };

  next();
};
