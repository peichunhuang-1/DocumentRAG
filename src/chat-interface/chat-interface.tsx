import { useState } from 'react';
import { Card, Button } from 'antd';
import { MinusOutlined, MessageOutlined } from '@ant-design/icons';
import { ChatInterface } from './chat-room';

export function ResizableChatModal({ session_id, user }: { session_id: string, user: string }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = (visible: boolean) => {
    setIsVisible(visible);
    if (visible) {
      setIsMinimized(false);
    } else {
      if (!isMinimized) setIsMinimized(true);
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          zIndex: 1000,
          width: '320px', 
          maxHeight: '60vh', 
          display: isVisible ? 'flex' : 'none', 
          flexDirection: 'column'
        }}
      >
        <Card
          title="Chat"
          size="small"
          extra={
            <>
              <Button icon={<MinusOutlined />} type="text" onClick={() => toggleVisibility(false)} />
            </>
          }
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            height: '60vh',
          }}
          styles={{
            body: 
            { 
              padding: 0, 
              display: 'flex', 
              flexDirection: 'column',
              height: 'calc(60vh - 42px)'
            }
          }}
        >
          <ChatInterface session_id={session_id} user={user} />
        </Card>
      </div>

      <Button
        icon={<MessageOutlined />}
        type="primary"
        shape="circle"
        style={{ 
          position: 'fixed', 
          bottom: 20, 
          right: 20, 
          zIndex: 1000,
          display: isVisible ? 'none' : 'block'
        }}
        onClick={() => toggleVisibility(true)}
      />
    </>
  );
}