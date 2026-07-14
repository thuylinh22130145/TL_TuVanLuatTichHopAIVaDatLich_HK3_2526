import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawDocument = sequelize.define('LawDocument', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  document_number: { type: DataTypes.STRING(100), allowNull: true },
  issuing_authority: { type: DataTypes.STRING(255), allowNull: true },
  effective_date: { type: DataTypes.DATEONLY, allowNull: true },
  file_name: { type: DataTypes.STRING(255), allowNull: false },
  file_path: { type: DataTypes.STRING(1000), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: true },
  checksum: { type: DataTypes.STRING(64), allowNull: true },
  processing_status: { type: DataTypes.ENUM('PENDING', 'PROCESSING', 'READY', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
  uploaded_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, { tableName: 'law_documents', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });
