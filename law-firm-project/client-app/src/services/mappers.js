/** Chuyển đổi giữa model UI (camelCase) và API server-api (snake_case) */

export function mapLawyerFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name ?? row.name,
    title: row.title || 'Luật sư',
    specialty: row.specialization ?? row.specialty,
    experience: row.experience_years ?? row.experience ?? 0,
    email: row.email || '',
    phone: row.phone || '',
    bio: row.bio || '',
    avatar: row.avatar_url ?? row.avatar ?? null,
    status: row.status || 'active',
    availability: row.availability_status ?? row.availability ?? 'AVAILABLE',
    categories: (row.categories || []).map((category) => category.name),
  };
}

export function mapLawyerToApi(ui) {
  return {
    full_name: ui.name ?? ui.full_name,
    title: ui.title || 'Luật sư',
    specialization: ui.specialty ?? ui.specialization,
    experience_years: Number(ui.experience ?? ui.experience_years) || 0,
    email: ui.email || null,
    phone: ui.phone || null,
    bio: ui.bio || null,
    avatar_url: ui.avatar ?? ui.avatar_url ?? null,
    status: ui.status || 'active',
    availability_status: ui.availability ?? ui.availability_status ?? 'AVAILABLE',
  };
}

const STATUS_TO_UI = {
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Hủy',
  COMPLETED: 'Hoàn thành',
  'Chờ duyệt': 'Chờ duyệt',
  'Đã duyệt': 'Đã duyệt',
  'Hủy': 'Hủy',
  pending: 'Chờ duyệt',
  confirmed: 'Đã duyệt',
  completed: 'Đã duyệt',
  cancelled: 'Hủy',
};

const STATUS_TO_API = {
  'Chờ duyệt': 'PENDING',
  'Đã duyệt': 'CONFIRMED',
  'Từ chối': 'REJECTED',
  'Hủy': 'CANCELLED',
  'Hoàn thành': 'COMPLETED',
  'Chờ duyệt': 'Chờ duyệt',
  'Đã duyệt': 'Đã duyệt',
  'Hủy': 'Hủy',
  pending: 'Chờ duyệt',
  confirmed: 'Đã duyệt',
  completed: 'Đã duyệt',
  cancelled: 'Hủy',
};

export function mapBookingFromApi(row) {
  if (!row) return null;
  const lawyer = row.lawyer;
  return {
    id: row.id,
    code: row.booking_code ?? row.code,
    customerName: row.customer_name ?? row.customerName,
    phone: row.customer_phone ?? row.phone,
    email: row.customer_email ?? row.email,
    lawyerId: row.lawyer_id ?? row.lawyerId,
    lawyerName: lawyer?.full_name ?? row.lawyerName ?? '—',
    scheduledAt: row.appointment_date ?? row.scheduledAt,
    content: row.summary_issue ?? row.content,
    status: row.status,
    statusCode: row.status,
    durationMinutes: row.duration_minutes ?? row.durationMinutes ?? 60,
    cancellationReason: row.cancellation_reason ?? row.cancellationReason ?? null,
    createdAt: row.created_at ?? row.createdAt,
  };
}

export function mapBookingToApi(ui, { forPublic = false } = {}) {
  const base = {
    customer_name: ui.customerName,
    customer_phone: ui.phone,
    customer_email: ui.email,
    appointment_date: ui.scheduledAt,
    summary_issue: ui.content,
    duration_minutes: ui.durationMinutes,
  };
  if (ui.lawyerId != null && ui.lawyerId !== '') {
    base.lawyer_id = Number(ui.lawyerId);
  }
  if (!forPublic && ui.status != null) {
    base.status = STATUS_TO_API[ui.status] ?? ui.status;
  }
  return base;
}

export function mapChatFromApi(data) {
  const suggested = (data.suggestedLawyers || []).map(mapLawyerFromApi);
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
      content: data.answer ?? data.content ?? '',
      needsMoreContext: Boolean(data.needsMoreContext ?? data.needs_more_context),
      timestamp: new Date().toISOString(),
    suggestBooking: Boolean(data.suggestBooking),
    specialization: data.specialization,
    source: data.source,
    aiProvider: data.aiProvider ?? data.ai_provider,
    model: data.model,
    sessionId: data.sessionId ?? data.session_id ?? null,
    retrievalScore: data.retrievalScore ?? data.retrieval_score,
    referenceTitle: data.referenceTitle ?? data.reference_title,
    citations: (data.citations || []).map((citation) => ({
      docId: citation.docId ?? citation.doc_id,
      title: citation.title,
      fileName: citation.fileName ?? citation.file_name,
      pages: Array.isArray(citation.pages) ? citation.pages : [],
      snippet: citation.snippet ?? null,
    })),
    suggestedLawyers: suggested,
  };
}

export function mapPublicBookingResult(data) {
  return {
    id: data.id,
    code: data.booking_code ?? data.code,
    status: STATUS_TO_UI[data.status] ?? data.status,
    scheduledAt: data.appointment_date,
  };
}
