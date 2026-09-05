import { useState, useEffect, useCallback } from 'react';
import { getEventsOfDeletedOrganizer, deleteEvent } from '../services/events';
import { ApiError } from '../services/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, CategoryTag } from '../components/ui/Badge';
import { formatDateLong } from '../utils/event-display';

function OrphanedEventCard({ event, onChanged }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!window.confirm(`Permanently delete "${event.title}"? This can't be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await deleteEvent(event.event_id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this event.');
      setDeleting(false);
    }
  }

  const registered = event.registered_count;
  const hasCount = typeof registered === 'number';

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <CategoryTag name={event.category.name} />
            <StatusBadge status={event.status} />
          </div>
          <h3 className="font-semibold text-slate-800">{event.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Organized by {event.organizer?.organization || 'Unknown'} · organizer account no longer active
          </p>
        </div>
        <Button variant="danger" disabled={deleting} onClick={handleDelete} className="shrink-0">
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      <div className="text-sm text-slate-600 space-y-1">
        <p>{formatDateLong(event.event_date)}</p>
        {event.location && <p>{event.location}</p>}
        <p className="text-slate-500">
          Capacity: {event.capacity}{hasCount ? ` · ${registered} were registered` : ''}
        </p>
      </div>

      {event.description && <p className="text-sm text-slate-700 whitespace-pre-wrap">{event.description}</p>}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">{error}</div>
      )}
    </Card>
  );
}

export default function AdminOrphanedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEventsOfDeletedOrganizer();
      // Defensive: normalize in case this returns {data,...} like
      // searchEvents rather than a plain array like /my-events.
      setEvents(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load orphaned events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-56 bg-gray-100 rounded-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-card border border-gray-200">
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-card border border-gray-200">
        <p className="text-sm text-slate-500">No orphaned events right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events.map((event) => (
        <OrphanedEventCard key={event.event_id} event={event} onChanged={load} />
      ))}
    </div>
  );
}
