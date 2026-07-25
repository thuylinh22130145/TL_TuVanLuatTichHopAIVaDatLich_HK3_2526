import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const EmailOtp = sequelize.define(
  'EmailOtp',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    purpose: {
      type: DataTypes.ENUM('REGISTER'),
      allowNull: false,
      defaultValue: 'REGISTER',
    },
    code_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    consumed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'email_otps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id', 'purpose', 'created_at'] },
      { fields: ['expires_at'] },
    ],
  }
);
