import { ipcRenderer, contextBridge } from 'electron'
import { userProps, promptProps, messageProps, knowledgePromptProps, knowledgeProps } from './types';
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
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openFile: (filename: string) => ipcRenderer.invoke('open-file', filename),
  registUser: (user: userProps) => ipcRenderer.invoke('regist', user), 
  validateUser: (user: userProps) => ipcRenderer.invoke('validate-user', user), 
  promptLLM: (prompt: promptProps) => ipcRenderer.invoke('prompt-llm', prompt),
  onPromptedStream: (func: Function) => ipcRenderer.on('llm-stream', (event, res) => {func(res);}), 
  launchContainers: (user_info: userProps) => ipcRenderer.invoke('launch-docker-containers', user_info), 
  createChromaClient: (session_name: string) => ipcRenderer.invoke('create-chroma-client', session_name), 
  addConversationHistory: (message: messageProps) => ipcRenderer.invoke('add-session-history', message), 
  getConversationHistory: (prompt: promptProps) => ipcRenderer.invoke('query-session-history', prompt),
  addKnowledge: (knowledge: knowledgeProps) => ipcRenderer.invoke('add-knowledge', knowledge),
  getKnowledge: (prompt: knowledgePromptProps) => ipcRenderer.invoke('query-knowledge', prompt),
})