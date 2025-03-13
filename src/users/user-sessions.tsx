import { List, Input, Empty} from 'antd';
import { DeleteOutlined, PlusCircleOutlined, UpOutlined, EditOutlined, MessageFilled } from '@ant-design/icons';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
const { ipcRenderer } = window as any;
interface UserSessionsProps {
    name: string;
    setModalOpened: React.Dispatch<React.SetStateAction<boolean>>;
    setChatRoomId: React.Dispatch<React.SetStateAction<string>>;
}

export function UserSessions({ name, setModalOpened, setChatRoomId}: UserSessionsProps) {
    const [data, setData] = useState<any[]>([]);
    const [update, setUpdate] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState<string>('');
    useEffect(() => {
        console.log("enter")
        const fetchData = async () => {
            setData(await ipcRenderer.chatGetRooms(name));
        };
        fetchData();
    }, [update]);
    const handleEdit = async (sessionId: string) => {
        await ipcRenderer.chatSetTitle(name, sessionId, editingTitle);
        setEditingId(null);
        setUpdate(update + 1);
    };
    return (
        <>
        <List
            dataSource={data}
            renderItem={(item: {title: string, id: string}) => (
                <List.Item actions={[
                    <EditOutlined
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(item.id);
                            setEditingTitle(item.title);
                        }}
                        style={{
                            cursor: 'pointer',
                            color: '#a0a0a0',
                            transition: 'color 0.2s',
                            fontSize: '16px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#1890ff')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0a0')}
                    />,
                    <DeleteOutlined 
                    onClick={(e) => {
                        e.stopPropagation();
                        ipcRenderer.chatDelete(name, item.id);
                        setUpdate(update+1);
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ff4d4f';
                    }} 
                    onMouseLeave={(e) => { 
                        e.currentTarget.style.color = '#a0a0a0';
                    }}
                    style={{ 
                        cursor: 'pointer', 
                        color: '#a0a0a0',
                        transition: 'color 0.2s', 
                        fontSize: '16px' 
                    }} />]} 
                    onClick={() => {setChatRoomId(item.id); setModalOpened(false);}} style={{ fontSize: '13px', cursor: 'pointer'}} 
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}>
                    <List.Item.Meta
                        title={editingId === item.id ? (
                            <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onPressEnter={() => handleEdit(item.id)}
                                onBlur={() => handleEdit(item.id)}
                                autoFocus
                                size="small"
                                style={{ width: '80%'}}
                            />
                        ) : (
                            <span style={{ fontWeight: 'normal' }}>{item.title}</span>
                        )}
                        description={<span style={{ fontSize: '10px', color: '#a0a0a0' }}>{item.id}</span>}
                    />
                </List.Item>
            )}
            style={{ width: '100%', overflowY: 'auto', background: '#fff'}}
            locale={{
                emptyText: (
                    <Empty
                        image={<MessageFilled style={{ fontSize: 40, color: '#ccc' }} />}
                        description={<span style={{ color: '#a0a0a0' }}>Create a new session</span>}
                    />
                ),
            }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <PlusCircleOutlined 
            onClick={() => {const id = nanoid(); ipcRenderer.chatGetOrCreate(name, id, 'new chat'); setUpdate(update+1);}}
            style={{ fontSize: '13px', cursor: 'pointer' }} 
        />
        <UpOutlined 
            onClick={() => { setModalOpened(false); }} 
            style={{ fontSize: '13px', cursor: 'pointer' }} 
        />
        </div>
        </>
    );
}