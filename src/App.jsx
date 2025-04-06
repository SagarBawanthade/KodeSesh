import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './Homepage';
import SignInPage from './Components/Signin';
import SignUpPage from './Components/Signup';
import CodeEditorDashboard from './pages/CodeEditorDashboard';
import DocumentationPage from './Components/Documentation';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/code-editor-dashboard" element={<CodeEditorDashboard/>} />
          <Route path="/documentation" element={<DocumentationPage/>} /> 
        </Routes>
      </div>
    </Router>
  );
}

export default App