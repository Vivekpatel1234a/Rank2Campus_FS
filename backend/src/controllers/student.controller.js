import Student from '../models/Student.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const allowedFields = [
  'fullName',
  'phone',
  'dateOfBirth',
  'gender',
  'state',
  'city',
  'category',
  'subcategory',
  'examName',
  'rank',
  'score',
  'percentile',
  'academicInfo',
  'interestedBranches'
];

export const getProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email phone role isActive');
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }

  const user = await User.findById(req.user._id).select('name email phone role isActive');
  res.json({
    success: true,
    data: {
      ...student.toObject(),
      user: user ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      } : null
    }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (updates.rank !== undefined && (!Number.isInteger(Number(updates.rank)) || Number(updates.rank) < 1)) {
    return res.status(400).json({ success: false, message: 'Rank must be a positive integer.' });
  }

  if (updates.score !== undefined && (Number.isNaN(Number(updates.score)) || Number(updates.score) < 0)) {
    return res.status(400).json({ success: false, message: 'Score must be a non-negative number.' });
  }

  if (updates.percentile !== undefined && (Number.isNaN(Number(updates.percentile)) || Number(updates.percentile) < 0 || Number(updates.percentile) > 100)) {
    return res.status(400).json({ success: false, message: 'Percentile must be between 0 and 100.' });
  }

  if (updates.phone !== undefined && updates.phone && updates.phone.length < 10) {
    return res.status(400).json({ success: false, message: 'Phone number should contain at least 10 digits.' });
  }

  if (updates.interestedBranches && !Array.isArray(updates.interestedBranches)) {
    return res.status(400).json({ success: false, message: 'Interested branches must be a list.' });
  }

  if (updates.academicInfo && typeof updates.academicInfo !== 'object') {
    return res.status(400).json({ success: false, message: 'Academic details must be an object.' });
  }

  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }

  res.json({ success: true, data: student });
});
