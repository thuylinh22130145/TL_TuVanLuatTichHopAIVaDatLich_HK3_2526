import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

export const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  booking_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  lawyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  customer_name: { type: DataTypes.STRING(120), allowNull: false },
  customer_phone: { type: DataTypes.STRING(20), allowNull: false },
  customer_email: { type: DataTypes.STRING(120), allowNull: false, validate: { isEmail: true } },
  appointment_date: { type: DataTypes.DATE, allowNull: false },
  duration_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60, validate: { min: 15, max: 480 } },
  summary_issue: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM(...BOOKING_STATUSES), allowNull: false, defaultValue: 'PENDING' },
  cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['booking_code'] },
    { fields: ['user_id', 'appointment_date'] },
    { fields: ['lawyer_id', 'appointment_date'] },
    { fields: ['status'] },
  ],
});
