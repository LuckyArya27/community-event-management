export function Card({ className = '', children }) {
  return (
    <div className={
      `bg-white border border-gray-200 rounded-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}
