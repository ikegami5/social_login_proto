'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { apiClient } from '../utils/apiClient';
import { toast } from 'react-toastify';

function Profile() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    console.log('Profile rendered');
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      toast.error(errorMessage);
    }
    apiClient.get('/profile').then((res) => {
      setProfile(res.data);
    });
  }, [searchParams]);

  const handleLinkGoogle = () => {
    window.location.href = `${process.env.SERVER_URL}/auth/link/google`;
  };

  const handleLinkGithub = () => {
    window.location.href = `${process.env.SERVER_URL}/auth/link/github`;
  };

  const handleUnlink = (socialAccountId) => {
    apiClient.get(`/auth/unlink/${socialAccountId}`).then(() => {
      apiClient.get('/profile').then((res) => {
        setProfile(res.data);
      });
    });
  };

  return (
    <div className="text-center mt-12">
      {profile ? (
        <div>
          <h1 className="mt-4 text-2xl">プロフィール</h1>
          <p className="mt-4">ユーザー名：{profile.name}</p>
          <h2 className="mt-4 text-xl">ソーシャルアカウント一覧</h2>
          <ul className="mt-4">
            {profile.socialAccounts.map((socialAccount) => (
              <li key={socialAccount.id}>
                <p>{socialAccount.provider}: {socialAccount.email || '（メールアドレスなし）'}</p>
                {profile.socialAccounts.length > 1 &&
                  <button className="border border-gray-900" onClick={() => handleUnlink(socialAccount.id)}>連携解除</button>
                }
              </li>
            ))}
          </ul>
          <div>
            <button className="mt-8 border border-gray-900" onClick={handleLinkGoogle}>Googleアカウント連携追加</button>
          </div>
          <div>
            <button className='mt-4 border border-gray-900' onClick={handleLinkGithub}>Githubアカウント連携追加</button>
          </div>
          <div className="mt-8 underline">
            <Link href="/apitest/">APItest</Link>
          </div>
          <div className="mt-4 underline">
            <Link href="/">Home</Link>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Profile />
  </Suspense>
);
