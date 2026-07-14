import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  session_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  role: { type: DataTypes.ENUM('USER', 'ASSISTANT', 'SYSTEM'), allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  source_type: { type: DataTypes.ENUM('INTERNAL_RAG', 'WEB_FALLBACK', 'NONE'), allowNull: false, defaultValue: 'NONE' },
  citations: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'chat_messages', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
  indexes: [{ fields: ['session_id', 'created_at'] }],
});
