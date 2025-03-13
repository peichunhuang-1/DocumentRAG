import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as fs from "fs";
import {registerUser, validateUser} from './crypto';
import {Assistant} from './memory_assistant';
import {launchDockerContainers, stopAndRemoveContainers} from './docker-launcher';
import { EmbeddedClient } from './chroma';
import { nanoid } from 'nanoid';
import { memo } from 'react';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const __root__ = process.env.HOME || process.env.USERPROFILE;
const __dir__ = path.join(__root__ || "/", '.research.go', 'users');
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let embedding_client: EmbeddedClient | null = null;
let assistant = new Assistant();

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    let headers = details.responseHeaders;
    if (!headers) {
      console.error("Response without header");
      return;
    }
    if (details.url.includes('localhost')) {
      headers['Access-Control-Allow-Origin'] = ['*'];
      headers['Access-Control-Allow-Headers'] = ['*'];
      headers['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE'];
    }
  
    callback({ responseHeaders: headers });
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//     win = null
//   }
// })

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

ipcMain.handle('file:open-dialog', async () => {
  if (win) {
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose file',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [{ name: 'Document', extensions: ['pdf'] }]
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths.length > 0 ? result.filePaths[0] : null;
  } else {
    return null;
  }
});

ipcMain.handle('file:read', (event, filename) => {
  if (win) {
    const data = fs.readFileSync(filename);
    return data;
  } else {
    return null;
  }
});

ipcMain.handle('user:register', (event, user) => {
  if (win) {
    return registerUser(user.name, user.password);
  } else {
    return false;
  }
});

ipcMain.handle('user:validate', (event, user) => {
  if (win) {
    return validateUser(user.name, user.password);
  } else {
    return false;
  }
});

ipcMain.handle('llm:prompt', async (event, prompt) => {
  if (win) {
    const messages = await assistant.call_apis(prompt);
    var memory: any | null = null;
    if (messages.tool_calls) {
      for (const tool of messages.tool_calls) {
        if (tool.function.name === 'session:note') {
          if (embedding_client?.isValid()) {
            await embedding_client.addSessionHistory([tool.function.arguments.keywords], [nanoid()], prompt.user);
          } else {
            console.error("Conversation is not memorized");
          }
        }
        else if (tool.function.name === 'session:query') {
          const query = {content: tool.function.arguments.content, nResults: tool.function.arguments.nResults, user: prompt.user};
          if (embedding_client?.isValid()) {
            memory = await embedding_client.querySessionHistory(query.content, query.nResults, query.user);
          } else {
            console.error("Cannot query converation history");
            return;
          }
        }
      }
    }
    console.log(memory);
    await assistant.chat(prompt, memory?.documents[0][0], event);
  } else {
    return;
  }
});

ipcMain.handle('docker:launch', async (event, user_info) => {
  if (win) {
    try {
      const containers = await launchDockerContainers(user_info);
      app.on('window-all-closed', async () => {
        await stopAndRemoveContainers(containers);
        app.quit();
        win = null;
      });
      return true;
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
});

ipcMain.handle('session:create', async (event, session_name) => {
  if (win) {
    embedding_client = new EmbeddedClient();
    await embedding_client.getSessionHistory(session_name);
    await embedding_client.getPdfDataBase();
    var success: boolean = embedding_client.isValid();
    return success;
  } else {
    return false;
  }
});

ipcMain.handle('session:note', async (event, message) => {
  if (win) {
    if (embedding_client?.isValid()) {
      await embedding_client.addSessionHistory(message.prompts, message.ids, message.user);
    } else {
      console.error("Conversation is not memorized");
    }
  } else {
    console.error("Conversation is not memorized");
  }
});

ipcMain.handle('session:query', async (event, query) => {
  if (win) {
    if (embedding_client?.isValid()) {
      const results = await embedding_client.querySessionHistory(query.content, query.nResults, query.user);
      return results;
    } else {
      console.error("Cannot query converation history");
      return [];
    }
  } else {
    console.error("Cannot query converation history");
    return [];
  }
});

ipcMain.handle('knowledge:note', async (event, knowledge) => {
  if (win) {
    if (embedding_client?.isValid()) {
      await embedding_client.addPdfData(knowledge.data, knowledge.ids, knowledge.meta);
    } else {
      console.error("Knowledge is not memorized");
    }
  } else {
    console.error("Knowledge is not memorized");
  }
});

ipcMain.handle('knowledge:query', async (event, query) => {
  if (win) {
    if (embedding_client?.isValid()) {
      const results = await embedding_client.queryPdfSegment(query.content, query.nResults, query.meta);
      return results;
    } else {
      console.error("Cannot query pre-knowledge");
      return [];
    }
  } else {
    console.error("Cannot query pre-knowledge");
    return [];
  }
});

ipcMain.handle('chat:get-rooms', (event, user_name) => {
  if (win) {
    const sessionsFilePath = path.join(__dir__, user_name, 'sessions.json');
    if (!fs.existsSync(sessionsFilePath)) {fs.writeFileSync(sessionsFilePath, JSON.stringify([], null, 2), 'utf-8');}
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));
    return sessions;
  } else {
    return [];
  }
});

ipcMain.handle('chat:get-or-create', (event, user_name, session_id, title) => {
  if (win) {
    const sessionPath = path.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path.join(sessionPath, 'history.json');
    const sessionsFilePath = path.join(__dir__, user_name, 'sessions.json');
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
      fs.writeFileSync(historyFilePath, JSON.stringify({title: title, messages: []}));
    }
    const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));
    const sessionIndex = sessions.findIndex((s: { id: string }) => s.id === session_id);
    if (sessionIndex === -1) {
      sessions.push({title: title, id: session_id});
      fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2), 'utf-8');
    }
    return history;
  }
  return {title: title, messages: []};
});

ipcMain.handle('chat:history', (event, user_name, session_id, content) => {
  if (win) {
    const sessionPath = path.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path.join(sessionPath, 'history.json');
    if (!fs.existsSync(sessionPath)) {return;}
    const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    history['messages'].push(content);
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
  }
});

ipcMain.handle('chat:set-title', (event, user_name, session_id, title) => {
  if (win) {
    const sessionPath = path.join(__dir__, user_name, `.${session_id}`);
    const historyFilePath = path.join(sessionPath, 'history.json');
    const sessionsFilePath = path.join(__dir__, user_name, 'sessions.json');
    if (!fs.existsSync(sessionPath) || !fs.existsSync(historyFilePath) || !fs.existsSync(sessionsFilePath)) {
      return false;
    }
    const history = JSON.parse(fs.readFileSync(historyFilePath, 'utf-8'));
    history.title = title;
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2), 'utf-8');

    const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));

    const sessionIndex = sessions.findIndex((s: { id: string }) => s.id === session_id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].title = title;
      fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2), 'utf-8');
      return true;
    }
    return false;
  }
  return false;
});

ipcMain.handle('chat:delete', (event, user_name, session_id) => {
  if (win) {
    const sessionPath = path.join(__dir__, user_name, `.${session_id}`);
    const sessionsFilePath = path.join(__dir__, user_name, 'sessions.json');
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    if (fs.existsSync(sessionsFilePath)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFilePath, 'utf-8'));
      const updatedSessions = sessions.filter((session: any) => session.id !== session_id);
      fs.writeFileSync(sessionsFilePath, JSON.stringify(updatedSessions, null, 2), 'utf-8');
    }
  }
})