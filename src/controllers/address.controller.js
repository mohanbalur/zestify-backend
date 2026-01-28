import Address from "../models/Address.model.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user.id });
  res.status(200).json(addresses);
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  if (req.body.isDefault) {
    await Address.updateMany(
      { user: req.user.id },
      { isDefault: false }
    );
  }

  const address = await Address.create({
    ...req.body,
    user: req.user.id
  });

  res.status(201).json(address);
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true }
  );

  res.status(200).json(address);
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  await Address.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  res.status(200).json({ message: "Address deleted" });
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
  await Address.updateMany(
    { user: req.user.id },
    { isDefault: false }
  );

  await Address.findByIdAndUpdate(req.params.id, {
    isDefault: true
  });

  res.status(200).json({ message: "Default address set" });
};
