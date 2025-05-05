'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../utils/apiClient';
import { io } from 'socket.io-client';
import * as Phaser from 'phaser';
import { InitialScene, PhaserScene } from '../utils/phaserScene';

export default function SocketIoTestComponent() {
  const [username, setUsername] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const phaserRef = useRef(null);
  const userIdRef = useRef(null);
  const socketRef = useRef(null);
  const aspectRatio = 16 / 9;
  const maxWidth = 768;
  const width = Math.min(window.innerWidth, maxWidth);
  const height = Math.floor(width / aspectRatio);

  useEffect(() => {
    console.log('SocketIoTestComponent rendered');
    apiClient.get('/username').then((res) => {
      userIdRef.current = String(res.data.userId);
      setUsername(res.data.userName);
    });

    const connection = io(process.env.SERVER_URL, {
      transports: ['websocket'],
      query: {
        server_num: searchParams.get('server_num')
      },
      withCredentials: true,
    });
    connection.on('connect', () => {
      console.log('Connected to socket server');
    });
    connection.on('joinRoom', (data) => {
      phaserRef.current.phaserScene.roomState = data;
      phaserRef.current.game.scene.start('PhaserScene');
      phaserRef.current.game.scene.stop('InitialScene');
    });
    connection.on('updateRoomState', (data) => {
      const userIdSet = new Set(Object.keys(data.avatars));
      Object.keys(phaserRef.current.phaserScene.roomState.avatars).forEach((userId) => {
        const avatar = data.avatars[userId];
        if (avatar) {
          if (userId !== userIdRef.current) {
            phaserRef.current.phaserScene.roomState.avatars[userId] = avatar;
          }
          userIdSet.delete(userId);
        } else {
          delete phaserRef.current.phaserScene.roomState.avatars[userId];
        }
      });
      userIdSet.forEach((userId) => {
        phaserRef.current.phaserScene.roomState.avatars[userId] = data.avatars[userId];
      });
    });
    connection.on('disconnect', () => {
      console.log('Disconnected from socket server');
      router.push('/');
    });
    connection.on('message', (data) => {
      setResponse(data);
    });
    socketRef.current = connection;

    if (!phaserRef.current) {
      phaserRef.current = {
        game: null,
        initialScene: new InitialScene(phaserRef),
        phaserScene: new PhaserScene(phaserRef, userIdRef),
        handlers: {
          onMoveAvatar: handleMoveAvatar,
          onJoinRoom: handleJoinRoom,
        },
      };
    }
    if (!phaserRef.current.game) {
      const config = {
        type: Phaser.AUTO,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: width,
          height: height,
        },
        backgroundColor: '#f0f0f0',
        scene: [phaserRef.current.initialScene, phaserRef.current.phaserScene],
        parent: 'phaser-container',
      };
      phaserRef.current.game = new Phaser.Game(config);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      connection.disconnect();
      window.removeEventListener('resize', handleResize);
      if (phaserRef.current) {
        phaserRef.current.game.destroy(true);
        phaserRef.current = null;
      }
    };
  }, [router, searchParams]);

  function handleMoveAvatar(x, y) {
    socketRef.current.emit('moveAvatar', { x, y });
  }

  function handleJoinRoom(roomId) {
    socketRef.current.emit('joinRoom', { roomId });
  }

  function handleResize() {
    const newWidth = Math.min(window.innerWidth, maxWidth);
    const newHeight = Math.floor(newWidth / aspectRatio);
    if (phaserRef.current) {
      phaserRef.current.game.scale.resize(newWidth, newHeight);
    }
  }

  function handleSendMessage() {
    socketRef.current.emit('message', message);
    setMessage('');
  }

  return (
    <div className="text-center mt-12">
      <h1 className="m-4">Socket.io Test</h1>
      <div className="m-4 underline">
        <Link href="/">Home</Link>
      </div>
      <p className="m-4">Welcome, {username}!</p>
      <div id="phaser-container" className="w-screen max-w-3xl mx-auto aspect-video"></div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
        className="border border-gray-900 m-4"
      />
      <button className="border border-gray-900" onClick={handleSendMessage}>Send Message</button>
      <p className="m-4">Response: {response}</p>
    </div>
  );
};
