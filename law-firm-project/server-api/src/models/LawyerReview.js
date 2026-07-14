import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawyerReview = sequelize.define('LawyerReview', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  booking_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  lawyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('VISIBLE', 'HIDDEN'), allowNull: false, defaultValue: 'VISIBLE' },
}, { tableName: 'lawyer_reviews', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
