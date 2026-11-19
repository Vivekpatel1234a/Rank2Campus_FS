import mongoose from 'mongoose';
import AdmissionRound from '../models/AdmissionRound.js';
import Student from '../models/Student.js';
import Preference from '../models/Preference.js';
import Document from '../models/Document.js';
import Allocation from '../models/Allocation.js';
import Branch from '../models/Branch.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const isAllocationRoundReady = (round) => {
  if (!round) {
    return { valid: false, message: 'Admission round not found.' };
  }

  if (round.status === 'allocation_completed') {
    return { valid: false, message: 'This round has already completed allocation.' };
  }

  if (!['open', 'closed'].includes(round.status)) {
    return { valid: false, message: 'This round is not open for seat allocation yet.' };
  }

  return { valid: true, message: 'Round is ready for allocation.' };
};

export const runAllocation = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.roundId)) {
    return res.status(400).json({ success: false, message: 'Invalid admission round ID.' });
  }

  const round = await AdmissionRound.findById(req.params.roundId);
  const readiness = isAllocationRoundReady(round);
  if (!readiness.valid) {
    return res.status(400).json({ success: false, message: readiness.message });
  }

  const students = await Student.find({ rank: { $gt: 0 } }).sort({ rank: 1 });
  const results = [];

  for (const student of students) {
    if (await Allocation.exists({ student: student._id, admissionRound: round._id })) {
      continue;
    }

    const pref = await Preference.findOne({ student: student._id, admissionRound: round._id, isLocked: true }).populate('choices.branch');
    if (!pref) continue;

    const docs = await Document.find({ student: student._id });
    const required = ['identity', 'rank_card'];
    if (!required.every((type) => docs.some((doc) => doc.type === type && doc.status === 'approved'))) {
      continue;
    }

    let allocated = null;
    for (const choice of [...pref.choices].sort((a, b) => a.order - b.order)) {
      const branch = await Branch.findOneAndUpdate(
        { _id: choice.branch?._id, totalSeats: { $gt: 0 }, isActive: true },
        { $inc: { totalSeats: -1 } },
        { new: true }
      );

      if (branch) {
        allocated = branch;
        break;
      }
    }

    if (allocated) {
      const record = await Allocation.create({
        student: student._id,
        admissionRound: round._id,
        branch: allocated._id,
        rankAtAllocation: student.rank,
        status: 'provisional'
      });
      results.push(record);
    }
  }

  round.status = 'allocation_completed';
  await round.save();

  return res.json({
    success: true,
    message: 'Allocation run completed.',
    data: { allocated: results.length, results }
  });
});

export const myAllocation = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  const data = await Allocation.find({ student: student._id })
    .populate({ path: 'branch', populate: { path: 'college' } })
    .populate('admissionRound');

  res.json({ success: true, data });
});

export const listAllocations = asyncHandler(async (req, res) => {
  const data = await Allocation.find()
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .populate({ path: 'branch', populate: { path: 'college' } })
    .populate('admissionRound');

  res.json({ success: true, data });
});
