import { useCallback, useEffect, useState } from 'react';
import { Layout, Input, Button, List, Space, Typography } from 'antd';
import { ArrowUpOutlined, XFilled } from '@ant-design/icons';
import { MessageProps } from './types';
import UpLoadPdf from './upload';


const { ipcRenderer } = window as any;

const { Content, Footer } = Layout;
const { TextArea } = Input;

function MessageBlob(props: {user: string; content: string}) {
    return (
        <List.Item style={{ width: '300px', display: 'flex'}}>
            <Space direction="vertical" style={{ width: '300px', display: 'flex'}}>
                <div
                style={{display: 'flex', justifyContent: props.user === 'User' ? 'flex-end' : 'flex-start',}}>
                    <div
                        style={{maxWidth: '250px', padding: '10px',borderRadius: '15px', backgroundColor: props.user === 'User' ? '#cccccc' : '#fff'}}>
                        <Typography.Text>{props.content}</Typography.Text>
                    </div>
                </div>
            </Space>
        </List.Item>
    );
}

export function ChatInterface(props: { session_id: string, user: string }) {
    const [messages, setMessages] = useState<MessageProps[]>([]);
    const [input, setInput] = useState<string>('');
    const [spin, setSpin] = useState<boolean>(true);
    const [prompted, setPrompted] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            ipcRenderer.chatGetOrCreate(props.user, props.session_id).then((history: any)=>{
                setMessages(history.messages);
            }).catch();
            ipcRenderer.sessionCreate(props.session_id)
                .then((res: boolean) => { if (res) setSpin(false); })
                .catch((error: any) => { console.error(error); });
        };
        fetchData();
    }, [props.session_id]);

    useEffect(()=>{
        ipcRenderer.onLLMStream((res: string) => {
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
            const newMessage: MessageProps = { user: 'User', content: input };
            const returnMessage: MessageProps = { user: 'Robot', content: '' };
            ipcRenderer.chatHistory(props.user, props.session_id, newMessage);
            setMessages([...messages, newMessage, returnMessage]);
            setInput('');
            setSpin(true);
            setPrompted(true);
            // const knowledge = await ipcRenderer.knowledgeQuery({content: input, nResults: 5, meta: {}});
            // const results = await ipcRenderer.sessionQuery({content: input, user: 'User', nResults: 5});

            ipcRenderer.promptLLM({content: input, 
                system: '',
                user: 'User',
                model: 'llama3.1'
            });
            // ipcRenderer.sessionNote({user: 'User', prompts: [input], ids: [nanoid()]});
        }
    }, [input, messages]);

    useEffect(()=>{
        if (prompted && !spin) {
            if (messages.length >= 1) ipcRenderer.chatHistory(props.user, props.session_id, messages[messages.length-1]);
        }
    }, [prompted, spin]);

    const stopMessage = useCallback(()=>{
        setSpin(false);
    }, []);

    return (
        <Layout style={{ 
            background: '#fff', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column' 
        }}>
            <Content style={{ 
                flex: 1, 
                overflowY: 'auto', 
                display: 'flex',
                flexDirection: 'column',
                padding: '8px'
            }}>
                {messages.length > 0 ? (
                    <List 
                        dataSource={messages} 
                        renderItem={(item) => (
                            <MessageBlob user={item.user} content={item.content} />
                        )} 
                    />
                ) : <div />}
            </Content>
            <Footer style={{ 
                background: '#fff', 
                padding: '8px', 
                flexShrink: 0, 
                borderTop: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'flex', position: 'relative' }}>
                    <UpLoadPdf 
                        serverURL={"http://localhost:5051/general/v0"}
                        style={{
                            backgroundColor: 'black',
                            borderColor: 'black',
                            color: 'white',
                            position: 'absolute',
                            left: '10px',
                            bottom: '5px',
                            zIndex: 1
                        }}
                    />
                    <TextArea
                        rows={4}
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={{
                            flex: 1,
                            resize: 'none',
                            background: '#eeeeee',
                            paddingRight: '30px',
                            borderRadius: '10px'
                        }}
                    />
                    <Button
                        icon={spin ? <XFilled /> : <ArrowUpOutlined />}
                        onClick={spin ? stopMessage : sendMessage}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            bottom: '5px',
                            zIndex: 1,
                        }}
                        shape='circle'
                    />
                </div>
            </Footer>
        </Layout>
    );
}