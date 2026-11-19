import {Router} from 'express';
import {protect,allowRoles} from '../middleware/auth.middleware.js';
import {runAllocation,myAllocation,listAllocations} from '../controllers/allocation.controller.js';
const router=Router();router.get('/mine',protect,allowRoles('student'),myAllocation);
router.get('/',protect,allowRoles('admin'),listAllocations);
router.post('/run/:roundId',protect,allowRoles('admin'),runAllocation);
export default router;
