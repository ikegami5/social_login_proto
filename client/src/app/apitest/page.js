'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '../utils/apiClient';

export default function ApiTest() {
  const [ rootstr, setRootstr ] = useState(null);
  const [ poststr, setPoststr ] = useState(null);

  useEffect(() => {
    console.log('ApiTest rendered');
    apiClient.get('/data/7?q=hoge').then((res) => {
      setRootstr(res.data.message);
    });
    apiClient.post('/modify', { data: 'moge' }).then((res) => {
      setPoststr(res.data.message);
    });
    apiClient.get('/error').then((res) => {
      console.log(res.data);
    });
  }, []);

  return (
    <div>
      <p>apitest</p>
      {
        rootstr ?
        <div>
          <p>data: {rootstr}</p>
        </div>
        :
        <div>loading...</div>
      }
      {
        poststr ?
        <div>
          <p>data: {poststr}</p>
        </div>
        :
        <div>loading...</div>
      }
      <div className="m-4 underline">
        <Link href="/">Home</Link>
      </div>
    </div>
  );
};
