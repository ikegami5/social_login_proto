'use client';

import dynamic from 'next/dynamic';

const SocketIoTestComponent = dynamic(() => import('../components/SocketIoTestComponent'), {
  ssr: false,
});

export default function SocketIoTest() {

  return (
    <SocketIoTestComponent />
  );
}
