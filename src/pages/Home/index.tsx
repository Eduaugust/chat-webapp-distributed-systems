import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useWebSocket from '../../api';
import { type NotificationInstance } from 'antd/es/notification/interface';
import { NotificationType } from '../../common/notificationType';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../containers/SideBar';
import ChatArea from '../../containers/ChatArea';

interface Message {
  sender: string;
  message: string;
  timestamp: string;
}

interface Messages {
  [key: string]: Message[];
}

const Home: React.FC<{ api: NotificationInstance }> = ({ api }) => {
  const { isAuthenticated, isServersConnected, setConnect } = useAuth();
  const navigate = useNavigate();
  // Define a conexao com ambos os servidores via socket
  const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);

  const [friends, setFriends] = useState<string[]>();
  const [messages, setMessages] = useState<Messages>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessageFriend, setNewMessageFriend] = useState<string[]>([]);

  // Verifica a conexao com os servidores e tenta conectar
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAuthenticated) {
        navigate('/');
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
      webScoket1.send('/getAll ' + isAuthenticated);
      webScoket2.send('/getAll ' + isAuthenticated);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [webScoket1, webScoket2, navigate, isAuthenticated, isServersConnected, setConnect]);

  // Abre as notificacoes
  const openNotificationWithIcon = useCallback(
    (type: NotificationType, message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

  // Lida com o recebimento de mensagens para adicionar a notificacao de nova mensagem no amigo certo
  const handleWebSocketMessage = useCallback(
    (newMsg: any) => {
      if (newMsg.status === 'error') {
        openNotificationWithIcon('error', 'Erro', newMsg.data);
        return;
      } else if (typeof newMsg.data === 'string') {
        return;
      }

      try {
        newMsg = newMsg.data as Messages[];
        setFriends(Object.keys(newMsg));
        if (!selectedUser) {
          return;
        }
        if (messages !== newMsg) {
          for (const [friend, msgArray] of Object.entries(newMsg)) {
            if (friend !== selectedUser && !!msgArray && !!messages[friend] && (msgArray as []).length !== messages[friend].length && !newMessageFriend.includes(friend)) {
                setNewMessageFriend([...newMessageFriend, friend]);
            }
          }
        }
        if (newMessageFriend.includes(selectedUser)) {
          setNewMessageFriend(newMessageFriend.filter((friend) => friend !== selectedUser));
        }
        if (newMsg === undefined || newMsg === null) {
          return;
        }
        setMessages(newMsg as Messages);
      } catch (error) {
      }
    },
    [selectedUser, openNotificationWithIcon, messages, newMessageFriend]
  );

  // Recebe as mensagens de ambos os servidores
  useEffect(() => {
    if (webScoket1.receivedMessages) {
      handleWebSocketMessage(webScoket1.receivedMessages);
    }
  }, [webScoket1.receivedMessages, handleWebSocketMessage]);

  useEffect(() => {
    if (webScoket2.receivedMessages) {
      handleWebSocketMessage(webScoket2.receivedMessages);
    }
  }, [webScoket2.receivedMessages, handleWebSocketMessage]);

  return (
    <div className="flex h-screen">
      <Sidebar 
        friends={friends} 
        newMessageFriend={newMessageFriend}
        openNotificationWithIcon={openNotificationWithIcon}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />

      {selectedUser && messages[selectedUser] ? (
        <ChatArea api={api} selectedUser={selectedUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl">Selecione um amigo para começar a conversar</h1>
        </div>
      )}
    </div>
  );
};

export default Home;
