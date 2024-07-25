import React, { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../../api';
import { type NotificationInstance } from 'antd/es/notification/interface';
import { NotificationType } from '../../common/notificationType';
import { useAuth } from '../../contexts/AuthContext';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  api: NotificationInstance;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ api }) => {
  const { control, handleSubmit, getValues } = useForm<FormData>();
  const navigate = useNavigate();
    const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);
  const { login, isServersConnected, setConnect } = useAuth();

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
    if (data.password !== data.confirmPassword) {
      openNotificationWithIcon('error', 'Erro', 'As senhas não coincidem.');
      console.error('As senhas não coincidem.');
      return;
    }

    if (!data.username || !data.password) {
      openNotificationWithIcon('error', "Erro", 'Preencha todos os campos.');
      console.error('Preencha todos os campos.');
      return;
    }

    if (data.username.includes(' ') || data.password.includes(' ')) {
      openNotificationWithIcon('error', "Erro", 'Nome de usuário e senha não podem conter espaços.');
      console.error('Nome de usuário e não podem conter espaços.');
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
    webScoket1.send(`/register ${data.username} ${data.password}`);
    webScoket2.send(`/register ${data.username} ${data.password}`);
  };

  const handleWebSocketMessage = useCallback(
    (message: any, username: string) => {
      if (message.status === 'success') {
        openNotificationWithIcon('success', 'Registro Bem-Sucedido', 'Você se registrou com sucesso!')
        login(username);
        navigate('/home');
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
        <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
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
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-mediumGray mb-2">Confirmar senha</label>
            <Controller
              name="confirmPassword"
              control={control}
              defaultValue=""
              render={({ field }) => <input type="password" {...field} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Confirme sua senha" />}
            />
          </div>
          <div>
            <button type="submit" className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-primary">
              Register
            </button>
          </div>
          <div className="mt-4 text-center">
            <span className="text-mediumGray">Já tem uma conta? </span>
            <button
              type="button"
              className="text-primary hover:text-green-500 focus:outline-none focus:underline"
              onClick={() => navigate('/')}
            >
              Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
