const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const { sendVerificationEmail } = require("../config/mailer");

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(64),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(64),
});

const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );

const signup = async (req, res, next) => {
  try {
    const payload = signupSchema.parse(req.body);

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    await VerificationToken.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendVerificationEmail({ to: user.email, token: verificationToken });

    res.status(201).json({
      message: "Signup successful. Please verify your email before logging in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    const tokenDoc = await VerificationToken.findOne({ token });
    if (!tokenDoc) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isVerified = true;
    await user.save();
    await VerificationToken.deleteOne({ _id: tokenDoc._id });

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const user = await User.findOne({ email: payload.email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email is not verified." });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    next(error);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingToken = req.body.refreshToken;
    if (!incomingToken) {
      return res.status(401).json({ message: "Refresh token is required." });
    }

    const payload = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.userId);

    if (!user || user.refreshToken !== incomingToken) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    const newAccessToken = signAccessToken(user);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch {
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

const logout = async (req, res, next) => {
  try {
    const incomingToken = req.body.refreshToken;
    if (!incomingToken) {
      return res.status(200).json({ message: "Logged out." });
    }

    await User.updateOne({ refreshToken: incomingToken }, { $set: { refreshToken: null } });
    res.status(200).json({ message: "Logged out." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signupSchema,
  loginSchema,
  signup,
  verifyEmail,
  login,
  refreshAccessToken,
  logout,
};
