import { useSearchParams } from 'react-router-dom';
import AppointmentsTab from './tabs/AppointmentsTab';
import LawyersTab from './tabs/LawyersTab';
import DocumentsTab from './tabs/DocumentsTab';
import LawyerApplicationsTab from './tabs/LawyerApplicationsTab';

const TABS = [
  { id: 'appointments', label: 'Quản lý Đặt lịch' },
  { id: 'lawyers', label: 'Quản lý Luật sư' },
  { id: 'lawyer-applications', label: 'Đơn đăng ký luật sư' },
  { id: 'documents', label: 'Tài liệu luật (RAG)' },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'appointments';

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-law-navy">Bảng điều khiển</h1>
      <p className="mt-1 text-sm text-law-slate">
        Quản lý lịch hẹn, luật sư và kho tài liệu pháp luật cho AI
      </p>

      <div className="mt-6 flex gap-2 border-b border-law-navy/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-law-gold text-law-navy'
                : 'border-transparent text-law-slate hover:text-law-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'lawyers' && <LawyersTab />}
        {activeTab === 'lawyer-applications' && <LawyerApplicationsTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
      </div>
    </div>
  );
}
