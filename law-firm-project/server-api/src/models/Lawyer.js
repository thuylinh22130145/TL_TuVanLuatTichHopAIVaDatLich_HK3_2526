import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Lawyer = sequelize.define(
  'Lawyer',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    // Liên kết tới bảng users
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },

    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: 'Luật sư',
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    specialization: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Chuyên môn',
    },

    experience_years: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    availability_status: {
      type: DataTypes.ENUM('AVAILABLE', 'BUSY', 'OFFLINE'),
      allowNull: false,
      defaultValue: 'AVAILABLE',
    },

    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'lawyers',

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',

    indexes: [
      { fields: ['specialization'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
    ],
  }
);
