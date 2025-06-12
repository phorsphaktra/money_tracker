interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingSpinner = ({ size = 'medium', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      {/* Primary spinner */}
      <div className="absolute inset-0 animate-spin rounded-full 
        border-[3px] border-current border-t-transparent 
        opacity-80" />
      {/* Secondary spinner */}
      <div className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full 
        border-[3px] border-current border-l-transparent border-r-transparent 
        opacity-40" />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
