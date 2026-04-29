import { Response } from 'express';
import { db } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const budgets = await db.query('SELECT * FROM budgets WHERE userId = ?', [req.userId]);
    res.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets", error);
    res.status(500).json({ error: 'Server error fetching budgets' });
  }
};

export const setBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount } = req.body;
    
    if (!category || amount === undefined) {
      return res.status(400).json({ error: 'Please provide category and amount' });
    }

    // Check existing
    const existing: any = await db.query('SELECT id FROM budgets WHERE userId = ? AND category = ?', [req.userId, category]);
    if (existing && existing.length > 0) {
      await db.query('UPDATE budgets SET amount = ? WHERE id = ?', [amount, existing[0].id]);
    } else {
      await db.query('INSERT INTO budgets (userId, category, amount) VALUES (?, ?, ?)', [req.userId, category, amount]);
    }

    res.status(200).json({ message: 'Budget saved successfully' });
  } catch (error) {
    console.error("Error setting budget", error);
    res.status(500).json({ error: 'Server error setting budget' });
  }
};
