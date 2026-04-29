import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBudgets, setBudget } from '../controllers/budgetsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getBudgets);
router.post('/', setBudget);

export default router;
