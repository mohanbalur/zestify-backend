import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import Otp from "../models/Otp.model.js";
import { generateOtp, otpExpiry } from "../utils/otp.util.js";
import { sendSms } from "../services/sms.service.js";

// SEND OTP
export const sendOtp = async (req, res) => {
  const { phone } = req.body;

  if (!phone)
    return res.status(400).json({ message: "Phone required" });

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await Otp.deleteMany({ phone }); // invalidate old OTPs

  await Otp.create({
    phone,
    otpHash,
    expiresAt: otpExpiry(),
  });

  await sendSms(phone, `Your Toggy OTP is ${otp}`);

  res.json({ message: "OTP sent" });
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const record = await Otp.findOne({ phone });
  if (!record)
    return res.status(401).json({ message: "OTP expired" });

  const valid = await bcrypt.compare(otp, record.otpHash);
  if (!valid)
    return res.status(401).json({ message: "Invalid OTP" });

  await Otp.deleteMany({ phone });

  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    message: "Authenticated",
    token,
    user,
  });
};
