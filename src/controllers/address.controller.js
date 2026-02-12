import Address from "../models/Address.model.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    // STEP 1: FIX USER IDENTIFICATION
    if (!req.user || !req.user.id) {
      console.log("❌ Address Error: User not authenticated in GET /addresses");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const addresses = await Address.find({ user: req.user.id }).sort({ createdAt: -1 });
    console.log(`✅ Fetched ${addresses.length} addresses for user: ${req.user.id}`);
    res.status(200).json(addresses);
  } catch (error) {
    console.error("💥 ERROR FETCHING ADDRESSES:", error);
    res.status(500).json({
      message: "An internal server error occurred while fetching addresses",
      error: error.message
    });
  }
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  try {
    // STEP 1: DEBUG BACKEND ADDRESS CONTROLLER
    console.log("📍 ADD ADDRESS REQUEST:", JSON.stringify(req.body, null, 2));

    // STEP 2: FIX USER IDENTIFICATION
    if (!req.user || !req.user.id) {
      console.log("❌ Address Error: User not authenticated in POST /addresses");
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { label, name, phone, street, area, city, pincode, state, isDefault } = req.body;

    // STEP 3: ALIGN FRONTEND & BACKEND DATA CONTRACT
    // City is now optional in the model, matching the missing form field
    if (!name || !phone || !street || !area || !pincode) {
      console.log("❌ Address Error: Missing required fields", { name, phone, street, area, pincode });
      return res.status(422).json({
        message: "Required address fields are missing (Name, Phone, Street, Area, Pincode)"
      });
    }

    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
    }

    // Prepare data for creation
    const addressData = {
      user: req.user.id,
      label: label || "Home",
      name,
      phone,
      street,
      area,
      city: city || "Bangalore", // Default if missing
      pincode,
      state, // Optional
      isDefault: isDefault || false
    };

    // Robust GeoJSON handling: avoid 2dsphere index crash if coordinates missing
    if (req.body.location && req.body.location.coordinates && req.body.location.coordinates.length === 2) {
      addressData.location = req.body.location;
    }

    const address = await Address.create(addressData);
    console.log("🚀 SUCCESS: Address created with ID:", address._id);
    res.status(201).json(address);
  } catch (error) {
    console.error("💥 ERROR ADDING ADDRESS:", error);

    // Persistent logging to file
    try {
      const fs = await import('fs');
      const logMsg = `\n[${new Date().toISOString()}] ADDRESS_POST_ERROR: ${error.message}\nSTACK: ${error.stack}\nBODY: ${JSON.stringify(req.body)}\n`;
      fs.default.appendFileSync('order_debug.log', logMsg);
    } catch (e) {
      console.error("Failed to write to log file:", e);
    }

    // Replace 500 with 400 for validation/cast errors
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid address data provided",
        error: error.message
      });
    }

    res.status(500).json({
      message: "An internal server error occurred during address creation",
      error: error.message
    });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(error.name === 'ValidationError' ? 400 : 500).json({
      message: "Failed to update address",
      error: error.message
    });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Failed to delete address" });
  }
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await Address.updateMany(
      { user: req.user.id },
      { isDefault: false }
    );

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Default address set successfully", address });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Failed to set default address" });
  }
};
