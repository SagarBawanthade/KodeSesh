import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import SignInPage from './Components/Signin';
import SignUpPage from './Components/Signup';
import CodeEditorDashboard from './pages/CodeEditorDashboard';
import DocumentationPage from './Components/Documentation';
import AuthCallBack from './Components/AuthCallBack';
import BlogList from './Components/blogs';
import AboutPage from './Components/About';
import Account from './Components/Account';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/account" element={<Account />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/code-editor-dashboard" element={<CodeEditorDashboard/>} />
          <Route path="/documentation" element={<DocumentationPage/>} /> 
          <Route path="/blogs" element={<BlogList/>} /> 
          <Route path="/About" element={<AboutPage/>} /> 
          <Route path="/code-editor-dashboard/:sessionId" element={<CodeEditorDashboard />} />
          <Route path="/auth/callback" element={<AuthCallBack />} />
        
        </Routes>
      </div>
    </Router>
  );
}

export default App