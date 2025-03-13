import { Button, Modal, Input, message } from 'antd';
import { useCallback, useState } from "react";

const { ipcRenderer } = window as any;

export default function Login({ setUserInfoRef }: { setUserInfoRef: (userInfo: { name: string }) => void }) {
    const [modalOpened, setModalOpened] = useState(false);
    const [notify, contextNotify] = message.useMessage();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const login = useCallback(() => {
        setModalOpened(true);
    }, []);

    const handleLogin = useCallback(async () => {
        if (!userName || !password) {
            notify.open({ type: 'error', content: 'Username and password are required' });
            return;
        }

        try {
            const success = await ipcRenderer.userValidate({ name: userName, password });
            if (!success) {
                notify.open({ type: 'error', content: 'Login failed, wrong user name or password' });
            } else {
                notify.open({ type: 'success', content: 'Login successful' });
                setUserInfoRef({name: userName});
                setModalOpened(false);
            }
        } catch (error) {
            console.error(error);
            notify.open({ type: 'error', content: 'An error occurred while login' });
        }
    }, [userName, password]);

    return (
        <div>
            {contextNotify}
            <Button type="default" onClick={login} style={{borderColor: '#1890ff', borderWidth: 1.5}}>Login</Button>
            <Modal title="Login" open={modalOpened} onCancel={() => setModalOpened(false)}
                footer={[<Button key="login" type="primary" onClick={handleLogin}>Login</Button>]}>
                <Input 
                    placeholder="Username"
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                />
                {showPassword ? (
                    <Input 
                        placeholder="Password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                ) : (
                    <Input.Password 
                        placeholder="Password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                    />
                )}
            </Modal>
        </div>
    );
}
