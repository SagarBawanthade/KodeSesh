export const Button = ({ children, variant = 'default', className = '', ...props }) => {
    const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors";
    const variants = {
      default: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-gray-800/50"
    };
  
    return (
      <button 
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  };
