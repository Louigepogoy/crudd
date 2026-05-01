const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Access token is missing." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token." });
  }
};

module.exports = authMiddleware;
