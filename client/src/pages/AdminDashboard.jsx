import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { ApiError } from '../services/client';
import { searchEvents, getEventsOfDeletedOrganizer } from '../services/events';
import { listUsers } from '../services/users';
import { getEventCategories } from '../services/event-categories';
import { getMyRegistrations } from '../services/event-registrations';

async function fetchAllEvents() {
  const limit = 50;
  let page = 1;
  let all = [];

  while (true) {
    const res = await searchEvents({ page, limit });
    const batch = res?.data || [];
    all = all.concat(batch);
    if (batch.length === 0 || all.length >= (res?.total ?? all.length)) break;
    page++;
  }

  return all;
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) ?? 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

function sortedEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function StatCard({ label, value }) {
  return (
    <Card className='p-4'>
      <p className='text-xs font-medium text-slate-500'>{label}</p>
      <p className='text-2xl font-bold text-slate-800 mt-1'>{value}</p>
    </Card>
  );
}

function BreakdownCard({ title, counts, total }) {
  const entries = sortedEntries(counts);

  return (
    <Card className='p-4'>
      <p className='text-sm font-semibold text-slate-800 mb-3'>{title}</p>
      {entries.length === 0 ? (
        <p className='text-sm text-slate-400'>No data available.</p>
      ) : (
        <div className='space-y-2'>
          {entries.map(([key, count]) => (
            <div key={key}>
              <div className='flex justify-between text-xs text-slate-500 mb-0.5'>
                <span className='capitalize'>{key}</span>
                <span>{count}{total ? `(${Math.round((count / total) * 100)}%)` : ''}</span>
              </div>
              <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-brand-500'
                  style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [users, events, registrations, categories, orphanedRaw] = await Promise.all([
        listUsers().catch(() => []),
        fetchAllEvents().catch(() => []),
        getMyRegistrations().catch(() => []),
        getEventCategories().catch(() => []),
        getEventsOfDeletedOrganizer().catch(() => [])
      ]);

      const orphaned = Array.isArray(orphanedRaw) ? orphanedRaw : orphanedRaw?.data || [];

      setStats({
        usersTotal: users.length,
        usersByRole: countBy(users, (user) => user.role),
        bannedCount: users.filter((user) => !!user.deleted_at).length,

        eventsTotal: events.length,
        eventsByStatus: countBy(events, (event) => event.status),
        eventsByCategory: countBy(events, (event) => event.category?.name),

        registrationsTotal: registrations.length,
        registrationsByStatus: countBy(registrations, (reg) => reg.status),

        categoriesTotal: categories.length,
        orphanedTotal: orphaned.length
      });
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-20 bg-gray-100 rounded-card animate-pulse' />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className='text-center py-12 bg-gray-50 rounded-card border border-gray-200'>
        <p className='text-sm text-slate-500'>{error || 'No data available.'}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        <StatCard label='Total Users' value={stats.usersTotal} />
        <StatCard label='Banned Users' value={stats.bannedCount} />
        <StatCard label='Total Events' value={stats.eventsTotal} />
        <StatCard label='Total Registrations' value={stats.registrationsTotal} />
        <StatCard label='Total Categories' value={stats.categoriesTotal} />
        <StatCard label='Orphaned Events' value={stats.orphanedTotal} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <BreakdownCard title='Users by Role' counts={stats.usersByRole} total={stats.usersTotal} />
        <BreakdownCard title='Events by Status' counts={stats.eventsByStatus} total={stats.eventsTotal} />
        <BreakdownCard title='Registrations by Status' counts={stats.registrationsByStatus} total={stats.registrationsTotal} />
        <BreakdownCard title='Events by Category' counts={stats.eventsByCategory} total={stats.eventsTotal} />
      </div>
    </div>
  );
}