import { connectDatabase, sequelize } from '../config/database.js';
import '../models/index.js';

async function run() {
  await connectDatabase();
  await sequelize.sync();
  console.log('[DB] Tables synced');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
