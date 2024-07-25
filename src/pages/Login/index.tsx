import React, { useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../../api';
import { type NotificationInstance } from 'antd/es/notification/interface';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationType } from '../../common/notificationType';

interface FormData {
  username: string;
  password: string;
}

interface LoginFormProps {
  api: NotificationInstance;
}

const LoginForm: React.FC<LoginFormProps> = ({ api }) => {
  const { control, handleSubmit, getValues } = useForm<FormData>();
  const navigate = useNavigate();
  const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);
  const { login, setConnect, isServersConnected } = useAuth();

  const openNotificationWithIcon = useCallback(
    (type: NotificationType, message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

  const onSubmit = (data: FormData) => {
    if (!data.username || !data.password) {
      openNotificationWithIcon('error', "Erro", 'Preencha todos os campos.');
      console.error('Preencha todos os campos.');
      return;
    }

    if (!webScoket1.checkConnection()){
      webScoket1.connectWebSocket();
    }
    if (!webScoket2.checkConnection()){
      webScoket2.connectWebSocket();
    }

    if (!webScoket1.checkConnection() && !webScoket2.checkConnection() && isServersConnected) {
      setConnect(false);
    } else if ((webScoket1.checkConnection() || webScoket2.checkConnection()) && !isServersConnected) {
      setConnect(true)
    }
    webScoket1.send(`/login ${data.username} ${data.password}`);
    webScoket2.send(`/login ${data.username} ${data.password}`);
  };

  const handleWebSocketMessage = useCallback(
    (message: any, username: string) => {
      if (message.status === 'success') {
        openNotificationWithIcon('success', 'Login Bem-Sucedido', 'Você fez login com sucesso!');
        login(username);
        navigate('/home'); // Navega para a página inicial após login bem-sucedido
      } else if (message.status === 'error') {
        openNotificationWithIcon('error', 'Erro', message.data);
        console.error(message);
      }
    },
    [navigate, openNotificationWithIcon, login]
  );

  useEffect(() => {
    if (webScoket1.receivedMessages) {
      handleWebSocketMessage(webScoket1.receivedMessages, getValues().username);
    }
  }, [webScoket1.receivedMessages, handleWebSocketMessage, getValues]);

  useEffect(() => {
    if (webScoket2.receivedMessages) {
      handleWebSocketMessage(webScoket2.receivedMessages, getValues().username);
    }
  }, [webScoket2.receivedMessages, handleWebSocketMessage, getValues]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-lightGray">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-mediumGray mb-2">Nome de usuário</label>
            <Controller
              name="username"
              control={control}
              defaultValue=""
              render={({ field }) => <input {...field} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite seu username" />}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-mediumGray mb-2">Senha</label>
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => <input type="password" {...field} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Digite sua senha" />}
            />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-primary">
              Login
            </button>
          </div>
          <div className="mt-4 text-center">
            <span className="text-mediumGray">Não tem uma conta? </span>
            <button
              type="button"
              className="text-primary hover:text-green-500 focus:outline-none focus:underline"
              onClick={() => navigate('/register')}
            >
              Registrar-se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
