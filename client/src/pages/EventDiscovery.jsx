import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEvents } from '../services/events';
import { getEventCategories } from '../services/event-categories';
import { StatusBadge, CategoryTag } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ApiError } from '../services/client';
import { formatDateShort, headerColor } from '../utils/event-display';


const SORT_OPTIONS = [
  { value: 'event_date', label: 'Upcoming First'},
  { value: 'title', label: 'Title (A-Z)'},
  { value: 'capacity', label: 'Capacity'},
  { value: 'created_at', label: 'Recently Added'}
];


function EventCard({ event }) {
  const registered = event.registered_count ?? 0;
  const percentFull = event.capacity > 0 ? Math.min(100, (registered / event.capacity) * 100) : 0;
  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';

  return (
    <Link to={`/events/${event.event_id}`}>
      <Card className={`overflow-hidden h-full flex-col ${isCancelled ? 'opacity-70' : ''}`}>
        <div className={`h-28 ${headerColor(event.category.name)} flex items-center justify-between px-4 relative`}>
          <span className='text-white/90 text-sm font-medium'>{event.category.name}</span>
            <span className='absolute top-3 right-3'><StatusBadge status={event.status} /></span>
        </div>

        <div className='p-4 flex flex-col gap-2 flex-1'>
          <CategoryTag name={event.category.name} />
          <h3 className={`font-semibold text-slate-800 leading-snug ${isCancelled ? 'line-through' : ''}`}>
            {event.title}
          </h3>
          <div className='text-xs text-slate-500 space-y-0.5'>
            <p><span className='font-medium'>Date:</span> {formatDateShort(event.event_date)}</p>
            {event.location && <p><span className='font-medium'>Location:</span> {event.location}</p>}
          </div>

          {!isCancelled && (
            <>
            {!isCompleted && (
            <div className='mt-1'>
              <div className='flex justify-between text-xs text-slate-500 mb-1'>
                <span>Capacity</span>
                <span>{registered}/{event.capacity} registered</span>
              </div>
              <div className='h-1.5 bg-gray-100 rounded-full overflow-hidden'>
                <div className='h-full bg-brand-500' style={{width: `${percentFull}%`}} />
              </div>
            </div>
            )}
              <p className='text-xs text-slate-400 mt-auto pt-2'>
                Organized by:{' '}
                {event.organizer_deleted || !event.organizer
                  ? 'Organizer no longer active'
                  : event.organizer.organization_name || event.organizer.user.name}
              </p>
            </>
            )}
        </div>
      </Card>
    </Link>
  );
}


const EMPTY_FILTERS = {
  keyword: '',
  categoryId: '',
  dateFrom: '',
  dateTo: '',
  openOnly: false,
  sort: 'event_date'
};

export default function EventDiscovery() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState({ data: [], total: 0, page: 1, limit: 10 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCategories() {
    try {
      const eventCategories = await getEventCategories();
      setCategories(eventCategories);
    } catch {
      setCategories([]);
    }
  }
  fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError('');
      try {
        const params = {
          keyword: filters.keyword || undefined,
          categoryId: filters.categoryId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          availability: filters.openOnly ? 'open' : undefined,
          excludeCancelled: true,
          sort: filters.sort,
          page,
          limit: 8
        };

        const data = await searchEvents(params);
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not fetch events. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  fetchEvents();
  }, [filters, page]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>

      <div className='flex flex-wrap gap-3 mb-6'>
        <input
          type='text'
          value={filters.keyword}
          onChange={(e) => updateFilter('keyword', e.target.value)}
          placeholder='Search events...'
          className='flex-1 min-w-[220px] border border-gray-300 rounded-card px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500'
        />
        <select
          value={filters.categoryId}
          onChange={(e) => updateFilter('categoryId', e.target.value)}
          className='border border-gray-300 rounded-card px-3 py-2 text-sm'
        >
          <option value=''>All Categories</option>
          {categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.name}
            </option>
          ))}
        </select>
        
        <span className='self-center text-sm text-slate-500'>Created Between</span>
        <input
          type='date'
          value={filters.dateFrom}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          className='border border-gray-300 rounded-card px-3 py-2 text-sm'
        />
        <span className='self-center text-sm text-slate-500'>And</span>
        <input
          type='date'
          value={filters.dateTo}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          className='border border-gray-300 rounded-card px-3 py-2 text-sm'
        />

        <label className='flex items-center gap-2 text-sm text-slate-600 px-2'>
          <input
            type='checkbox'
            checked={filters.openOnly}
            onChange={(e) => updateFilter('openOnly', e.target.checked)}
            className='accent-brand-500'
          />
          Open only
        </label>

        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className='border border-gray-300 rounded-card px-3 py-2 text-sm'
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className='mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-card px-3 py-2'>
          {error}
        </div>
      )}

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className='h-64 bg-gray-100 rounded-card animate-pulse' />
          ))}
        </div>
      ) : result.data.length === 0 ? (
        <div className='text-center py-16 bg-gray-50 rounded-card border border-gray-200'>
          <p className='text-lg font-medium text-slate-700 mb-1'>No events matching your filters</p>
          <p className='text-sm text-slate-500 mb-4'>
            Try adjusting your filters or clearing them to see all events.
          </p>
          <button onClick={clearFilters} className='text-sm font-medium text-brand-600 hover:underline'>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
            {result.data.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-4 mt-8 text-sm'>
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className='px-3 py-1.5 rounded-card border border-gray-300 disabled:opacity-40'
              >
                Previous
              </button>
              <span className='text-slate-500'>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className='px-3 py-1.5 rounded-card border border-gray-300 disabled:opacity-40'
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
