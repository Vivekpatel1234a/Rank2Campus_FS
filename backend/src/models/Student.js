import mongoose from 'mongoose';
import { calculateProfileCompletion } from '../utils/profile.js';

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  applicationNumber: { type: String, unique: true, sparse: true },
  fullName: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  state: { type: String, default: '' },
  city: { type: String, default: '' },
  category: { type: String, enum: ['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST'], default: 'OPEN' },
  subcategory: { type: String, default: '' },
  examName: { type: String, default: 'JEE Main' },
  rank: { type: Number, min: 1, default: null },
  score: { type: Number, min: 0, default: null },
  percentile: { type: Number, min: 0, max: 100, default: null },
  academicInfo: {
    board: { type: String, default: '' },
    schoolName: { type: String, default: '' },
    stream: { type: String, default: '' },
    class10Percentage: { type: Number, min: 0, max: 100, default: null },
    class12Percentage: { type: Number, min: 0, max: 100, default: null }
  },
  interestedBranches: [{ type: String, trim: true }],
  profileCompleted: { type: Boolean, default: false },
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

function computeProfileCompletion(student) {
  const result = calculateProfileCompletion(student);
  student.profileCompletion = result.profileCompletion;
  student.profileCompleted = result.profileCompleted;
}

studentSchema.pre('save', function(next) {
  computeProfileCompletion(this);
  next();
});

studentSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  const payload = update && update.$set ? update.$set : update;
  if (payload && typeof payload === 'object') {
    const maybeStudent = { ...payload };
    const fieldsToCheck = [
      'fullName', 'dateOfBirth', 'gender', 'state', 'city', 'category', 'examName', 'rank', 'score', 'percentile', 'interestedBranches', 'academicInfo'
    ];

    const base = { ...payload };
    for (const key of fieldsToCheck) {
      if (key in base) {
        maybeStudent[key] = base[key];
      }
    }
    const fakeStudent = {
      ...maybeStudent,
      academicInfo: maybeStudent.academicInfo || {}
    };
    const result = calculateProfileCompletion(fakeStudent);
    if (payload.$set) {
      payload.$set.profileCompletion = result.profileCompletion;
      payload.$set.profileCompleted = result.profileCompleted;
    } else {
      payload.profileCompletion = result.profileCompletion;
      payload.profileCompleted = result.profileCompleted;
    }
  }
  next();
});

export default mongoose.model('Student', studentSchema);
