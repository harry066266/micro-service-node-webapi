const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit...");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.error("validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("User already exists");
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    user = new User({ username, email, password });
    await user.save();
    logger.warn("User registered successfully", user._id);
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.error("validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid user");
      return res
        .status(400)
        .json({ success: false, message: "Invalid credintials" });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid password");
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }
    const { accessToken, refreshToken } = await generateToken(user);
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Login error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const refreshTokenUser = async (req, res) => {
  logger.info("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Invalid refresh token");
      return res
        .status(400)
        .json({ success: false, message: "Invalid refresh token" });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiredsAt < new Date()) {
      logger.warn("Invalid refresh token");
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }
    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("Invalid user");
      return res.status(400).json({ success: false, message: "Invalid user" });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Invalid refresh token");
      return res
        .status(400)
        .json({ success: false, message: "Invalid refresh token" });
    }
    const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token");
      return res
        .status(400)
        .json({ success: false, message: "Invalid refresh token" });
    }
    logger.info("User logged out successfully");
    res.json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    logger.error("Logout error", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
module.exports = { registerUser, logoutUser, loginUser, refreshTokenUser };
