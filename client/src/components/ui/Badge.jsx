const STATUS_STYLES = {
  open: 'bg-brand-100 text-brand-700',
  full: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-200 text-gray-600',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  open: 'Open',
  full: 'Full',
  closed: 'Closed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const REGISTRATION_STATUS_STYLES = {
  registered: 'bg-brand-100 text-brand-700',
  attended: 'bg-slate-200 text-slate-700',
  'no-show': 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
};

const REGISTRATION_STATUS_LABELS = {
  registered: 'Registered',
  attended: 'Attended',
  'no-show': 'No-show',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }) {
  return (
    <span className={
      `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
      ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`
    }>{STATUS_LABELS[status]}
    </span>
  );
}

export function CategoryTag({ name }) {
  return (
    <span className={
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'}>
        {name}
    </span>
  );
}

export function RegistrationStatusBadge({ status }) {
  return (
    <span className={
      `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${REGISTRATION_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`
      }>{REGISTRATION_STATUS_LABELS[status] || status}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-purple-100 text-purple-700',
    organizer: 'bg-brand-100 text-brand-700',
    participant: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={
      `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${styles[role] || 'bg-gray-100 text-gray-600'}`
      }>{role}
    </span>
  );
}
