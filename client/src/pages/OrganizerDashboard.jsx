import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, CategoryTag } from '../components/ui/Badge';
import { ApiError } from '../services/client';
import { getMyEvents, deleteEvent, updateEventStatus, createEvent, updateEvent } from '../services/events';
import { getEventCategories } from '../services/event-categories';
import { headerColor, formatDateShort, toDatetimeLocalValue } from '../utils/event-display';
import EventParticipantsPanel from '../components/events/EventParticipantsPanel';

const STATUS_TRANSITIONS = {
  open: ['closed', 'cancelled'],
  full: ['closed', 'cancelled'],
  closed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const selectClass =
  'border border-gray-300 rounded-card px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const inputClass =
  'w-full border border-gray-300 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

function CreateEditEventModal({ editingEvent, onClose, onSaved }) {
  const isEdit = !!editingEvent;

  const [title, setTitle] = useState(editingEvent?.title || '');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [eventDate, setEventDate] = useState(toDatetimeLocalValue(editingEvent?.event_date));
  const [capacity, setCapacity] = useState(editingEvent?.capacity ?? '');
  const [location, setLocation] = useState(editingEvent?.location || '');
  const [category, setCategory] = useState(editingEvent?.category?.name || '');

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError('');
      try {
        const data = await getEventCategories();
        if (!cancelled) setCategories(data || []);
      } catch (err) {
        if (!cancelled) {
          setCategoriesError(err instanceof ApiError ? err.message : 'Could not load categories.');
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    const mandatoryFields = [
      ['Title', title],
      ['Event date & time', eventDate],
      ['Capacity', capacity],
      ['Category', category]
    ];
    const emptyFields = mandatoryFields
      .filter(([, value]) => !value || !value.toString().trim())
      .map(([label]) => label);
    if (emptyFields.length > 0) {
      let errorMessage = '';
      for (const field of emptyFields) {
        errorMessage += `${field}, `;
      }
      errorMessage = `Please fill in the following mandatory fields: ${errorMessage.slice(0, -2)}.`;
      setSubmitError(errorMessage);
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      eventDate: new Date(eventDate).toISOString(),
      capacity: Number(capacity),
      location: location.trim(),
      category
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateEvent(editingEvent.event_id, payload);
      } else {
        await createEvent(payload);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not save this event.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <Card className="w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {isEdit ? `Edit "${editingEvent.title}"` : 'Create Event'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Date & Time</label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Auditorium"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            {categoriesLoading ? (
              <p className="text-sm text-slate-400">Loading categories...</p>
            ) : categoriesError ? (
              <p className="text-sm text-red-600">{categoriesError}</p>
            ) : (
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function OrganizerEventCard({ event, onChanged, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const transitions = STATUS_TRANSITIONS[event.status] || [];
  const registered = event.registered_count ?? 0;
  const percentFull = event.capacity > 0 ? Math.min(100, (registered / event.capacity) * 100) : 0;

  async function applyStatus() {
    if (!nextStatus) return;
    setStatusUpdating(true);
    setError('');
    try {
      await updateEventStatus(event.event_id, nextStatus);
      setNextStatus('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`)) return;
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

  return (
    <Card className="overflow-hidden">
      <div className={`h-20 ${headerColor(event.category.name)} flex items-center justify-between px-4`}>
        <span className="text-white/90 text-sm font-medium">{event.category.name}</span>
        <StatusBadge status={event.status} />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CategoryTag name={event.category.name} />
            <h3 className="font-semibold text-slate-800 mt-1 truncate">{event.title}</h3>
            <h3 className="font-sm text-slate-800 mt-1">
              <span className="underline">Description</span>: {event.description}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDateShort(event.event_date)}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => onEdit(event)}>Edit</Button>
            <Button variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {(event.status === 'open' || event.status === 'full' || event.status === 'closed') && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Capacity</span>
              <span>{registered}/{event.capacity} registered</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500" style={{ width: `${percentFull}%` }} />
          </div>
        </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {transitions.length > 0 && (
            <>
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className={selectClass}>
                <option value="">Change status...</option>
                {transitions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button variant="outline" disabled={!nextStatus || statusUpdating} onClick={applyStatus}>
                {statusUpdating ? 'Updating...' : 'Apply'}
              </Button>
            </>
          )}
          {(event.status === 'closed' || event.status === 'completed') && (
              <button onClick={() => setExpanded((v) => !v)} className="ml-auto text-sm text-brand-600 hover:underline">
                {expanded ? 'Hide participants' : 'View participants'}
              </button>
          )}
          {event.status === 'completed' && (
              <button onClick={() => setReviewsExpanded((v) => !v)} className="text-sm text-brand-600 hover:underline">
                {reviewsExpanded ? 'Hide reviews' : 'View reviews'}
              </button>
          )}
        </div>

        {expanded && (
          <div className="border-t border-gray-100 pt-2">
            <EventParticipantsPanel eventId={event.event_id} section="participants" />
          </div>
        )}
        {reviewsExpanded && (
          <div className="border-t border-gray-100 pt-2">
            <EventParticipantsPanel eventId={event.event_id} section="reviews" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const eventOrder = useRef(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await getMyEvents();
      const loadedEvents = data || [];
      let nextOrder = eventOrder.current.size;
      loadedEvents.forEach((event) => {
        if (!eventOrder.current.has(event.event_id)) {
          eventOrder.current.set(event.event_id, nextOrder++);
        }
      });
      setEvents([...loadedEvents].sort(
        (first, second) => eventOrder.current.get(first.event_id) - eventOrder.current.get(second.event_id)
      ));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load your events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keeps /organizer/events/new working as a direct link/URL (e.g. the
  // NavBar "Create Event" item) even if this component instance persists
  // across the route change rather than remounting.
  useEffect(() => {
    if (location.pathname === '/organizer/events/new') {
      setEditingEvent(null);
      setModalOpen(true);
    } else {
      setModalOpen(false);
      setEditingEvent(null);
    }
  }, [location.pathname]);

  function openCreate() {
    navigate('/organizer/events/new');
  }

  function openEdit(event) {
    setEditingEvent(event);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
    if (location.pathname === '/organizer/events/new') {
      navigate('/organizer');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Organizer Dashboard</h1>
          <p className="text-sm text-slate-500">Manage the events you organize.</p>
        </div>
        <Button onClick={openCreate}>Create Event</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-card animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-gray-50 rounded-card border border-gray-200">
          <p className="text-sm text-slate-500">{loadError}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-card border border-gray-200">
          <p className="text-lg font-medium text-slate-700 mb-1">No events yet</p>
          <p className="text-sm text-slate-500 mb-4">Create your first event to get started.</p>
          <Button onClick={openCreate}>Create Event</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <OrganizerEventCard key={event.event_id} event={event} onChanged={load} onEdit={openEdit} />
          ))}
        </div>
      )}

      {modalOpen && (
        <CreateEditEventModal
          editingEvent={editingEvent}
          onClose={closeModal}
          onSaved={() => { closeModal(); load(); }}
        />
      )}
    </div>
  );
}