import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawyerSchedule = sequelize.define('LawyerSchedule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  lawyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  day_of_week: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 0, max: 6 } },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'lawyer_schedules', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['lawyer_id', 'day_of_week', 'start_time', 'end_time'] }],
});
