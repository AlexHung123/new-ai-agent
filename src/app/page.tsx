import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat - iTMS AI',
  description: 'Chat with iTMS AI.',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
