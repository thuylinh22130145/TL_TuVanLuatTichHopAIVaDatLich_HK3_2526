import { User } from './User.js';
import { Staff } from './Staff.js';
import { Lawyer } from './Lawyer.js';
import { Booking } from './Booking.js';
import { LawyerApplication } from './LawyerApplication.js';
import { LegalCategory } from './LegalCategory.js';
import { LawyerSpecialization } from './LawyerSpecialization.js';
import { LawyerSchedule } from './LawyerSchedule.js';
import { LawyerReview } from './LawyerReview.js';
import { LawDocument } from './LawDocument.js';
import { DocumentChunk } from './DocumentChunk.js';
import { LawEmbedding } from './LawEmbedding.js';
import { ChatSession } from './ChatSession.js';
import { ChatMessage } from './ChatMessage.js';
import { Notification } from './Notification.js';

User.hasOne(Lawyer, { foreignKey: 'user_id', as: 'lawyerProfile' });
Lawyer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });
Lawyer.hasMany(Booking, { foreignKey: 'lawyer_id', as: 'bookings', onDelete: 'RESTRICT' });
Booking.belongsTo(Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer', onDelete: 'RESTRICT' });

User.hasMany(LawyerApplication, { foreignKey: 'user_id', as: 'lawyerApplications' });
LawyerApplication.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(LawyerApplication, { foreignKey: 'reviewed_by', as: 'reviewedLawyerApplications' });
LawyerApplication.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

Lawyer.belongsToMany(LegalCategory, {
  through: LawyerSpecialization,
  foreignKey: 'lawyer_id',
  otherKey: 'category_id',
  as: 'categories',
});
LegalCategory.belongsToMany(Lawyer, {
  through: LawyerSpecialization,
  foreignKey: 'category_id',
  otherKey: 'lawyer_id',
  as: 'lawyers',
});

Lawyer.hasMany(LawyerSchedule, { foreignKey: 'lawyer_id', as: 'schedules' });
LawyerSchedule.belongsTo(Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });

Booking.hasOne(LawyerReview, { foreignKey: 'booking_id', as: 'review' });
LawyerReview.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
User.hasMany(LawyerReview, { foreignKey: 'user_id', as: 'lawyerReviews' });
LawyerReview.belongsTo(User, { foreignKey: 'user_id', as: 'customer' });
Lawyer.hasMany(LawyerReview, { foreignKey: 'lawyer_id', as: 'reviews' });
LawyerReview.belongsTo(Lawyer, { foreignKey: 'lawyer_id', as: 'lawyer' });

LegalCategory.hasMany(LawDocument, { foreignKey: 'category_id', as: 'documents' });
LawDocument.belongsTo(LegalCategory, { foreignKey: 'category_id', as: 'category' });
User.hasMany(LawDocument, { foreignKey: 'uploaded_by', as: 'uploadedDocuments' });
LawDocument.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
LawDocument.hasMany(DocumentChunk, { foreignKey: 'document_id', as: 'chunks' });
DocumentChunk.belongsTo(LawDocument, { foreignKey: 'document_id', as: 'document' });
DocumentChunk.hasOne(LawEmbedding, { foreignKey: 'chunk_id', as: 'embedding' });
LawEmbedding.belongsTo(DocumentChunk, { foreignKey: 'chunk_id', as: 'chunk' });

User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });
ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
LegalCategory.hasMany(ChatSession, { foreignKey: 'detected_category_id', as: 'chatSessions' });
ChatSession.belongsTo(LegalCategory, { foreignKey: 'detected_category_id', as: 'detectedCategory' });
ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id', as: 'session' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export {
  User, Staff, Lawyer, Booking, LawyerApplication, LegalCategory,
  LawyerSpecialization, LawyerSchedule, LawyerReview, LawDocument,
  DocumentChunk, LawEmbedding, ChatSession, ChatMessage, Notification,
};

export default {
  User, Staff, Lawyer, Booking, LawyerApplication, LegalCategory,
  LawyerSpecialization, LawyerSchedule, LawyerReview, LawDocument,
  DocumentChunk, LawEmbedding, ChatSession, ChatMessage, Notification,
};
