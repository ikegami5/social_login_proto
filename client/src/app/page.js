'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from './utils/apiClient';

export default function Home() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    console.log('Home rendered');
    apiClient.get('/username').then((res) => {
      setUsername(res.data.userName);
    }).catch(() => {
      setUsername(null);
    });
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.SERVER_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    window.location.href = `${process.env.SERVER_URL}/auth/github`;
  };

  const handleLogout = () => {
    apiClient.get('/auth/logout').then(() => {
      setUsername(null);
    });
  };

  return (
    <div className="text-center mt-12">
      {username ? (
        <div>
          <p className="m-4">Welcome, {username}!</p>
          <div className="m-4 underline">
            <Link href="/apitest/">APItest</Link>
          </div>
          <div className="m-4 underline">
            <Link href="/socketiotest/">Socket.io Test</Link>
          </div>
          <div className="m-4 underline">
            <Link href="/profile/">Profile</Link>
          </div>
          <button className="border border-gray-900" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1 className="m-4">ログイン</h1>
          <div>
            <h2 className="m-4">Google Login</h2>
            <button className="border border-gray-900" onClick={handleGoogleLogin}>Login with Google</button>
          </div>
          <div>
            <h2 className="m-4">Github Login</h2>
            <button className="border border-gray-900" onClick={handleGithubLogin}>Login with Github</button>
          </div>
        </div>
      )}
    </div>
  );
}
