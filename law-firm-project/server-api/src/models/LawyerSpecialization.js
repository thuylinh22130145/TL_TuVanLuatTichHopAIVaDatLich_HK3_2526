import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawyerSpecialization = sequelize.define('LawyerSpecialization', {
  lawyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'lawyer_specializations', timestamps: false });
