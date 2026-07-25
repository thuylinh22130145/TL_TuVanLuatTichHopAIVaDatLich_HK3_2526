import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    role: {
      type: DataTypes.ENUM('ADMIN', 'LAWYER', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    },

    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },

    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',

    timestamps: true,

    createdAt: 'created_at',

    updatedAt: 'updated_at',
  }
);