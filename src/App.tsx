import { Layout, Menu } from 'antd';
import PdfJs from './pdf-viewer/pdf-viewer';
import UserInterface from './users/users-interface';
import {useEffect, useState} from 'react';
import { notification, theme, Breadcrumb} from 'antd';
import './App.css';
import {ResizableChatModal} from './chat-interface/chat-interface';
const { Header, Content, Sider } = Layout;


function App() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args: any[]) => {
      notification.error({
        message: 'An error occurred',
        description: args.join(' '), 
        duration: 5, 
      });
      
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
  const [userInfo, setUserInfo] = useState( {name: ''} );
  const [chatRoomId, setChatRoomId] = useState('');

  return (
    <Layout style={{
      minHeight: '100vh',
    }}>
      <Sider  theme="light" collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} style={{margin: '16px'}}>
          <Menu mode="vertical" theme="light" items={[
    { key: '1', label: '選單 1' },
    { type: 'divider' },
    { key: '2', label: '選單 2' },
    { type: 'divider' },
    { key: '3', label: '選單 3' }
  ]}></Menu>
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: colorBgContainer, margin: '16px 16px 0px 16px'}}>
          <UserInterface setUserInfo={setUserInfo} setChatRoomId={setChatRoomId}/>
        </Header>
        <Breadcrumb style={{ margin: '3px 16px 3px 16px', }}>{`> ${userInfo.name}`}</Breadcrumb>
        <Content style={{ margin: '0px 16px 0px 16px', background: colorBgContainer, borderRadius: borderRadiusLG, position: 'relative' }}>
          <PdfJs src={"/Users/huangpeijun/Desktop/App/DocumentRAG/DocumentRAG/public/1.pdf"} height={1000} clipRegion={{x:100, y: 100, width:1000, height:800}}></PdfJs>
        </Content>
        {chatRoomId !== ""? <ResizableChatModal session_id={chatRoomId} user={userInfo.name}/>: <></>}
      </Layout>
    </Layout>
  )
}

export default App
