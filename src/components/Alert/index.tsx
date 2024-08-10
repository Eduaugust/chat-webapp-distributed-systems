import React from 'react';
import { Alert } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const ConnectionStatusBanner: React.FC = () => {
  const { isServersConnected } = useAuth();

  return !isServersConnected ? (
    <Alert
      message="Conexão com o servidor perdida"
      description="Você está offline e não pode acessar todos os recursos."
      type="warning"
      showIcon
      style={{ marginBottom: 20, top: 5, right: 5, position: 'fixed', width: '30%', zIndex: 1000 }}
    />
  ) : null;
};

export default ConnectionStatusBanner;
