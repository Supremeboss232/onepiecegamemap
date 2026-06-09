import fs from 'fs';
import path from 'path';
import pool from '../src/db.js';

const sql = fs.readFileSync(path.join('db','migrations','001_schema.sql'), 'utf8');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migration applied');
  } catch (err) {
    console.error('Migration error', err.stack || err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
