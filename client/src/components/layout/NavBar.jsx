import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PARTICIPANT_LINKS = [
  { to: '/', label: 'Discover' },
  { to: '/my-registrations', label: 'My Registrations' },
];

const ORGANIZER_LINKS = [
  { to: '/organizer', label: 'Dashboard' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users'},
  { to: '/admin/categories', label: 'Categories'},
  { to: '/admin/orphaned-events', label: 'Orphaned Events'},
];

function linksForRole(role) {
  if (role === 'admin') return ADMIN_LINKS;
  if (role === 'organizer') return ORGANIZER_LINKS;
  return PARTICIPANT_LINKS;
}

export function NavBar() {
  const { user, logout } = useAuth();
  const links = user ? linksForRole(user.role) : [];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
        <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : '/'}
          className='text-lg font-semibold text-brand-600'>
        Community Event Management
        </Link>
        <nav className='flex items-center gap-6'>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/organizer' || link.to === '/admin'}
              className={({ isActive }) => `text-sm font-medium pb-1 border-b-2 transition-colors ${
                isActive
                ? 'text-brand-600 border-brand-500'
                : 'text-slate-600 border-transparent hover:text-slate-900'}`
              }>
                {link.label}
              </NavLink>
          ))}
          <NavLink
            to='/profile'
            className={({ isActive }) => `text-sm font-medium pb-1 border-b-2 transition-colors ${
              isActive
                ? 'text-brand-600 border-brand-500'
                : 'text-slate-600 border-transparent hover:text-slate-900'}`
            }>
            Profile
          </NavLink>
        </nav>

        <div className='flex items-center gap-4'>
          {user ? (
            <button onClick={logout} className='text-sm text-slate-500 hover:text-slate-800 cursor-pointer'>
            Logout
            </button>
          ) : (
            <Link to='/login' className='text-sm font-medium text-brand-600'>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
