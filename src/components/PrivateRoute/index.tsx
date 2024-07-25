import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }: any) => {
  const auth = useAuth();
  if (!auth) return <Navigate to="/" />;
  const { isAuthenticated } = auth

  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;