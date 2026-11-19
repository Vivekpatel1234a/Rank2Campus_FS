import Notification from '../models/Notification.js';
import {asyncHandler} from '../utils/asyncHandler.js';
export const listNotifications=asyncHandler(async(req,res)=>{
 const data=await Notification.find({audience:{$in:['all',req.user.role]}}).sort({createdAt:-1}).limit(100).lean();
 res.json({success:true,data:data.map(n=>({...n,isRead:n.readBy.some(id=>String(id)===String(req.user._id))}))});
});
export const createNotification=asyncHandler(async(req,res)=>{
 const {title,message,audience='all'}=req.body;
 if(!title||!message)return res.status(400).json({success:false,message:'Title and message are required.'});
 res.status(201).json({success:true,data:await Notification.create({title,message,audience,createdBy:req.user._id})});
});
export const markRead=asyncHandler(async(req,res)=>{
 const item=await Notification.findByIdAndUpdate(req.params.id,{$addToSet:{readBy:req.user._id}},{new:true});
 if(!item)return res.status(404).json({success:false,message:'Notification not found.'});
 res.json({success:true,data:item});
});
