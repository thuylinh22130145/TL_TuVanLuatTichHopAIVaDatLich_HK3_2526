import { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { appRoutes } from './routes/routes';
import {
  connectRealtime,
  disconnectRealtime,
} from './services/socketService';

const router = createBrowserRouter(appRoutes);

function RealtimeApplication() {
  const { token } = useAuth();
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!token) {
      disconnectRealtime();
      return undefined;
    }

    const socket = connectRealtime(token);
    const refreshBookingViews = () => {
      setRevision((current) => current + 1);
    };

    socket.on('booking:changed', refreshBookingViews);
    return () => {
      socket.off('booking:changed', refreshBookingViews);
    };
  }, [token]);

  return (
    <AppDataProvider key={revision}>
      <RouterProvider router={router} />
    </AppDataProvider>
  );
}

export default function AppRealtime() {
  return (
    <AuthProvider>
      <RealtimeApplication />
    </AuthProvider>
  );
}
