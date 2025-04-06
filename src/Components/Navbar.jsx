import { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from "./Button";
import { getUserProfile, logout } from "../store/userSlice";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get user data and authentication status from Redux store
  const { user, isAuthenticated } = useSelector(state => state.user);

 // In your Navbar component
useEffect(() => {
  // Check if authenticated but user data is missing
  if (isAuthenticated && !user) {
    dispatch(getUserProfile());
  }
}, [dispatch, isAuthenticated, user]);

  const navItems = [
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ];

  const userMenuItems = [
    { label: "Account", href: "/account", icon: "user" },
    { label: "Settings", href: "/settings", icon: "settings" },
    { label: "Logout", action: handleLogout, icon: "logout" }
  ];

  function handleLogout() {
    dispatch(logout());
    navigate("/");
    toast.success("Logged out successfully");
    setIsDropdownOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div className="relative">
      <nav className="w-full h-14 border-b border-gray-800 bg-black shadow-lg shadow-cyan-500/50">
        <div className="h-full max-w-7xl mx-auto px-0 flex items-center justify-between">
          {/* Logo and Site Name */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center">
              <span className="text-cyan-400 font-bold">K</span>
            </div>
            <span className="text-xl font-bold text-white">KodeSesh</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-6 mr-8">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-cyan-400 font-medium bg-gray-900 hover:bg-gray-800 rounded-md px-3 py-1.5 transition-colors"
                  >
                    <span>{user?.name || "User"}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "transform rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50">
                      <div className="py-1">
                        {userMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              if (item.action) {
                                item.action();
                              } else {
                                navigate(item.href);
                                setIsDropdownOpen(false);
                              }
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          >
                            {/* Icon based on item type */}
                            {item.icon === "user" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                            {item.icon === "settings" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            )}
                            {item.icon === "logout" && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            )}
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate("/signin")}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate("/signup")}>Sign Up</Button>
                </>
              )}
            </div>
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute right-4 top-16 w-48 bg-black border border-gray-800 rounded-md shadow-lg md:hidden z-50">
          <div className="py-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.href);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
            
            <div className="border-t border-gray-800 mt-2 pt-2">
              {isAuthenticated ? (
                <div className="px-4">
                  <div className="text-cyan-400 font-medium py-2 flex items-center justify-between">
                    {user?.name || "User"}
                  </div>
                  
                  {/* Mobile user menu items */}
                  {userMenuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else {
                          navigate(item.href);
                          setIsMenuOpen(false);
                        }
                      }}
                      className="flex items-center w-full text-left px-2 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-md my-1"
                    >
                      {/* Icon based on item type */}
                      {item.icon === "user" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {item.icon === "settings" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      {item.icon === "logout" && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="w-full text-left px-4"
                    onClick={() => {
                      navigate("/signin");
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full text-left px-4 mt-2"
                    onClick={() => {
                      navigate("/signup");
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;