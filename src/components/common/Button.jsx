import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  onClick,
  variant = 'primary', // primary, secondary, outline, outlineGray, danger, success, blue
  size = 'md', // sm, md, lg, icon
  disabled = false,
  loading = false,
  className = '',
  loadingText = '',
  type = 'button',
  icon,
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-150 ease-in-out active:scale-95 active:opacity-80 rounded-xl focus:outline-none";

  const variants = {
    primary: "bg-mimu-gold text-white hover:bg-[#b87d26] disabled:bg-mimu-gold/50 disabled:active:scale-100",
    secondary: "bg-mimu-gray-200 text-mimu-wine-text dark:text-white hover:bg-mimu-gray-300 disabled:bg-mimu-gray-100 dark:bg-[#121212] disabled:text-mimu-text-muted",
    outline: "border-2 border-mimu-gold text-mimu-gold hover:bg-mimu-gold/10 disabled:border-mimu-gold/50 disabled:text-mimu-gold/50",
    outlineGray: "border-2 border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-light-text dark:text-gray-300 hover:bg-mimu-cream dark:bg-[#121212]",
    danger: "bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-red-50 disabled:text-red-300",
    success: "bg-green-100 text-green-800 hover:bg-green-200 disabled:bg-green-50 disabled:text-green-300",
    blue: "bg-mimu-gold text-mimu-wine-text dark:text-white text-white hover:bg-mimu-gold text-mimu-wine-text dark:text-white disabled:bg-blue-300"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 min-h-[44px]",
    lg: "px-6 py-3 md:py-4 text-lg",
    icon: "p-2 min-w-[44px] min-h-[44px]"
  };

  const handleClick = (e) => {
    if (disabled || loading) return;

    if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    if (onClick) onClick(e);
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${(disabled || loading) ? 'cursor-not-allowed opacity-70' : 'hover:shadow-md'} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText || children}
        </div>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
