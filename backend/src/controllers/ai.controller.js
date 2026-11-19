import ChatMessage from '../models/ChatMessage.js';
import {asyncHandler} from '../utils/asyncHandler.js';
export const chat=asyncHandler(async(req,res)=>{
 const {message}=req.body;
 if(!message||typeof message!=='string'||message.trim().length>3000)return res.status(400).json({success:false,message:'Enter a message (maximum 3000 characters).'});
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.status(503).json({success:false,message:'AI counsellor is not configured. Add GEMINI_API_KEY to backend/.env.'});
 const model=process.env.GEMINI_MODEL||'gemini-2.0-flash';
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:'You are Rank2Campus Neural Advisor. Give responsible, practical college and career counselling. Never guarantee admission. Ask for exam, rank, category and preferences when needed. Clearly distinguish estimates from official information.'}]},contents:[{role:'user',parts:[{text:message}]}]})});
 const payload=await response.json();
 if(!response.ok) return res.status(502).json({success:false,message:payload.error?.message||'AI provider request failed.'});
 const answer=payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'I could not generate a response.';
 await ChatMessage.create({user:req.user._id,role:'user',message:message.trim()});
 await ChatMessage.create({user:req.user._id,role:'assistant',message:answer});
 res.json({success:true,answer});
});
export const history=asyncHandler(async(req,res)=>res.json({success:true,data:await ChatMessage.find({user:req.user._id}).sort({createdAt:1}).limit(100)}));
