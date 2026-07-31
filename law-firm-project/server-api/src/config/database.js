import { Sequelize } from 'sequelize';
import { env } from './env.js';

const commonDefine = {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

function createSequelize() {
  if (env.db.dialect === 'mysql') {
    return new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: 'mysql',
      logging: env.nodeEnv === 'development' ? console.log : false,
      define: commonDefine,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    });
  }

  return new Sequelize({
    dialect: 'sqlite',
    storage: env.db.storage,
    logging: env.nodeEnv === 'development' ? console.log : false,
    define: commonDefine,
  });
}

export const sequelize = createSequelize();

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function connectDatabase() {
  const attempts = Math.max(1, env.db.connectRetries);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      if (env.db.dialect === 'mysql') {
        console.log(
          `[DB] MySQL connected: ${env.db.name} (${env.db.host}:${env.db.port})`,
        );
      } else {
        console.log('[DB] SQLite connected:', env.db.storage);
      }
      return;
    } catch (error) {
      if (attempt === attempts) {
        throw new Error(
          `Không thể kết nối ${env.db.dialect} sau ${attempts} lần: ${error.message}`,
          { cause: error },
        );
      }

      console.warn(
        `[DB] Chưa kết nối được (${attempt}/${attempts}): ${error.message}. `
          + `Thử lại sau ${env.db.retryDelayMs}ms...`,
      );
      await wait(env.db.retryDelayMs);
    }
  }
}
