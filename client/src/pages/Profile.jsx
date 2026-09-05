import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUser as updateUserApi, permanentDeleteUser } from '../services/users';
import { ApiError } from '../services/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RoleBadge } from '../components/ui/Badge';
import { formatDateWithLongMonth } from '../utils/event-display';

const inputClass =
  'w-full border border-gray-300 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user)  return null;

  const affiliation = user.organizationProfile?.organization || user.participantProfile?.institution || null;
  const affiliationLabel = user.organizationProfile ? 'Organization' : user.participantProfile ? 'Institution' : null;

  async function handleSave(e) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (password && password !== confirmPassword) {
      setSaveError('New password and confirm password do not match.');
      return;
    }

    const payload = {};
    if (name.trim() && name.trim() !== user.name) payload.name = name.trim();
    if (email.trim() && email.trim() !== user.email) payload.email = email.trim();
    if (password) payload.password = password;

    if (Object.keys(payload).length === 0) {
      setSaveSuccess(true);
      return;
    }

    setSaving(true);
    try {
      await updateUserApi(user.user_id, payload);
      await updateUser();
      setPassword('');
      setConfirmPassword('');
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.message : 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const warning = user.role === 'organizer'
      ? 'Deleting your account will cancel all your events. This action cannot be undone. Are you sure you want to proceed?'
      : 'Permanently deleting your account cannot be undone. Are you sure you want to proceed?';
    
    if (!window.confirm(warning)) return;

    setDeleteError('');
    setDeleting(true);
    try {
      await permanentDeleteUser(user.user_id);
      logout();
      navigate('/login');
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className='max-w-2xl mx-auto px-6 py-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-slate-800'>Profile</h1>
        <p className='text-sm text-slate-500'>Manage your account details</p>
      </div>

      <Card className='p-6 space-y-4'>
        <div className='flex items-center gap-3'>
          <RoleBadge role={user.role} />
          <span className='text-xs text-slate-400'>Joined {formatDateWithLongMonth(user.created_at)}</span>
        </div>

        {affiliation && (
          <div>
            <p className='text-xs font-medium text-slate-500'>{affiliationLabel}</p>
            <p className='text-sm text-slate-700'>{affiliation || '-'}</p>
            <p className='text-xs text-slate-400 mt-0.5'>
              This is set at registration and cannot be changed.
            </p>
          </div>
        )}
      </Card>

      <Card className='p-6'>
        <form onSubmit={handleSave} className='space-y-4'>
          <h2 className='text-base font-semibold text-slate-800'>Edit Profile</h2>

          {saveError && (
            <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
              {saveError}
            </div>
          )}
          {saveSuccess && !saveError && (
            <div className='text-sm text-brand-700 bg-brand-100 rounded-card px-3 py-2'>
              Changes saved.
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Name</label>
            <input
              type='text'
              value={name}
              onChange={(e) => { setName(e.target.value); setSaveSuccess(false); }}
              className={inputClass}
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-slate-700 mb-1'>Email</label>
            <input
              type='email'
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSaveSuccess(false); }}
              className={inputClass}
            />
          </div>

          <div className='pt-2 border-t border-gray-100'>
            <p className='text-xs font-medium text-slate-500 mb-3'>Change Password (Leave blank to keep current password)
            </p>
            <div className='space-y-3'>
              <input
                type='password'
                value={password}
                onChange={(e) => { setPassword(e.target.value); setSaveSuccess(false); }}
                placeholder='New Password'
                className={inputClass}
              />
              <input
                type='password'
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setSaveSuccess(false); }}
                placeholder='Confirm New Password'
                className={inputClass}
              />
            </div>
          </div>

          <Button type='submit' disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      <Card className='p-6 border border-red-200'>
        <h2 className='text-base font-semibold text-slate-800 mb-1'>Delete Account</h2>
        <p className='text-sm text-slate-500 mb-4'>
          Permanently delete your account. This action cannot be undone.
          {user.role === 'organizer' && ' All your events will be cancelled.'}
        </p>

        {deleteError && (
          <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
            {deleteError}
          </div>
        )}

        <Button variant='danger' disabled={deleting} onClick={handleDeleteAccount}>
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </Card>
    </div>
  );
}
