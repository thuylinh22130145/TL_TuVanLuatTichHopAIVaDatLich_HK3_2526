import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import * as appointmentService from '../services/appointmentService';
import * as lawyerService from '../services/lawyerService';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { authenticated, user } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshLawyers = useCallback(async () => {
    const data = authenticated && user?.role === 'ADMIN'
      ? await lawyerService.fetchAdminLawyers()
      : await lawyerService.fetchPublicLawyers();
    setLawyers(data);
    return data;
  }, [authenticated, user?.role]);

  const refreshAppointments = useCallback(async () => {
    if (!authenticated || user?.role !== 'ADMIN') {
      setAppointments([]);
      return [];
    }
    const data = await appointmentService.fetchAppointments();
    setAppointments(data);
    return data;
  }, [authenticated, user?.role]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await refreshLawyers();
      if (authenticated && user?.role === 'ADMIN') {
        await refreshAppointments();
      } else {
        setAppointments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [authenticated, user?.role, refreshLawyers, refreshAppointments]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const value = useMemo(
    () => ({
      lawyers,
      appointments,
      loading,
      refreshLawyers,
      refreshAppointments,
      loadAll,
      appointmentService,
      lawyerService,
      setLawyers,
      setAppointments,
    }),
    [
      lawyers,
      appointments,
      loading,
      refreshLawyers,
      refreshAppointments,
      loadAll,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
