import { useCallback, useEffect, useState } from 'react';
import * as documentService from '../../../services/documentService';
import { fetchCategories } from '../../../services/adminPortalService';

const emptyForm = {
  doc_id: '',
  title: '',
  specialization: '',
  content: '',
  file_type: 'txt',
};

const GENERAL_SPECIALIZATION = 'Tổng quát';
const DEFAULT_SPECIALIZATIONS = [
  'Doanh nghiệp',
  'Dân sự',
  'Hành chính',
  'Hình sự',
  'Hôn nhân và Gia đình',
  'Lao động',
  'Thuế',
  'Đất đai',
  GENERAL_SPECIALIZATION,
];

function errorMessage(error, fallback) {
  const detail = error.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join('; ');
  return error.response?.data?.message || detail || error.message || fallback;
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [specializations, setSpecializations] = useState(DEFAULT_SPECIALIZATIONS);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [sourceType, setSourceType] = useState('pdf');
  const [pdfFile, setPdfFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, categories] = await Promise.all([
        documentService.fetchDocuments(),
        fetchCategories(),
      ]);
      setDocuments(data);
      const activeSpecializations = categories
        .filter((category) => String(category.status || 'ACTIVE').trim().toUpperCase() !== 'INACTIVE')
        .map((category) => category.name)
        .filter(Boolean);
      setSpecializations(
        activeSpecializations.length
          ? [...new Set([...activeSpecializations, GENERAL_SPECIALIZATION])]
          : DEFAULT_SPECIALIZATIONS,
      );
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không tải được danh sách tài liệu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setSourceType('pdf');
    setPdfFile(null);
    setEditingId(null);
  };

  const startEdit = async (docId) => {
    setError('');
    setSuccess('');
    try {
      const doc = await documentService.fetchDocumentById(docId);
      setEditingId(docId);
      setSourceType(doc.file_type === 'pdf' ? 'pdf' : 'txt');
      setPdfFile(null);
      setForm({
        doc_id: doc.doc_id,
        title: doc.title,
        specialization: doc.specialization,
        content: doc.content || '',
        file_type: doc.file_type || 'txt',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(errorMessage(requestError, 'Không tải được tài liệu'));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        const payload = {
          title: form.title,
          specialization: form.specialization,
        };
        if (form.file_type !== 'pdf') payload.content = form.content;
        await documentService.updateDocument(editingId, payload);
        setSuccess('Đã cập nhật tài liệu và nạp lại RAG.');
      } else if (sourceType === 'pdf') {
        if (!pdfFile) throw new Error('Hãy chọn một file PDF tài liệu luật.');
        await documentService.uploadPdfDocument(
          {
            doc_id: form.doc_id,
            title: form.title,
            specialization: form.specialization,
          },
          pdfFile,
        );
        setSuccess('Đã tải PDF, trích xuất nội dung và nạp lại RAG.');
      } else {
        await documentService.createDocument({
          doc_id: form.doc_id,
          title: form.title,
          specialization: form.specialization,
          content: form.content,
          file_type: 'txt',
        });
        setSuccess('Đã thêm nội dung văn bản và nạp lại RAG.');
      }

      await load();
      resetForm();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Lưu tài liệu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm(`Xóa tài liệu "${docId}"? RAG sẽ được tải lại.`)) return;
    setError('');
    setSuccess('');
    try {
      await documentService.deleteDocument(docId);
      await load();
      if (editingId === docId) resetForm();
      setSuccess('Đã xóa tài liệu và nạp lại RAG.');
    } catch (requestError) {
      setError(errorMessage(requestError, 'Xóa tài liệu thất bại'));
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-law-slate">
        Tải PDF có lớp chữ hoặc nhập nội dung TXT. Sau mỗi thay đổi, Server-AI tự trích xuất và nạp lại dữ liệu RAG.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-serif text-lg font-semibold sm:col-span-2">
          {editingId ? `Sửa tài liệu: ${editingId}` : 'Thêm tài liệu mới'}
        </h3>

        {!editingId && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-law-slate">
              Mã tài liệu — không dấu, không khoảng trắng
            </span>
            <input
              className="input-field font-mono"
              placeholder="vd: nghi_quyet_204_nq_cp_2026"
              value={form.doc_id}
              onChange={(event) => setForm({ ...form, doc_id: event.target.value })}
              pattern="[a-zA-Z0-9_-]+"
              minLength={2}
              maxLength={80}
              required
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-law-slate">Tiêu đề tài liệu</span>
          <input
            className="input-field"
            placeholder="Nghị quyết 204/NQ-CP năm 2026"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-law-slate">Chuyên môn pháp luật</span>
          <select
            className="input-field"
            value={form.specialization}
            onChange={(event) => setForm({ ...form, specialization: event.target.value })}
            required
          >
            <option value="">Chọn chuyên môn</option>
            {form.specialization && !specializations.includes(form.specialization) && (
              <option value={form.specialization}>{form.specialization}</option>
            )}
            {specializations.map((specialization) => (
              <option key={specialization} value={specialization}>{specialization}</option>
            ))}
          </select>
        </label>

        {!editingId && (
          <div className="sm:col-span-2">
            <span className="mb-2 block text-xs font-medium text-law-slate">Nguồn nội dung</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSourceType('pdf')}
                className={sourceType === 'pdf' ? 'btn-primary' : 'btn-secondary'}
              >
                Tải file PDF
              </button>
              <button
                type="button"
                onClick={() => setSourceType('txt')}
                className={sourceType === 'txt' ? 'btn-primary' : 'btn-secondary'}
              >
                Nhập văn bản TXT
              </button>
            </div>
          </div>
        )}

        {!editingId && sourceType === 'pdf' && (
          <label className="block rounded-xl border border-dashed border-law-gold/60 bg-law-gold/5 p-5 sm:col-span-2">
            <span className="mb-2 block font-medium text-law-navy">Chọn tài liệu PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
              required
              className="block w-full text-sm"
            />
            <span className="mt-2 block text-xs text-law-slate">
              Tối đa 25 MB. PDF scan ảnh phải được OCR trước để hệ thống đọc được nội dung.
            </span>
          </label>
        )}

        {((!editingId && sourceType === 'txt') || (editingId && form.file_type !== 'pdf')) && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-law-slate">Nội dung văn bản</span>
            <textarea
              className="input-field font-mono text-xs"
              placeholder="Dán toàn bộ nội dung văn bản luật"
              rows={12}
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              minLength={10}
              required
            />
          </label>
        )}

        {editingId && form.file_type === 'pdf' && (
          <p className="rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-700 sm:col-span-2">
            Đây là tài liệu PDF. Bạn có thể sửa tiêu đề và chuyên môn. Muốn thay file, hãy xóa tài liệu rồi tải PDF mới.
          </p>
        )}

        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Đang xử lý PDF...' : editingId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Hủy</button>}
        </div>
      </form>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="py-6 text-center text-law-slate">Đang tải...</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-law-slate">
                <th className="py-2 pr-4">Mã</th>
                <th className="py-2 pr-4">Tiêu đề</th>
                <th className="py-2 pr-4">Chuyên môn</th>
                <th className="py-2 pr-4">File</th>
                <th className="py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.doc_id} className="border-b border-law-navy/5">
                  <td className="py-3 pr-4 font-mono text-xs">{doc.doc_id}</td>
                  <td className="py-3 pr-4 font-medium">{doc.title}</td>
                  <td className="py-3 pr-4">{doc.specialization}</td>
                  <td className="py-3 pr-4 text-xs text-law-slate">
                    {doc.file_name}{doc.size_bytes != null && ` (${doc.size_bytes} B)`}
                  </td>
                  <td className="space-x-2 py-3">
                    <button type="button" onClick={() => startEdit(doc.doc_id)} className="text-law-gold hover:underline">Sửa</button>
                    <button type="button" onClick={() => handleDelete(doc.doc_id)} className="text-red-600 hover:underline">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && documents.length === 0 && <p className="py-6 text-center text-law-slate">Chưa có tài liệu.</p>}
      </div>
    </div>
  );
}
