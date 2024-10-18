import dynamic from 'next/dynamic'

const ClientChat = dynamic(() => import('../../components/chat/ChatComponent'), { ssr: false })

export default function ChatPage() {
  return <ClientChat />
}