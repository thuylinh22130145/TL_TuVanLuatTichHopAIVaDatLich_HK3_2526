import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawEmbedding = sequelize.define('LawEmbedding', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  chunk_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
  model_name: { type: DataTypes.STRING(120), allowNull: false },
  dimensions: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  embedding: { type: DataTypes.JSON, allowNull: false },
}, { tableName: 'law_embeddings', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
