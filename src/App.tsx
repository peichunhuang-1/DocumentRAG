import { Layout, Menu } from 'antd';
import PdfJs from './pdf-viewer/pdf-viewer';
import UserInterface from './users/users-interface';
import {useEffect, useRef, useState} from 'react';
import { notification } from 'antd';
import {ChatInterface, EmptyChatInterface} from './chat-interface/chat-interface';
const { Header, Content, Footer, Sider } = Layout;


function App() {
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

  return (
    <Layout>
      <Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#eee' }}>
        <UserInterface setUserInfo={setUserInfo}/>
      </Header>
      <Layout>
        <Sider style={{ background: '#ddd' }} >
          <Menu></Menu>
        </Sider>
        <Content>
          <PdfJs src={"/Users/huangpeijun/Desktop/App/DocumentRAG/DocumentRAG/public/1.pdf"} height={1000} clipRegion={{x:100, y: 100, width:1000, height:800}}></PdfJs>
        </Content>
        <Sider width={500} >
          { userInfo.name == ''? <EmptyChatInterface/>: <ChatInterface userInfo={userInfo}/> }
        </Sider>
      </Layout>
    </Layout>
  )
}

export default App
