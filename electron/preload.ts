import { ipcRenderer, contextBridge } from 'electron'
import { userProps, promptProps, messageProps, queryProps, knowledgePromptProps, knowledgeProps } from './types';
// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
  fileOpenDialog: () => ipcRenderer.invoke('file:open-dialog'),
  fileRead: (filename: string) => ipcRenderer.invoke('file:read', filename),
  userRegister: (user: userProps) => ipcRenderer.invoke('user:register', user), 
  userValidate: (user: userProps) => ipcRenderer.invoke('user:validate', user), 
  promptLLM: (prompt: promptProps) => ipcRenderer.invoke('llm:prompt', prompt),
  onLLMStream: (func: Function) => ipcRenderer.on('llm:stream', (event, res) => {func(res);}), 
  dockerLaunch: (user_info: userProps) => ipcRenderer.invoke('docker:launch', user_info), 
  sessionCreate: (session_name: string) => ipcRenderer.invoke('session:create', session_name), 
  sessionNote: (message: messageProps) => ipcRenderer.invoke('session:note', message), 
  sessionQuery: (query: queryProps) => ipcRenderer.invoke('session:query', query),
  knowledgeNote: (knowledge: knowledgeProps) => ipcRenderer.invoke('knowledge:note', knowledge),
  knowledgeQuery: (query: knowledgePromptProps) => ipcRenderer.invoke('knowledge:query', query),
  chatGetRooms: (name: string) => ipcRenderer.invoke('chat:get-rooms', name),
  chatGetOrCreate: (user_name: string, session_id: string, title: string) => ipcRenderer.invoke('chat:get-or-create', user_name, session_id, title),
  chatHistory: (user_name: string, session_id: string, content: any) => ipcRenderer.invoke('chat:history', user_name, session_id, content),
  chatSetTitle: (user_name: string, session_id: string, title: string) => ipcRenderer.invoke('chat:set-title', user_name, session_id, title),
  chatDelete: (user_name: string, session_id: string) => ipcRenderer.invoke('chat:delete', user_name, session_id),
})