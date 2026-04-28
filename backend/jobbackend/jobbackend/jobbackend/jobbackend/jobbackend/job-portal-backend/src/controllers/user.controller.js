const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const asyncHandler = require("../utils/asyncHandler");

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const buildUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  location: user.location,
  bio: user.bio,
  headline: user.headline,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "User profile fetched",
    data: {
      user: buildUserResponse(req.user),
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, location, bio, headline } = req.body;
  const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;

  if (normalizedEmail && normalizedEmail !== req.user.email) {
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      res.status(400);
      throw new Error("Email is already in use");
    }
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = name ?? user.name;
  user.email = normalizedEmail ?? user.email;
  user.phone = phone ?? user.phone;
  user.location = location ?? user.location;
  user.bio = bio ?? user.bio;
  user.headline = headline ?? user.headline;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: buildUserResponse(user),
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, currentPassword, newPassword } = req.body;
  const previousPassword = oldPassword !== undefined ? oldPassword : currentPassword;

  if (!previousPassword || !newPassword) {
    res.status(400);
    throw new Error("Old password and new password are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(previousPassword, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Old password is incorrect");
  }

  // Hash the new password before saving it.
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
