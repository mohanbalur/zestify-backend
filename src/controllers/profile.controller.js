import User from "../models/User.model.js";

// GET PROFILE
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;

  await user.save();

  res.json({
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
};
