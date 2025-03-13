import { Space, Button, Avatar, Modal } from "antd"; 
import {useCallback, useState} from 'react';
import SignUp from "./signup";
import Login from "./login";
import { UserSessions } from "./user-sessions";
import { UserOutlined, MessageOutlined } from '@ant-design/icons';
const { ipcRenderer } = window as any;

interface UserInterfaceProps {
    setUserInfo: React.Dispatch<React.SetStateAction<{ name: string }>>;
    setChatRoomId: React.Dispatch<React.SetStateAction<string>>;
}

export default function UserInterface({ setUserInfo, setChatRoomId }: UserInterfaceProps) {
    const [login, setLogin] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>("");
    const [modalOpened, setModalOpened] = useState<boolean>(false);
    const setUserInfoRef = async (userInfo: { name: string }) => {
        ipcRenderer.dockerLaunch(userInfo).then(
            async (docker_launched: boolean) => {
                if (docker_launched) {
                    setUserInfo(userInfo); 
                    setUserName(userInfo.name);
                    setLogin(true);
                }
            }
        ).catch( (error: any) => {console.error(error)}) ;
    };
    const logout = () => {
        setModalOpened(false);
        setUserName("");
        setUserInfo({name: ""}); 
        setLogin(false);
    };
    const showUserSessions = useCallback(()=>{
        if (userName !== "" && modalOpened === false) setModalOpened(true);
        else setModalOpened(false);
    }, [userName]);
    return (
        <Space direction="horizontal" size="middle">
            { login === true? 
            <Avatar size={38} icon={<UserOutlined style={{ color: '#aaa' }} />} style={{ backgroundColor: '#fff' }} onClick={()=>{}}/>
            : <SignUp/>}
            { login === true?<MessageOutlined style={{color: "#1890ff"}} onClick={showUserSessions} />:  <></>}
            { login === true ? <Button type="primary" onClick={logout} danger>Log Out</Button> : <Login setUserInfoRef={setUserInfoRef}/> }
            <Modal open={modalOpened} footer={null} closable={false}  width={'300px'} style={{position: "fixed", top: '10%', right: '10px'}} mask={false}>
                <UserSessions name = {userName} setModalOpened={setModalOpened} setChatRoomId={setChatRoomId}></UserSessions>
            </Modal>
        </Space>
    );
}