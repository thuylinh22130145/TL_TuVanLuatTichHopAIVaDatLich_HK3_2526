import * as documentService from '../../services/documentService.js';
import { ApiError } from '../../utils/ApiError.js';

export async function list(req, res) {
  const documents = await documentService.listDocuments();
  res.json({ success: true, data: documents });
}

export async function getOne(req, res) {
  const doc = await documentService.getDocument(req.params.docId);
  res.json({ success: true, data: doc });
}

export async function create(req, res) {
  const { doc_id, title, specialization, content, file_type } = req.body;
  if (!doc_id || !title || !specialization || !content) {
    throw new ApiError(400, 'doc_id, title, specialization, content là bắt buộc');
  }
  const doc = await documentService.createDocument({
    doc_id,
    title,
    specialization,
    content,
    file_type: file_type || 'txt',
  });
  res.status(201).json({ success: true, data: doc, message: 'Đã thêm tài liệu và tải lại RAG' });
}

export async function uploadPdf(req, res) {
  const { doc_id, title, specialization } = req.body;
  if (!doc_id || !title || !specialization || !req.file) {
    throw new ApiError(400, 'doc_id, title, specialization và file PDF là bắt buộc');
  }

  const doc = await documentService.uploadPdfDocument(
    { doc_id, title, specialization },
    req.file,
  );
  res.status(201).json({
    success: true,
    data: doc,
    message: 'Đã tải PDF, trích xuất nội dung và nạp lại RAG',
  });
}
export async function update(req, res) {
  const { title, specialization, content } = req.body;
  if (title === undefined && specialization === undefined && content === undefined) {
    throw new ApiError(400, 'Cần ít nhất một trường để cập nhật');
  }
  const doc = await documentService.updateDocument(req.params.docId, {
    title,
    specialization,
    content,
  });
  res.json({ success: true, data: doc, message: 'Đã cập nhật tài liệu và tải lại RAG' });
}

export async function remove(req, res) {
  await documentService.deleteDocument(req.params.docId);
  res.json({ success: true, message: 'Đã xóa tài liệu và tải lại RAG' });
}
