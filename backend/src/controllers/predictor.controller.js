import Cutoff from '../models/Cutoff.js';
import Branch from '../models/Branch.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function classifyCutoffMatch(studentRank, closingRank) {
 const numericStudentRank = Number(studentRank);
 const numericClosingRank = Number(closingRank);

 if (!Number.isFinite(numericStudentRank) || numericStudentRank < 1 ||
     !Number.isFinite(numericClosingRank) || numericClosingRank < 1) {
   return null;
 }

 const ratio = numericStudentRank / numericClosingRank;
 const chance = ratio <= 0.8 ? 'Safe' : ratio <= 1.15 ? 'Moderate' : 'Risky';
 const matchScore = Math.max(0, Math.min(99, Math.round(100 - (ratio - 1) * 100)));

 return { chance, matchScore };
}

export const predict = asyncHandler(async(req,res) => {
 const { rank, category='OPEN', examName='JEE Main', year, preferredLocation } = req.body;
 const numericRank = Number(rank);
 if (!Number.isInteger(numericRank) || numericRank < 1) return res.status(400).json({success:false,message:'Enter a valid positive rank.'});
 const cutoffYear = Number(year) || new Date().getFullYear()-1;
 const records = await Cutoff.find({ category, examName, year: cutoffYear })
   .populate({path:'branch',populate:{path:'college'}}).lean();
 const data = records.filter(r => r.branch && r.branch.college && r.branch.isActive)
   .map(r => {
     const cutoff = r.closingRank;
     const match = classifyCutoffMatch(numericRank, cutoff);
     if (!match) return null;
     return { college:r.branch.college.name, location:r.branch.college.location, branch:r.branch.name, branchId:r.branch._id, cutoffYear, closingRank:cutoff, studentRank:numericRank, category, chance:match.chance, matchScore:match.matchScore };
   }).filter(Boolean).filter(x => !preferredLocation || x.location.toLowerCase().includes(preferredLocation.toLowerCase()))
   .sort((a,b) => ({Safe:0,Moderate:1,Risky:2}[a.chance]-({Safe:0,Moderate:1,Risky:2}[b.chance])) || a.closingRank-b.closingRank);
 res.json({success:true,meta:{rank:numericRank,category,cutoffYear,recordsFound:data.length,notice:'Advisory estimate based on stored historical cutoffs; not an admission guarantee.'},data});
});
