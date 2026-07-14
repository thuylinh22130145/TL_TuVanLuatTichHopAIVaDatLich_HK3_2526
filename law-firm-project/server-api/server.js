import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDatabase, sequelize } from './src/config/database.js';
import './src/models/index.js';

async function start() {
  try {
    await connectDatabase();
    // SQLite: không dùng alter (tránh lỗi FK khi migrate)
    const syncOptions =
      env.db.dialect === 'mysql' && env.nodeEnv === 'development'
        ? { alter: true }
        : {};
    await sequelize.sync(syncOptions);

    app.listen(env.port, () => {
      console.log(`[API] server-api listening on http://localhost:${env.port}`);
      console.log(`[API] Public:  http://localhost:${env.port}/api/public`);
      console.log(`[API] Admin:   http://localhost:${env.port}/api/admin`);
      console.log(`[AI]  Proxy → ${env.ai.serviceUrl} (LLM mock trên server-ai)`);
    });
  } catch (err) {
    console.error('[API] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
