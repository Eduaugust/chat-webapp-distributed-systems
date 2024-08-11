import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi'; // Importando o ícone de logout e o ícone de usuário
import { NotificationType } from '../../common/notificationType';
import useWebSocket from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from 'antd';

interface SidebarProps {
  friends: string[] | undefined;
  newMessageFriend: string[];
  setSelectedUser: (username: string) => void;
  selectedUser: string | null;
  openNotificationWithIcon: (type: NotificationType, message: string, description: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ friends, newMessageFriend, setSelectedUser, selectedUser, openNotificationWithIcon }) => {
  const navigate = useNavigate();
  const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);
  const { isAuthenticated, logout } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);

  // Adiciona o amigo
  const handleAddFriend = () => {
    const username = inputRef.current?.value.trim();
      if (username) {
        webScoket1.send(`/addFriend ${isAuthenticated} ${username}`);
        webScoket2.send(`/addFriend ${isAuthenticated} ${username}`);
      } else { 
        openNotificationWithIcon('error', 'Erro', 'Digite um nome de usuário.');
      }
  };

  const handleChangeFriend = (username: string) => {
    setSelectedUser(username);
  }

  const handleWebSocketMessage = useCallback(
    (message: any) => {
      if (message.status === 'success') {
        if (inputRef.current)
          inputRef.current.value = '';
        openNotificationWithIcon('success', 'Amigo Adicionado', 'Amigo adicionado com sucesso!');
      } else if (message.status === 'error') {
        openNotificationWithIcon('error', 'Erro', message.data);
      }
    },
    [openNotificationWithIcon]
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
    <div className="flex flex-col h-full bg-lightGray p-4 w-1/4">
      <div className="flex-grow">
      <div className="flex items-center mb-4">
          <FiUser className="text-2xl mr-2" />
          <span className="text-xl">{isAuthenticated}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Amigos</h2>
          <FiLogOut
            className="text-2xl cursor-pointer"
            onClick={() => {
              logout();
              navigate('/'); // Navegar para a página de login após o logout
            }}
          />
        </div>
       
        <ul className="space-y-2">
          {!!friends && friends.map((friend) => 
             (
              <Button
                className={`w-full text-left ${selectedUser === friend ? 'bg-primary text-white' : newMessageFriend.includes(friend) ? 'bg-yellow-300' : 'bg-white'}`}
                onClick={() => handleChangeFriend(friend)}
              >
              {friend}
              </Button>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <input
          type="text"
          placeholder="Nome do amigo"
          className="w-full px-4 py-2 bg-white rounded-lg shadow mb-2"
          onKeyDown={(e) => {if (e.key === 'Enter') handleAddFriend()}}
          ref={inputRef}
        />
        <button
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={ handleAddFriend }
        >
          Adicionar Amigo
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
