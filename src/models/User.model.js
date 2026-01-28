import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    name: String,
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
