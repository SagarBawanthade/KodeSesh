import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthCallBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      toast.error(error);
      navigate('/signin');
      return;
    }
    
    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      toast.success('Login successful');
      navigate('/code-editor-dashboard');
    } else {
      toast.error('Authentication failed');
      navigate('/signin');
    }
  }, [location, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );
};

export default AuthCallBack;