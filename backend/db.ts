import mysql from 'mysql2/promise';
import { createClient, Client } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to run queries across either MySQL (Docker) or SQLite (AI Studio Preview)
export interface DBConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
}

const useMySQL = process.env.DB_HOST !== undefined && process.env.DB_HOST !== '';

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Client | null = null;

if (useMySQL) {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("Using MySQL Database");
} else {
  // Fallback to SQLite (in-memory or file) for AI Studio Preview
  sqliteDb = createClient({ url: `file:${path.join(__dirname, '..', 'preview.sqlite')}` });
  console.log("Using SQLite Database (Fallback for Preview)");
}

export const db: DBConnection = {
  query: async (sql: string, params: any[] = []) => {
    if (useMySQL && mysqlPool) {
      const [rows] = await mysqlPool.execute(sql, params);
      return rows;
    } else if (sqliteDb) {
      const res = await sqliteDb.execute({ sql, args: params });
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return res.rows;
      } else {
        return { insertId: res.lastInsertRowid?.toString(), affectedRows: res.rowsAffected };
      }
    }
    throw new Error("No database configured");
  }
};

// Initialize schema
export const initDb = async () => {
  try {
    const transactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY ${useMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        userId INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL,
        description VARCHAR(255),
        date VARCHAR(50) NOT NULL
      )
    `;

    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY ${useMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `;

    const budgetsTable = `
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY ${useMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT'},
        userId INTEGER NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        UNIQUE(userId, category)
      )
    `;

    if (!useMySQL) {
      // For SQLite, standard types
      await db.query(usersTable);
      await db.query(transactionsTable);
      await db.query(budgetsTable);
    } else {
      // MySQL tweaks
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          category VARCHAR(50) NOT NULL,
          type ENUM('income','expense') NOT NULL,
          description VARCHAR(255),
          date DATE NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          category VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          UNIQUE(userId, category),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
    }
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};
