import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDb } from './backend/db.js';
import authRoutes from './backend/routes/authRoutes.js';
import transactionRoutes from './backend/routes/transactionRoutes.js';
import budgetsRoutes from './backend/routes/budgetsRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Fixed port for AI Studio environment and standard Docker container
  const PORT = 3000;

  // Init DB
  await initDb();

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetsRoutes);

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok', db: process.env.DB_HOST ? 'mysql' : 'sqlite' }));

  // Vite + Frontend rendering
  if (!process.env.DISABLE_FRONTEND) {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
