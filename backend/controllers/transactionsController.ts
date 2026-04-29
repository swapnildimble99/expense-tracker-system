import { Response } from 'express';
import { db } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await db.query('SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC', [req.userId]);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions", error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
};

export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, category, type, description, date } = req.body;
    
    if (!amount || !category || !type || !date) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const receipt = await db.query(
      'INSERT INTO transactions (userId, amount, category, type, description, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, amount, category, type, description || '', date]
    );

    res.status(201).json({ message: 'Transaction added successfully' });
  } catch (error) {
    console.error("Error adding transaction", error);
    res.status(500).json({ error: 'Server error adding transaction' });
  }
};

export const editTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, category, type, description, date } = req.body;
    
    // Ensure ownership
    const tx: any = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (tx.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    if (String(tx[0].userId) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query(
      'UPDATE transactions SET amount = ?, category = ?, type = ?, description = ?, date = ? WHERE id = ?',
      [amount, category, type, description || '', date, id]
    );

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error("Error updating transaction", error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Ensure ownership
    const tx: any = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);
    if (tx.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    if (String(tx[0].userId) !== String(req.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error("Error deleting transaction", error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
};
