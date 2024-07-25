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
      style={{ marginBottom: 20, bottom: 0, position: 'fixed', width: '100%' }}
    />
  ) : null;
};

export default ConnectionStatusBanner;
