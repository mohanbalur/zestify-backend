import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true
        },
        quantity: {
          type: Number,
          default: 1
        },
        addons: [
          {
            addon: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Addon"
            },
            name: String,
            price: Number
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
