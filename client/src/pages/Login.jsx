import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ApiError } from '../services/client';

const inputClass = 
  'w-full border border-gray-300 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function Login() {
  const [mode, setMode] = useState('login');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('participant');
  const [organizationName, setOrganizationName] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'participant') {
        navigate('/');
      } else if (loggedInUser.role === 'organizer') {
        navigate('/organizer');
      }
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { email, password, name, role };

      if (role === 'organizer' && organizationName) payload.organization = organizationName;
      else if (role === 'participant' && institution) payload.institution = institution;

      await register(payload);
      navigate('/');
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className='min-h-screen flex'>
      <div className='hidden md:flex w-1/2 bg-brand-600 text-white flex-col justify-between p-12'>
        <div className='flex items-center gap-2 text-lg font-semibold'>
          <span className='inline-block w-8 h-8 bg-white/20 rounded-md' />
            Community Event Management
        </div>
        <div>
          <h1 className='text-3xl font-bold mb-3'>
            The central hub for campus life.
          </h1>
          <p className='text-brand-100 max-w-sm'>
            Coordinate schedules, discover events, and connect with your academic community through one unified platform.
          </p>
        </div>
        <div />
      </div>

      <div className='w-full md:w-1/2 flex items-center justify-center p-8 bg-neutral-50'>
        <div className='w-full max-w-sm'>
          <div className='flex border-b border-gray-200 mb-6'>
            <button
            type='button' onClick={() => switchMode('login')} 
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'login' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
              }`}>
              Log In
            </button>
            <button
            type='button' onClick={() => switchMode('register')}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
              mode === 'register' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400'
            }`}>
              Register
            </button>
          </div>
          {error && (
            <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <h2 className='text-xl font-semibold mb-1'>Welcome back</h2>
                <p className='text-sm text-slate-500'>Enter your credentials to log in.</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Email</label>
                <input
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter your email address...'
                  className={inputClass}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Password</label>
                <input
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password...'
                  className={inputClass}
                />
              </div>
              <Button type='submit' disabled={submitting} className='w-full'>
                {submitting ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className='space-y-4'>
              <div>
                <h2 className='text-xl font-semibold mb-1'>Create an account</h2>
                <p className='text-sm text-slate-500'>Fill in the details below to register.</p>
              </div>

              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Email</label>
                <input
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter your email address...'
                  className={inputClass}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Full Name</label>
                <input
                  type='text'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Enter your full name...'
                  className={inputClass}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-1'>Password</label>
                <input
                  type='password'
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password...'
                  className={inputClass}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>I am joining as a</label>
                <div className='flex border border-gray-300 rounded-card overflow-hidden text-sm'>
                  <button
                    type='button'
                    onClick={() => setRole('participant')}
                    className={`flex-1 py-2 transition-colors ${
                      role === 'participant' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'
                    }`}>
                    Participant
                    </button>
                  <button
                    type='button'
                    onClick={() => setRole('organizer')}
                    className={`flex-1 py-2 transition-colors ${
                      role === 'organizer' ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'
                    }`}>
                      Organizer
                    </button>
                </div>
              </div>

              {role === 'organizer' ? (
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Organization Name<span className='text-slate-400 font-normal'>(optional)</span>
                  </label>
                  <input
                    type='text'
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder='Enter your organization name...'
                    className={inputClass}
                  />
                </div>
              ) : (
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-1'>
                    Institution Name<span className='text-slate-400 font-normal'>(optional)</span>
                  </label>
                  <input
                    type='text'
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder='Enter your institution name...'
                    className={inputClass}
                  />
                </div>
              )}

              <Button type='submit' disabled={submitting} className='w-full'>
                {submitting ? 'Registering...' : 'Register'}
              </Button>

              <p className='text-xs text-slate-400 text-center'>
                By registering, you agree to our Terms of Service.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}