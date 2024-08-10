import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url: string) => {
  const [receivedMessages, setReceivedMessages] = useState({});
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cria a conexao com o web socket e lida com os diferentes tipos de mensagens
  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const normalizedMessage = event.data.replace(/'/g, '"');
        const parsedMessage = JSON.parse(normalizedMessage);
        if (parsedMessage !== receivedMessages)
          setReceivedMessages(parsedMessage);
      }
      catch (error) {
        console.error('Error parsing message', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error ');
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connectWebSocket();
        }, 1000);
      }
    };

    ws.current.onclose = () => {
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connectWebSocket();
        }, 1000);
      }
    };
  }, [url, receivedMessages]);

  useEffect(() => {
    connectWebSocket();

    // Cleanup function to close the WebSocket and clear timeout when the component unmounts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connectWebSocket]);

  const close = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
   
  }, []);

  const send = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  }, []);

  const checkConnection = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return true;
    }
    return false;
  }, []);

  

  return {
    receivedMessages,
    send,
    close,
    connectWebSocket,
    checkConnection
  };
};

export default useWebSocket;