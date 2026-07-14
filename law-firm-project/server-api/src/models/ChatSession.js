import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ChatSession = sequelize.define('ChatSession', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: true },
  detected_category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'chat_sessions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
