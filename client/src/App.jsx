import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NavBar } from './components/layout/NavBar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import Login from './pages/Login';
import EventDiscovery from './pages/EventDiscovery';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyEventRegistrations';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';
import AdminOrphanedEvents from './pages/AdminOrphanedEvents';
import Profile from './pages/Profile';

function AppLayout() {
  return (
    <div className='min-h-screen bg-neutral-50'>
      <NavBar />
      <Outlet />
    </div>
  );
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) {
    const destination = user.role === 'admin'
      ? '/admin'
      : user.role === 'organizer'
        ? '/organizer'
        : '/';
    return <Navigate to={destination} replace />;
  }
  return <Login />;
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginRoute />} />

        <Route element={<AppLayout />}>

          <Route element={<ProtectedRoute />}>
            <Route path='/' element={<EventDiscovery />} />
            <Route path='/events/:id' element={<EventDetails />} />
            <Route path='/profile' element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute roles={['participant']} />}>
            <Route path='/my-registrations' element={<MyRegistrations />} />
          </Route>

          <Route element={<ProtectedRoute roles={['organizer']} />}>
            <Route path='/organizer' element={<OrganizerDashboard />} />
            <Route path='/organizer/events/new' element={<OrganizerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path='/admin' element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path='users' element={<AdminUsers />} />
              <Route path='categories' element={<AdminCategories />} />
              <Route path='orphaned-events' element={<AdminOrphanedEvents />} />
            </Route>
          </Route>
        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}
