import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTransactions, addTransaction, editTransaction, deleteTransaction } from '../controllers/transactionsController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getTransactions);
router.post('/', addTransaction);
router.put('/:id', editTransaction);
router.delete('/:id', deleteTransaction);

export default router;
