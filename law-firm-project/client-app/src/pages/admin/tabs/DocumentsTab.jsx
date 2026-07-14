import { useCallback, useEffect, useState } from 'react';
import * as documentService from '../../../services/documentService';

const emptyForm = {
  doc_id: '',
  title: '',
  specialization: '',
  content: '',
};

const SPECIALIZATIONS = [
  'Hôn nhân gia đình',
  'Đất đai',
  'Hình sự',
  'Doanh nghiệp',
  'Lao động',
  'Tổng quát',
];

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.fetchDocuments();
      setDocuments(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = async (docId) => {
    setError('');
    try {
      const doc = await documentService.fetchDocumentById(docId);
      setEditingId(docId);
      setForm({
        doc_id: doc.doc_id,
        title: doc.title,
        specialization: doc.specialization,
        content: doc.content || '',
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await documentService.updateDocument(editingId, {
          title: form.title,
          specialization: form.specialization,
          content: form.content,
        });
      } else {
        await documentService.createDocument({
          doc_id: form.doc_id,
          title: form.title,
          specialization: form.specialization,
          content: form.content,
          file_type: 'txt',
        });
      }
      await load();
      resetForm();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm(`Xóa tài liệu "${docId}"? RAG sẽ được tải lại.`)) return;
    setError('');
    try {
      await documentService.deleteDocument(docId);
      await load();
      if (editingId === docId) resetForm();
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-law-slate">
        Cập nhật kho văn bản luật dùng cho RAG. Sau mỗi thay đổi, Server-AI tự tải lại dữ liệu.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-serif text-lg font-semibold sm:col-span-2">
          {editingId ? `Sửa tài liệu: ${editingId}` : 'Thêm tài liệu mới'}
        </h3>

        {!editingId && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-law-slate">
              Mã tài liệu (doc_id) — chỉ chữ, số, _ -
            </span>
            <input
              className="input-field font-mono"
              placeholder="vd: lao_dong_2024"
              value={form.doc_id}
              onChange={(e) => setForm({ ...form, doc_id: e.target.value })}
              pattern="[a-zA-Z0-9_-]+"
              required
            />
          </label>
        )}

        <input
          className="input-field"
          placeholder="Tiêu đề"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <select
          className="input-field"
          value={form.specialization}
          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
          required
        >
          <option value="">Chọn chuyên môn</option>
          {SPECIALIZATIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <textarea
          className="input-field sm:col-span-2 font-mono text-xs"
          placeholder="Nội dung văn bản (.txt)"
          rows={12}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />

        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary">
              Hủy
            </button>
          )}
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
                    {doc.file_name}
                    {doc.size_bytes != null && ` (${doc.size_bytes} B)`}
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => startEdit(doc.doc_id)}
                      className="text-law-gold hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.doc_id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && documents.length === 0 && (
          <p className="py-6 text-center text-law-slate">Chưa có tài liệu.</p>
        )}
      </div>
    </div>
  );
}
