import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const uploadDir=path.resolve('uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)});
export const uploadDocument=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>{
 const ok=['application/pdf','image/jpeg','image/png'].includes(file.mimetype);
 cb(ok?null:new Error('Only PDF, JPG and PNG files are allowed.'),ok);
}}).single('document');

export const createDocument=asyncHandler(async(req,res)=>{
 if(!req.file)return res.status(400).json({success:false,message:'Select a document to upload.'});
 const student=await Student.findOne({user:req.user._id});
 const doc=await Document.create({student:student._id,type:req.body.type,originalName:req.file.originalname,fileName:req.file.filename,mimeType:req.file.mimetype,size:req.file.size});
 res.status(201).json({success:true,data:doc});
});
export const myDocuments=asyncHandler(async(req,res)=>{
 const student=await Student.findOne({user:req.user._id});
 res.json({success:true,data:await Document.find({student:student._id}).sort({createdAt:-1})});
});
export const allDocuments=asyncHandler(async(_req,res)=>res.json({success:true,data:await Document.find().populate({path:'student',populate:{path:'user',select:'name email'}}).sort({createdAt:-1})}));
export const reviewDocument=asyncHandler(async(req,res)=>{
 const {status,reviewNote=''}=req.body;
 if(!['approved','rejected'].includes(status))return res.status(400).json({success:false,message:'Status must be approved or rejected.'});
 const doc=await Document.findByIdAndUpdate(req.params.id,{status,reviewNote,reviewedBy:req.user._id,reviewedAt:new Date()},{new:true,runValidators:true});
 if(!doc)return res.status(404).json({success:false,message:'Document not found.'});
 res.json({success:true,data:doc});
});
