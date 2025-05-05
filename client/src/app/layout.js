import Body from './components/Body';
import './globals.css';

export const viewport = {
  themeColor: '#ffffff',
};

export const metadata = {
  title: 'social-login-proto',
  description: 'the prototype of social login app.',
  applicationName: 'social-login-proto',
  appleWebApp: {
    title: 'social-login-proto',
  },
};

export default function TopLayout({ children }) {
  return (
    <html lang="ja">
      <Body>{children}</Body>
    </html>
  );
}
