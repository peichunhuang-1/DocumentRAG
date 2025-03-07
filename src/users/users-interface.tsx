import { Space, Button, Avatar, Typography } from "antd"; 
import {useRef, useState} from 'react';
import SignUp from "./signup";
import Login from "./login";
import { UserOutlined } from '@ant-design/icons';
const { ipcRenderer } = window as any;

interface UserInterfaceProps {
    setUserInfo: React.Dispatch<React.SetStateAction<{ name: string }>>;
}

export default function UserInterface({ setUserInfo }: UserInterfaceProps) {
    const [login, setLogin] = useState<boolean>(false);
    const setUserInfoRef = async (userInfo: { name: string }) => {
        ipcRenderer.launchContainers(userInfo).then(
            async (docker_launched: boolean) => {
                if (docker_launched) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    setUserInfo(userInfo); 
                    setLogin(true);
                }
            }
        ).catch( (error: any) => {console.error(error)}) ;
    };
    const logout = () => {
        setLogin(false);
    };
    return (
        <Space direction="horizontal" size="middle">
            { login === true? 
            <Avatar size={38} icon={<UserOutlined style={{ color: '#aaa' }} />} style={{ backgroundColor: '#fff' }}/>
            : <SignUp/>}
            { login === true ? <Button type="primary" onClick={logout} danger>Log Out</Button> : <Login setUserInfoRef={setUserInfoRef}/> }
        </Space>
    );
}