import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ImageEditor from './components/ImageEditor';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ImageEditor />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
