import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LegalCategory = sequelize.define('LegalCategory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), allowNull: false, defaultValue: 'ACTIVE' },
}, { tableName: 'legal_categories', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
