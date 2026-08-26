const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, phone } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      addresses: updatedUser.addresses
    }
  });
});

// @desc    Add shipping address
// @route   POST /api/users/me/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { label, street, city, postalCode, phone, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  user.addresses.push({
    label: label || 'Home',
    street,
    city,
    postalCode,
    phone,
    isDefault: isDefault || user.addresses.length === 0
  });

  await user.save();

  res.status(201).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Update shipping address
// @route   PUT /api/users/me/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const { label, street, city, postalCode, phone, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  if (label) address.label = label;
  if (street) address.street = street;
  if (city) address.city = city;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (phone) address.phone = phone;
  if (isDefault !== undefined) address.isDefault = isDefault;

  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

// @desc    Delete shipping address
// @route   DELETE /api/users/me/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
  await user.save();

  res.status(200).json({
    success: true,
    data: user.addresses
  });
});

module.exports = {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
};
