"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // You can expose other APTs you need here.
  // ...
  fileOpenDialog: () => electron.ipcRenderer.invoke("file:open-dialog"),
  fileRead: (filename) => electron.ipcRenderer.invoke("file:read", filename),
  userRegister: (user) => electron.ipcRenderer.invoke("user:register", user),
  userValidate: (user) => electron.ipcRenderer.invoke("user:validate", user),
  promptLLM: (prompt) => electron.ipcRenderer.invoke("llm:prompt", prompt),
  onLLMStream: (func) => electron.ipcRenderer.on("llm:stream", (event, res) => {
    func(res);
  }),
  dockerLaunch: (user_info) => electron.ipcRenderer.invoke("docker:launch", user_info),
  sessionCreate: (session_name) => electron.ipcRenderer.invoke("session:create", session_name),
  sessionNote: (message) => electron.ipcRenderer.invoke("session:note", message),
  sessionQuery: (query) => electron.ipcRenderer.invoke("session:query", query),
  knowledgeNote: (knowledge) => electron.ipcRenderer.invoke("knowledge:note", knowledge),
  knowledgeQuery: (query) => electron.ipcRenderer.invoke("knowledge:query", query),
  chatGetRooms: (name) => electron.ipcRenderer.invoke("chat:get-rooms", name),
  chatGetOrCreate: (user_name, session_id, title) => electron.ipcRenderer.invoke("chat:get-or-create", user_name, session_id, title),
  chatHistory: (user_name, session_id, content) => electron.ipcRenderer.invoke("chat:history", user_name, session_id, content),
  chatSetTitle: (user_name, session_id, title) => electron.ipcRenderer.invoke("chat:set-title", user_name, session_id, title),
  chatDelete: (user_name, session_id) => electron.ipcRenderer.invoke("chat:delete", user_name, session_id)
});
