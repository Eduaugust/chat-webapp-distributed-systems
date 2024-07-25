import { format, isToday, isYesterday, parseISO, set } from 'date-fns';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Controller, useForm } from 'react-hook-form';
import useWebSocket from '../../api';
import { Col, Row } from 'antd';
import emojiRegex from 'emoji-regex';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';
import { NotificationType } from '../../common/notificationType';
import { NotificationInstance } from 'antd/es/notification/interface';

interface ChatAreaProps {
  selectedUser: string;
  api: NotificationInstance;
}
interface Messages {
  [key: string]: Message[];
}
interface Message {
  sender: string;
  message: string;
  timestamp: string;
}

const ChatArea: React.FC<ChatAreaProps> = ({ selectedUser, api }) => {
  const { isAuthenticated, isServersConnected, setConnect } = useAuth();
  const { control, handleSubmit, reset, watch, setValue } = useForm<{ msgToSend: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const webScoket1= useWebSocket( process.env.REACT_APP_API_URL1 as string);
  const webScoket2 = useWebSocket( process.env.REACT_APP_API_URL2 as string);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const msgToSend = watch("msgToSend", "");

  // Limita o tamanho da mensagem e envia
  const handleSendMessage = (data: { msgToSend: string }) => {
    const maxLength = 85;
    const message = data.msgToSend.slice(0, maxLength); // Limita o tamanho da mensagem

    if (!message) return;
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
    webScoket1.send(`/sendMessage ${isAuthenticated} ${selectedUser} ${message}`);
    webScoket2.send(`/sendMessage ${isAuthenticated} ${selectedUser} ${message}`);
    reset();
  };

  const openNotificationWithIcon = useCallback(
    (type: NotificationType, message: string, description: string) => {
      api[type]({
        message,
        description,
      });
    },
    [api]
  );

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
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [webScoket1, webScoket2, navigate, isAuthenticated, openNotificationWithIcon, setConnect, isServersConnected]);

  

  const handleWebSocketMessage = useCallback(
    (newMsg: any) => {
      if (newMsg.status === 'error') {
        openNotificationWithIcon('error', 'Erro', newMsg.data);
        return;
      } else if (typeof newMsg.data === 'string') {
        return;
      }

      try {
        newMsg = newMsg.data as Messages;
        if (!selectedUser) {
          return;
        }
        
        setMessages(newMsg[selectedUser] || []);
      } catch (error) {
      }
    },
    [setMessages, selectedUser, openNotificationWithIcon]
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

  

  // const message = watch("message", "");

  // Formata o timestamp da mensagem
  const formatTimestamp = (timestamp: string, prevTimestamp: string) => {
    const date = parseISO(timestamp);
    let formattedDate = '';

    if (isToday(date)) {
      formattedDate = format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      if (!prevTimestamp || !isYesterday(parseISO(prevTimestamp))) {
        formattedDate = 'Ontem ' + format(date, 'HH:mm');
      } else {
        formattedDate = format(date, 'HH:mm');
      }
    } else {
      if (!prevTimestamp || format(parseISO(prevTimestamp), 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) {
        formattedDate = format(date, 'dd/MM/yyyy HH:mm');
      } else {
        formattedDate = format(date, 'HH:mm');
      }
    }

    return formattedDate;
  };

  // Rola para o final do contêiner de mensagens
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Verifica a posição de rolagem ao montar o componente
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const handleScroll = () => {
        if (container.scrollTop + container.clientHeight < container.scrollHeight - 20) {
          setIsScrolledUp(true);
        } else {
          setIsScrolledUp(false);
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messagesEndRef]);

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, isScrolledUp]);

  // Conta caracteres visíveis removendo emojis
  const countVisibleCharacters = (str: string) => {
    const regex = emojiRegex();
    return str.replace(regex, '').length;
  };

  // Adiciona emoji ao campo de mensagem
  const handleEmojiClick = (emoji: any) => {
    setValue('msgToSend', msgToSend + emoji.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col w-3/4 bg-gray-100">
      <div className="flex-1 p-4 overflow-auto">
        {messages && messages.map((message, id) => (
          <Row key={id}>
            {message.sender === isAuthenticated && <div className='w-3/4'></div>}
            <Col
              className={`mb-2 p-2 rounded-lg w-1/4 ${message.sender === isAuthenticated ? 'bg-primary text-white self-end' : 'bg-white self-start'}`}
            >
              <div className="text-sm text-gray-600">{message.sender}</div>
              <div className="text-md">{message.message}</div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp, id > 0 ? messages[id - 1].timestamp || '' : '')}
              </div>
            </Col>
          </Row>
        ))}

        {/* Referência para o final do contêiner de mensagens */}
        <div ref={messagesEndRef} />
      </div>
      <form className="p-4 bg-white" onSubmit={handleSubmit(handleSendMessage)}>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-2 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="absolute z-10 bottom-5"> {/* Wrapper para posicionar o Emoji Picker */}
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <Controller
            name="msgToSend"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <input
                {...field}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua mensagem"
                maxLength={85}
              />
            )}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Enviar
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">{countVisibleCharacters(msgToSend)}/85 caracteres</p>
      </form>
    </div>
  );
};

export default ChatArea;
