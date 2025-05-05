import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.SERVER_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            toast.error('ネットワークエラーが発生しました');
            return Promise.reject(error);
        }
        const message = error.response.data.message || '';
        const status = error.response.status;
        if (status === 400) {
            toast.error(`リクエストが不正です。${message}`);
        } else if (status === 401) {
            if (window.location.pathname !== '/') {
                window.location.href = '/';
                toast.error('ログインしてください。');
            }
        } else if (status === 403) {
            toast.error('アクセス権限がありません。');
        } else if (status === 500) {
            toast.error('サーバーエラーが発生しました。');
        } else {
            toast.error('想定外のエラーが発生しました。');
        }
        return Promise.reject(error);
    }
);

export { apiClient };
