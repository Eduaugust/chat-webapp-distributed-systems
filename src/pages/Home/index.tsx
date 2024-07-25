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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

    const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);

  const [friends, setFriends] = useState<string[]>();
  const [messages, setMessages] = useState<Messages>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessageFriend, setNewMessageFriend] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAuthenticated) {
        navigate('/');
      }
      webScoket1.send('/getAll ' + isAuthenticated);
      webScoket2.send('/getAll ' + isAuthenticated);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [webScoket1, webScoket2, navigate, isAuthenticated]);

  const openNotificationWithIcon = useCallback(
    (type: NotificationType, message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

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
          console.log('sao diferentes')
          for (const [friend, msgArray] of Object.entries(newMsg)) {
            if (friend !== selectedUser && !!msgArray && !!messages[friend] && (msgArray as []).length !== messages[friend].length && !newMessageFriend.includes(friend)) {
                setNewMessageFriend([...newMessageFriend, friend]);
            }
          }
        }
        if (newMessageFriend.includes(selectedUser)) {
          setNewMessageFriend(newMessageFriend.filter((friend) => friend !== selectedUser));
        }
        console.log(messages[selectedUser])
        console.log(newMsg[selectedUser])
        setMessages(newMsg as Messages);
      } catch (error) {
        console.error('Erro ao analisar a mensagem:', error);
      }
    },
    [selectedUser, openNotificationWithIcon, messages, newMessageFriend]
  );

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
        <ChatArea messages={messages[selectedUser]} selectedUser={selectedUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl">Selecione um amigo para começar a conversar</h1>
        </div>
      )}
    </div>
  );
};

export default Home;
