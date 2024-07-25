import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url: string) => {
  const [receivedMessages, setReceivedMessages] = useState({});
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('Conexão WebSocket aberta');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      const normalizedMessage = event.data.replace(/'/g, '"');
      const parsedMessage = JSON.parse(normalizedMessage);
      if (parsedMessage !== receivedMessages)
        setReceivedMessages(parsedMessage);
    };

    ws.current.onerror = (error) => {
      console.error('Erro na conexão WebSocket:', error);
    };

    ws.current.onclose = () => {
      console.log('Conexão WebSocket fechada');
      if (!reconnectTimeout.current) {
        reconnectTimeout.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
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

  const send = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  }, []);

  const close = useCallback(() => {
    if (ws.current) {
      reconnectTimeout.current = setTimeout(() => {
        connectWebSocket();
        }, 5000);
    }
  }, [connectWebSocket]);

  return {
    receivedMessages,
    send,
    close
  };
};

export default useWebSocket;