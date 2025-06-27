import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Path to the SQLite database file
const dbPath = path.join(__dirname, '../remixer.db');
const db = new Database(dbPath);

// Run schema.sql to initialize tables if they don't exist
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

export default db;
