import { Button, Modal, Input, message } from 'antd';
import { useCallback, useState } from "react";

const { ipcRenderer } = window as any;

export default function SignUp() {
    const [modalOpened, setModalOpened] = useState(false);
    const [notify, contextNotify] = message.useMessage();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const sign_up = useCallback(() => {
        setModalOpened(true);
    }, []);

    const handleOk = useCallback(async () => {
        if (!userName || !password) {
            notify.open({ type: 'error', content: 'Username and password are required' });
            return;
        }

        try {
            const success = await ipcRenderer.registUser( { name: userName, password });
            if (!success) {
                notify.open({ type: 'error', content: 'Sign up failed, User already exists' });
            } else {
                notify.open({ type: 'success', content: 'Sign up successful' });
                setModalOpened(false);
            }
        } catch (error) {
            console.error(error);
            notify.open({ type: 'error', content: 'An error occurred while signing up' });
        }
    }, [userName, password]);

    return (
        <div>
            {contextNotify}
            <Button type="primary" onClick={sign_up}>Sign up</Button>
            <Modal title="Sign Up" open={modalOpened} onOk={handleOk} onCancel={() => setModalOpened(false)}>
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
