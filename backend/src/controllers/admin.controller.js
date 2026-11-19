import mongoose from 'mongoose';
import AdmissionRound from '../models/AdmissionRound.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Document from '../models/Document.js';
import College from '../models/College.js';
import Branch from '../models/Branch.js';
import Allocation from '../models/Allocation.js';
import Cutoff from '../models/Cutoff.js';
import Preference from '../models/Preference.js';
import ChatMessage from '../models/ChatMessage.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';

import { asyncHandler } from '../utils/asyncHandler.js';

// Admin Dashboard
export const dashboard = asyncHandler(async (_req, res) => {
    const [
        students,
        pendingDocuments,
        approvedDocuments,
        colleges,
        branches,
        allocations,
        activeRounds,
        acceptedAllocations,
        profileSummary
    ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Document.countDocuments({ status: 'pending' }),
        Document.countDocuments({ status: 'approved' }),
        College.countDocuments({ isActive: true }),
        Branch.countDocuments({ isActive: true }),
        Allocation.countDocuments({}),
        AdmissionRound.countDocuments({ status: { $in: ['open', 'allocation_completed'] } }),
        Allocation.countDocuments({ status: 'accepted' }),
        Student.aggregate([
            {
                $group: {
                    _id: null,
                    averageProfileCompletion: { $avg: { $ifNull: ['$profileCompletion', 0] } },
                    totalStudents: { $sum: 1 }
                }
            }
        ])
    ]);

    const averageProfileCompletion = Math.round(profileSummary[0]?.averageProfileCompletion ?? 0);

    res.json({
        success: true,
        data: {
            students,
            pendingDocuments,
            approvedDocuments,
            colleges,
            branches,
            allocations,
            activeRounds,
            acceptedAllocations,
            averageProfileCompletion,
            profileReadiness: Math.min(100, Math.max(0, averageProfileCompletion))
        }
    });
});

export const reports = asyncHandler(async (_req, res) => {
    const [
        studentsByCategory,
        documentStatus,
        roundStatus,
        lockedPreferenceBreakdown,
        preferenceActivity,
        topColleges,
        recentAllocations
    ] = await Promise.all([
        Student.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        Document.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        AdmissionRound.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } }
        ]),
        Preference.aggregate([
            { $match: { isLocked: true } },
            { $group: { _id: '$admissionRound', count: { $sum: 1 } } },
            { $lookup: { from: 'admissionrounds', localField: '_id', foreignField: '_id', as: 'round' } },
            { $unwind: '$round' },
            { $project: { _id: 0, roundName: '$round.name', count: 1 } },
            { $sort: { count: -1, roundName: 1 } }
        ]),
        Preference.aggregate([
            { $group: { _id: '$admissionRound', count: { $sum: 1 } } },
            { $lookup: { from: 'admissionrounds', localField: '_id', foreignField: '_id', as: 'round' } },
            { $unwind: '$round' },
            { $project: { _id: 0, roundName: '$round.name', totalPreferences: '$count' } },
            { $sort: { totalPreferences: -1, roundName: 1 } }
        ]),
        Branch.aggregate([
            { $lookup: { from: 'colleges', localField: 'college', foreignField: '_id', as: 'collegeInfo' } },
            { $unwind: '$collegeInfo' },
            { $group: { _id: '$collegeInfo.name', totalSeats: { $sum: '$totalSeats' }, branchCount: { $sum: 1 } } },
            { $sort: { totalSeats: -1 } },
            { $limit: 5 }
        ]),
        Allocation.aggregate([
            { $lookup: { from: 'admissionrounds', localField: 'admissionRound', foreignField: '_id', as: 'round' } },
            { $unwind: '$round' },
            { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } },
            { $unwind: '$branchInfo' },
            { $lookup: { from: 'colleges', localField: 'branchInfo.college', foreignField: '_id', as: 'collegeInfo' } },
            { $unwind: '$collegeInfo' },
            { $project: { _id: 0, round: '$round.name', college: '$collegeInfo.name', branch: '$branchInfo.name', status: 1, createdAt: 1 } },
            { $sort: { createdAt: -1 } },
            { $limit: 8 }
        ])
    ]);

    res.json({
        success: true,
        data: {
            studentsByCategory,
            documentStatus,
            roundStatus,
            lockedPreferenceBreakdown,
            preferenceActivity,
            topColleges,
            recentAllocations
        }
    });
});

export const exportReports = asyncHandler(async (_req, res) => {
    const { studentsByCategory, documentStatus, roundStatus, lockedPreferenceBreakdown, preferenceActivity, topColleges, recentAllocations } = await (async () => {
        const [students, documents, rounds, locked, totalPreferences, colleges, allocations] = await Promise.all([
            Student.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
            Document.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
            AdmissionRound.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
            Preference.aggregate([{ $match: { isLocked: true } }, { $group: { _id: '$admissionRound', count: { $sum: 1 } } }, { $lookup: { from: 'admissionrounds', localField: '_id', foreignField: '_id', as: 'round' } }, { $unwind: '$round' }, { $project: { _id: 0, roundName: '$round.name', count: 1 } }, { $sort: { count: -1, roundName: 1 } }]),
            Preference.aggregate([{ $group: { _id: '$admissionRound', count: { $sum: 1 } } }, { $lookup: { from: 'admissionrounds', localField: '_id', foreignField: '_id', as: 'round' } }, { $unwind: '$round' }, { $project: { _id: 0, roundName: '$round.name', totalPreferences: '$count' } }, { $sort: { totalPreferences: -1, roundName: 1 } }]),
            Branch.aggregate([{ $lookup: { from: 'colleges', localField: 'college', foreignField: '_id', as: 'collegeInfo' } }, { $unwind: '$collegeInfo' }, { $group: { _id: '$collegeInfo.name', totalSeats: { $sum: '$totalSeats' }, branchCount: { $sum: 1 } } }, { $sort: { totalSeats: -1 } }, { $limit: 5 }]),
            Allocation.aggregate([{ $lookup: { from: 'admissionrounds', localField: 'admissionRound', foreignField: '_id', as: 'round' } }, { $unwind: '$round' }, { $lookup: { from: 'branches', localField: 'branch', foreignField: '_id', as: 'branchInfo' } }, { $unwind: '$branchInfo' }, { $lookup: { from: 'colleges', localField: 'branchInfo.college', foreignField: '_id', as: 'collegeInfo' } }, { $unwind: '$collegeInfo' }, { $project: { _id: 0, round: '$round.name', college: '$collegeInfo.name', branch: '$branchInfo.name', status: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }, { $limit: 8 }])
        ]);

        return { studentsByCategory: students, documentStatus: documents, roundStatus: rounds, lockedPreferenceBreakdown: locked, preferenceActivity: totalPreferences, topColleges: colleges, recentAllocations: allocations };
    })();

    const rows = [
        ['Section', 'Metric', 'Value'],
        ['Category Mix', 'Total categories', String(studentsByCategory.length)],
        ...studentsByCategory.map((entry) => ['Category Mix', entry._id || 'Unspecified', String(entry.count)]),
        ['Document Status', 'Total statuses', String(documentStatus.length)],
        ...documentStatus.map((entry) => ['Document Status', entry._id || 'Unknown', String(entry.count)]),
        ['Round Status', 'Total statuses', String(roundStatus.length)],
        ...roundStatus.map((entry) => ['Round Status', entry._id || 'Unknown', String(entry.count)]),
        ['Locked Preferences', 'Total locked groups', String(lockedPreferenceBreakdown.length)],
        ...lockedPreferenceBreakdown.map((entry) => ['Locked Preferences', entry.roundName || 'Unknown round', String(entry.count)]),
        ['Recent Allocations', 'Total offer records', String(recentAllocations.length)],
        ...recentAllocations.map((entry) => ['Recent Allocations', `${entry.round} | ${entry.college} | ${entry.branch}`, entry.status || 'pending'])
    ];

    const csv = rows
        .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rank2campus-report.csv"');
    res.send(csv);
});

const clearStudentCycleData = async () => {
    const preservedCatalog = {
        colleges: await College.countDocuments({ isActive: true }),
        branches: await Branch.countDocuments({ isActive: true }),
        cutoffs: await Cutoff.countDocuments({})
    };

    const studentUsers = await User.find({ role: 'student' }, '_id');
    const studentUserIds = studentUsers.map((user) => user._id);
    const studentRecords = await Student.find({ user: { $in: studentUserIds } }, '_id');
    const studentRecordIds = studentRecords.map((student) => student._id);

    await Promise.all([
        Student.deleteMany({ user: { $in: studentUserIds } }),
        Document.deleteMany({ student: { $in: studentRecordIds } }),
        Preference.deleteMany({ student: { $in: studentRecordIds } }),
        Allocation.deleteMany({ student: { $in: studentRecordIds } }),
        Application.deleteMany({ student: { $in: studentRecordIds } }),
        ChatMessage.deleteMany({ user: { $in: studentUserIds } }),
        Notification.deleteMany({}),
        AdmissionRound.deleteMany({})
    ]);

    if (studentUserIds.length > 0) {
        await User.deleteMany({ _id: { $in: studentUserIds } });
    }

    return {
        clearedStudentAccounts: studentUserIds.length,
        preservedCatalog
    };
};

export const resetAdmissionCycle = asyncHandler(async (_req, res) => {
    const { clearedStudentAccounts, preservedCatalog } = await clearStudentCycleData();

    res.json({
        success: true,
        message: 'Admission cycle reset successfully. Colleges, branches, and historical cutoff data were preserved.',
        data: {
            clearedStudentAccounts,
            clearedRounds: 0,
            preservedCatalog,
            note: 'All current student data, documents, preferences, allocations, and notifications were removed to start the next cycle cleanly. The institution catalog remains protected.'
        }
    });
});

export const seedFreshCycle = asyncHandler(async (req, res) => {
    const requestedYear = Number(req.body?.year || new Date().getFullYear() + 1);
    const { clearedStudentAccounts, preservedCatalog } = await clearStudentCycleData();

    const admin = await User.findOne({ role: 'admin' });
    const roundName = `Demo Counselling Round ${requestedYear}`;

    await AdmissionRound.create({
        name: roundName,
        year: requestedYear,
        status: 'open',
        createdBy: admin?._id || null
    });

    await Notification.insertMany([
        {
            title: 'Fresh cycle started',
            message: `The ${requestedYear} admission cycle is now open. Students can register, complete profiles, upload documents, and submit preferences.`,
            audience: 'student',
            createdBy: admin?._id || null
        },
        {
            title: 'New round ready',
            message: `A new counselling round, ${roundName}, has been created and is open for the upcoming cycle.`,
            audience: 'all',
            createdBy: admin?._id || null
        }
    ]);

    res.json({
        success: true,
        message: `Fresh admission cycle seeded for ${requestedYear}.`,
        data: {
            year: requestedYear,
            roundName,
            clearedStudentAccounts,
            preservedCatalog,
            nextStep: 'Students can now create new accounts, complete profiles, upload documents, and submit preferences. The college catalog will remain protected and reusable.'
        }
    });
});

// List All Students
export const listStudents = asyncHandler(async (req, res) => {
    const students = await Student.find()
        .populate('user', 'name email phone isActive')
        .sort({ createdAt: -1 })
        .limit(200);

    res.json({
        success: true,
        data: students
    });
});


// Add Cutoff
export const createCutoff = asyncHandler(async (req, res) => {
    const {
        branch,
        examName = 'JEE Main',
        year,
        round = 1,
        category,
        openingRank,
        closingRank
    } = req.body;

    if (!branch || !year || !category || !closingRank) {
        return res.status(400).json({
            success: false,
            message: 'Branch, year, category and closing rank are required.'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(branch)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid branch ID.'
        });
    }

    const branchExists = await Branch.exists({
        _id: branch,
        isActive: true
    });

    if (!branchExists) {
        return res.status(404).json({
            success: false,
            message: 'Active branch not found.'
        });
    }

    const cutoff = await Cutoff.create({
        branch,
        examName,
        year,
        round,
        category,
        openingRank,
        closingRank
    });

    res.status(201).json({
        success: true,
        message: 'Cutoff created successfully.',
        data: cutoff
    });
});


// Get All Cutoffs
export const listCutoffs = asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.year) {
        filter.year = Number(req.query.year);
    }

    if (req.query.category) {
        filter.category = req.query.category;
    }

    if (req.query.examName) {
        filter.examName = req.query.examName;
    }

    if (req.query.branch) {
        filter.branch = req.query.branch;
    }

    const cutoffs = await Cutoff.find(filter)
        .populate({
            path: 'branch',
            populate: {
                path: 'college'
            }
        })
        .sort({ year: -1, closingRank: 1 });

    res.json({
        success: true,
        count: cutoffs.length,
        data: cutoffs
    });
});


// Update Cutoff
export const updateCutoff = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cutoff ID.'
        });
    }

    const allowedFields = [
        'branch',
        'examName',
        'year',
        'round',
        'category',
        'openingRank',
        'closingRank'
    ];

    const updates = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No valid fields provided for update.'
        });
    }

    if (updates.branch) {
        if (!mongoose.Types.ObjectId.isValid(updates.branch)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID.'
            });
        }

        const branchExists = await Branch.exists({
            _id: updates.branch,
            isActive: true
        });

        if (!branchExists) {
            return res.status(404).json({
                success: false,
                message: 'Active branch not found.'
            });
        }
    }

    const cutoff = await Cutoff.findByIdAndUpdate(
        id,
        updates,
        {
            new: true,
            runValidators: true
        }
    );

    if (!cutoff) {
        return res.status(404).json({
            success: false,
            message: 'Cutoff record not found.'
        });
    }

    res.json({
        success: true,
        message: 'Cutoff updated successfully.',
        data: cutoff
    });
});


// Delete Cutoff
export const deleteCutoff = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cutoff ID.'
        });
    }

    const cutoff = await Cutoff.findByIdAndDelete(id);

    if (!cutoff) {
        return res.status(404).json({
            success: false,
            message: 'Cutoff record not found.'
        });
    }

    res.json({
        success: true,
        message: 'Cutoff deleted successfully.'
    });
});


// Create Admission Round
export const createAdmissionRound = asyncHandler(async (req, res) => {
    const { name, year, startsAt, endsAt, status = 'upcoming' } = req.body;

    if (!name || !year) {
        return res.status(400).json({
            success: false,
            message: 'Round name and year are required.'
        });
    }

    if (!['upcoming', 'open', 'closed', 'allocation_completed'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid round status.'
        });
    }

    if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after start date.'
        });
    }

    const round = await AdmissionRound.create({
        name,
        year,
        status,
        startsAt,
        endsAt,
        createdBy: req.user._id
    });

    res.status(201).json({
        success: true,
        message: 'Admission round created successfully.',
        data: round
    });
});


// Get All Admission Rounds
export const listAdmissionRounds = asyncHandler(async (req, res) => {
    const rounds = await AdmissionRound.find()
        .populate('createdBy', 'name email')
        .sort({ year: -1, createdAt: -1 });

    res.json({
        success: true,
        count: rounds.length,
        data: rounds
    });
});


// Update Admission Round
export const updateAdmissionRound = asyncHandler(async (req, res) => {
    const allowedFields = [
        'name',
        'year',
        'status',
        'startsAt',
        'endsAt'
    ];

    const updates = {};

    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No valid fields provided.'
        });
    }

    const currentRound = await AdmissionRound.findById(req.params.id);

    if (!currentRound) {
        return res.status(404).json({
            success: false,
            message: 'Admission round not found.'
        });
    }

    const start = updates.startsAt ?? currentRound.startsAt;
    const end = updates.endsAt ?? currentRound.endsAt;

    if (start && end && new Date(start) >= new Date(end)) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after start date.'
        });
    }

    Object.assign(currentRound, updates);
    await currentRound.save();

    res.json({
        success: true,
        message: 'Admission round updated successfully.',
        data: currentRound
    });
});


// Delete Admission Round
export const deleteAdmissionRound = asyncHandler(async (req, res) => {
    const round = await AdmissionRound.findById(req.params.id);

    if (!round) {
        return res.status(404).json({
            success: false,
            message: 'Admission round not found.'
        });
    }

    const Preference = (await import('../models/Preference.js')).default;

    const hasPreferences = await Preference.exists({
        admissionRound: round._id
    });

    if (hasPreferences) {
        return res.status(409).json({
            success: false,
            message: 'Cannot delete a round that already has student preferences.'
        });
    }

    await round.deleteOne();

    res.json({
        success: true,
        message: 'Admission round deleted successfully.'
    });
});