import { useCallback, useEffect, useState } from 'react';
import { Layout, Input, Button, List, Space, Typography } from 'antd';
import { ArrowUpOutlined, XFilled } from '@ant-design/icons';
import { MessageProps } from './types';
import UpLoadPdf from './upload';
import { nanoid } from 'nanoid';
const { ipcRenderer } = window as any;

const { Content, Footer } = Layout;
const { TextArea } = Input;

export const EmptyChatInterface = () => {
    return (
        <Layout style={{ height: '94vh', display: 'flex', flexDirection: 'column', background: '#e0e0e0'}}/>
    );
}

export const ChatInterface = (userInfo: any) => {
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [input, setInput] = useState<string>('');
  const [spin, setSpin] = useState<boolean>(false);
  useEffect(()=> {
    const createClient = async () => {
      const success = await ipcRenderer.createChromaClient('default');
    };
    createClient();
  }, []);
  useEffect(()=>{
    ipcRenderer.onPromptedStream((res: string) => {
        if (!res) {
            setSpin(false);
        } else {
            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage) {
                lastMessage.content += res;
                return updatedMessages;
                }
                return updatedMessages;
            });
        }
    });
  }, []);
  
  const sendMessage = useCallback(async()=>{
    if (input.trim()) {
        const newMessage: MessageProps = {
          user: 'User',
          content: input
        };
        
        const returnMessage: MessageProps = {
            user: 'Robot',
            content: ''
        };
        setMessages([...messages, newMessage, returnMessage]);
        setInput('');
        setSpin(true);
        const knowledge = await ipcRenderer.getKnowledge({content: input, nResults: 5, meta: {}});
        console.log(knowledge);
        const results = await ipcRenderer.getConversationHistory({content: input, user: 'User', nResults: 5});
        console.log(results);
        ipcRenderer.promptLLM({content: input});
        ipcRenderer.addConversationHistory({user: 'User', prompts: [input], ids: [nanoid()]});
      }
  }, [input]);

  const stopMessage = useCallback(()=>{
    setSpin(false);
  }, []);

  return (
    <Layout style={{ height: '94vh', display: 'flex', flexDirection: 'column', background: '#e0e0e0'}}>
      <Content style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {
        messages.length > 0? 
        <List
          dataSource={messages}
          renderItem={(item) => (
            <List.Item style={{ padding: '10px', border: 'none'}}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div
                style={{display: 'flex', justifyContent: item.user === 'User' ? 'flex-end' : 'flex-start',}}>
                    <div
                        style={{
                        maxWidth: '70%', padding: '10px',
                        borderRadius: '15px', backgroundColor: item.user === 'User' ? '#cccccc' : '#e0e0e0'}}>
                        <Typography.Text>{item.content}</Typography.Text>
                    </div>
                </div>
              </Space>
            </List.Item>
          )}
        />: <div/>
        }
      </Content>
      <Footer style={{ background: '#e0e0e0', textAlign: 'center' }}>
        <div style={{ display: 'flex', position: 'relative', background: '#e0e0e0' }}>
          <UpLoadPdf serverURL={"http://localhost:5051/general/v0"} 
          style={{ backgroundColor: 'black', borderColor: 'black', color: 'white', position: 'absolute', left: '10px', bottom: '10px', zIndex: 1,}}/>
          <TextArea
            rows={4}
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              resize: 'none',
              background: '#eeeeee',
              paddingRight: '40px', 
              borderRadius: '15px'
            }}
          />
          <Button
            icon={spin?  <XFilled/> : <ArrowUpOutlined />}
            onClick={spin? stopMessage : sendMessage}
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '10px',
              zIndex: 1,
            }}
            shape='circle'
          />
        </div>
      </Footer>
    </Layout>
  );
};
