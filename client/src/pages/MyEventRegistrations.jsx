import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEvent } from '../services/events';
import { cancelRegistration, getMyRegistrations } from '../services/event-registrations';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, CategoryTag, RegistrationStatusBadge } from '../components/ui/Badge';
import { ApiError } from '../services/client';
import {headerColor, formatDateShort } from '../utils/event-display';

const FILTERS = [
  { value: 'all', label: 'All'},
  { value: 'registered', label: 'Registered'},
  { value: 'cancelled', label: 'Cancelled'},
  { value: 'attended', label: 'Attended'},
  { value: 'no-show', label: 'No Show'}
];

async function attachEvents(registrations) {
  const missing = registrations.filter(r => !r.event);
  if (missing.length === 0) return registrations;

  const uniqueIds = [...new Set(missing.map(r => r.event_id))];
  const fetched = await Promise.all(uniqueIds.map(id => getEvent(id).catch(() => null)));
  const eventById = Object.fromEntries(uniqueIds.map((id, i) => [id, fetched[i]]));

  return registrations.map(r => (r.event ? r : { ...r, event: eventById[r.event_id] } ));
}

function RegistrationCard({ registration, onCancel, cancelling }) {
  const event = registration.event;
  if (!event) return null;

  const canCancel = registration.status === 'registered' && event.status !== 'completed';
  const isCancelled = event.status === 'cancelled';

  return (
    <Card className='overflow-hidden flex flex-col'>
      <Link to={`/events/${event.event_id}`}>
          <div className={`h-24 ${headerColor(event.category?.name || 'Event')} flex items-center justify-between px-4`}>
          <span className='text-white/90 text-sm font-medium'>{event.category?.name || 'Event'}</span>
          <StatusBadge status={event.status} />
        </div>
      </Link>

      <div className='p-4 flex-flex-col gap-2 flex-1'>
        <div className='flex items-center gap-2 flex-wrap'>
          <CategoryTag name={event.category?.name || 'Event'} />
          <RegistrationStatusBadge status={registration.status} />
        </div>

        <Link to={`/events/${event.event_id}`} className={`font-semibold text-slate-800 leading-snug
          ${isCancelled ? 'line-through' : 'hover:text-brand-600'}`}>
          {event.title}
        </Link>

        <div className='text-xs text-slate-500 space-y-0.5'>
          <p>{formatDateShort(event.event_date)}</p>
          {event.location && <p>{event.location}</p>}
        </div>

        {canCancel && (
          <Button
          variant='outline'
          className='mt-auto'
          disabled={cancelling}
          onClick={() => onCancel(registration.event_registration_id)}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Registration'}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getMyRegistrations();
      const withEvents = await attachEvents(data || []);

      withEvents.sort((a, b) => new Date(b.registered_at) - new Date(a.created_at));
      setRegistrations(withEvents);
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Could not load your registrations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(registrationId) {
    setActionError('');
    setCancellingId(registrationId);
    try {
      await cancelRegistration(registrationId);
      await load();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : 'Could not cancel registration. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  const visible = filter === 'all' ? registrations : registrations.filter(r => r.status === filter);

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      <h1 className='text-2xl font-bold text-slate-800 mb-1'>My Event Registrations</h1>
      <p className='text-sm text-slate-500 mb-6'>Events you have registered for</p>

      <div className='flex gap-2 mb-4'>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-card text-sm font-medium transition-colors ${
              filter === f.value
              ? 'bg-brand-500 text-white'
              : 'bg-white border border-gray-300 text-slate-600 hover:bg-gray-50'
            }`}
          >
            {f.value}
          </button>
        ))}
      </div>

      {actionError && (
        <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
          {actionError}
        </div>
      )}

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='h-56 bg-gray-100 rounded-card animate-pulse' />
          ))}
        </div>
        ) : loadError ? (
          <div className='text-center py-16 bg-gray-50 rounded-card border border-gray-200'>
            <p className='text-sm text-slate-500'>{loadError}</p>
          </div>
        ) : visible.length === 0 ? (
          <div className='text-center py-16 bg-gray-50 rounded-card border border-gray-200'>
            <p className='text-lg font-medium text-slate-700 mb-1'>
              {filter === 'all' ? 'You have no event registrations' : `You have no ${filter} registrations`}
            </p>
            <p className='text-sm text-slate-500 mb-4'>Browse events and register for them.</p>
            <Link to='/' className='text-sm font-medium text-brand-600 hover:underline'>Browse Events</Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {visible.map(registration => (
              <RegistrationCard
                key={registration.event_registration_id}
                registration={registration}
                onCancel={handleCancel}
                cancelling={cancellingId === registration.event_registration_id}
              />
            ))}
          </div>
        )
      }
    </div>
  );
}
