const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed',
  outline: 'border border-gray-300 text-slate-700 hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed',
  ghost: 'text-slate-600 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed'
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button className={
      `px-4 py-2 rounded-card text-sm font-medium transition-colors ${VARIANTS[variant]} ${className}`
    } {...props}>
      {children}
    </button>
  );
}