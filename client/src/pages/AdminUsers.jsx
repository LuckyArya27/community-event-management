import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RoleBadge } from '../components/ui/Badge';
import { ApiError } from '../services/client';
import { useAuth } from '../context/AuthContext';
import { listUsers, softDeleteUser, unbanUser } from '../services/users';
import { formatDateShortWithYear } from '../utils/event-display'


const inputClass = 
  'border border-gray-300 rounded-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const [role, setRole] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers( role || undefined, createdAfter || undefined, createdBefore || undefined );
      setUsers(data || []);
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Could not load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, createdAfter, createdBefore]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBan(user) {
    if (!window.confirm(`Ban user ${user.name}?. If they are an organizer, their events will be cancelled.`)) return;

    setActionError('');
    setPendingId(user.user_id);
    try {
      await softDeleteUser(user.user_id);
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not ban user. Please try again.');
    } finally {
      setPendingId(null);
    }
  }

  async function handleUnban(user) {
    if (!window.confirm(`Unban user ${user.name}?`)) return;

    setActionError('');
    setPendingId(user.user_id);
    try {
      await unbanUser(user.user_id);
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not unban user. Please try again.');
    } finally {
      setPendingId(null);
    }
  }
  
  return (
    <div>
      <div className='flex flex-wrap items-end gap-3 mb-4'>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
            <option value=''>All</option>
            <option value='participant'>Participant</option>
            <option value='organizer'>Organizer</option>
            <option value='admin'>Admin</option>
          </select>
        </div>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>Joined After</label>
          <input type='date' value={createdAfter}
          onChange={(e) => setCreatedAfter(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className='block text-xs font-medium text-slate-500 mb-1'>Joined Before</label>
          <input type='date' value={createdBefore}
          onChange={(e) => setCreatedBefore(e.target.value)} className={inputClass} />
        </div>
        {(role || createdAfter || createdBefore) && (
          <Button variant='ghost' onClick={() => { setRole(''); setCreatedAfter(''); setCreatedBefore(''); }}>
            Clear
          </Button>
        )}
      </div>

      {actionError && (
        <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
          {actionError}
        </div>
      )}

      {loading ? (
        <div className='h-64 bg-gray-100 rounded-card animate-pulse' />
      ) : error ? (
        <div className='text-center py-12 bg-gray-50 rounded-card border border-gray-200'>
          <p className='text-sm text-slate-500'>{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className='text-center py-12 bg-gray-50 rounded-card border border-gray-200'>
          <p className='text-sm text-slate-500'>No users match the current filters.</p>
        </div>
      ) : (
        <Card className='overflow-hidden'>
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 text-slate-500 text-left'>
              <tr>
                <th className='px-4 py-2 font-medium'>Name</th>
                <th className='px-4 py-2 font-medium'>Email</th>
                <th className='px-4 py-2 font-medium'>Role</th>
                <th className='px-4 py-2 font-medium'>Org / Institution</th>
                <th className='px-4 py-2 font-medium'>Joined</th>
                <th className='px-4 py-2 font-medium'>Status</th>
                <th className='px-4 py-2 font-medium'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {users.map(user => {
                const banned = !!user.deleted_at;
                const affiliation = user.organizerProfile?.organization || user.participantProfile?.institution || '-';
                const isSelf = currentUser && user.user_id === currentUser.user_id;

                return (
                  !isSelf && (
                    <tr key={user.user_id} className={banned ? 'opacity-60' : ''}>
                      <td className='px-4 py-2.5 text-slate-800 font-medium'>{user.name}</td>
                      <td className='px-4 py-2.5 text-slate-500'>{user.email}</td>
                      <td className='px-4 py-2.5'><RoleBadge role={user.role} /></td>
                      <td className='px-4 py-2.5 text-slate-500'>{affiliation}</td>
                      <td className='px-4 py-2.5 text-slate-500'>{formatDateShortWithYear(user.created_at)}</td>
                      <td className='px-4 py-2.5'>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${banned ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className='px-4 py-2.5 text-right'>
                        {banned ? (
                          <Button
                            variant='outline'
                            disabled={pendingId === user.user_id}
                            onClick={() => handleUnban(user)}
                            >
                            {pendingId === user.user_id ? 'Unbanning...' : 'Unban'}
                          </Button>
                        ) : (
                          <Button
                            variant='danger'
                            disabled={pendingId === user.user_id || isSelf}
                            onClick={() => handleBan(user)}
                            title={isSelf ? "You cannot ban yourself" : undefined}
                            >
                              {pendingId === user.user_id ? 'Banning...' : 'Ban'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
