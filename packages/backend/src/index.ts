import path from 'node:path';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initDatabase } from './db/database.js';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/untereats.sqlite';

async function bootstrap() {
  const db = await initDatabase(DB_PATH);
  const app = createApp(db);

  app.listen(PORT, () => {
    console.log(`UnterEats API running at http://localhost:${PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start UnterEats API:', err);
  process.exit(1);
});
