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

export async function connectDatabase() {
  await sequelize.authenticate();
  if (env.db.dialect === 'mysql') {
    console.log('[DB] MySQL connected:', env.db.name);
  } else {
    console.log('[DB] SQLite connected:', env.db.storage);
  }
}
