import { useAuth } from '../../context/AuthContext';

export default function AuthGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <p className='text-sm text-slate-400 px-1 py-2'>Loading...</p>
    );
  }

  return children;
}
