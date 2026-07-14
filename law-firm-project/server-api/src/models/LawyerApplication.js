import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const LawyerApplication = sequelize.define(
  'LawyerApplication',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Tài khoản đăng ký luật sư nếu đã có',
    },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(120), allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
    citizen_id: { type: DataTypes.STRING(20), allowNull: true },
    address: { type: DataTypes.STRING(500), allowNull: true },
    license_number: { type: DataTypes.STRING(100), allowNull: false },
    license_issued_date: { type: DataTypes.DATEONLY, allowNull: true },
    bar_association: { type: DataTypes.STRING(150), allowNull: true },
    practice_organization: { type: DataTypes.STRING(255), allowNull: true },
    education: { type: DataTypes.STRING(255), allowNull: true },
    specialization: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Chuyên môn mà ứng viên muốn đảm nhận',
    },
    experience_years: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    message: { type: DataTypes.TEXT, allowNull: true },
    identity_document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: { isUrl: true },
    },
    lawyer_card_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: { isUrl: true },
    },
    degree_document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: { isUrl: true },
    },
    declaration_accepted_at: { type: DataTypes.DATE, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    review_note: { type: DataTypes.TEXT, allowNull: true },
    reviewed_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'Admin đã duyệt hồ sơ',
    },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'lawyer_applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['email'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['license_number'] },
      { fields: ['citizen_id'] },
    ],
  }
);