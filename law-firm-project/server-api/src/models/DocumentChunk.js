import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const DocumentChunk = sequelize.define('DocumentChunk', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  chunk_index: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  content: { type: DataTypes.TEXT('long'), allowNull: false },
  token_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'document_chunks', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['document_id', 'chunk_index'] }],
});
