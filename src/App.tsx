import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { notification } from 'antd';
import RegisterForm from './pages/Register';
import LoginForm from './pages/Login';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ConnectionStatusBanner from './components/Alert';

const App: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  return (
    <AuthProvider>
      <ConnectionStatusBanner />
      {contextHolder}
      <Router>
        <Routes>
          <Route path="/" element={<LoginForm api={api} />} />
          <Route path="/register" element={<RegisterForm api={api} />} />
          <Route path="/home" element={<PrivateRoute><Home api={api} /></PrivateRoute>} />
        </Routes>
      </Router>

    </AuthProvider>
  );
};

export default App;