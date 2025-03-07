import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as fs from "fs";
import {registerUser, validateUser} from './crypto';
import ollama from 'ollama';
import {launchDockerContainers, stopAndRemoveContainers} from './docker-launcher';
import { EmbeddedClient } from './chroma';
const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

ipcMain.handle('open-file-dialog', async () => {
  if (win) {
    const result = await dialog.showOpenDialog(win, {
      title: 'Choose file',
      buttonLabel: 'Open',
      properties: ['openFile'],
      filters: [{ name: 'Document', extensions: ['pdf'] }]
    });
    return result.filePaths.length > 0 ? result.filePaths[0] : null;
  } else {
    return null;
  }
});

ipcMain.handle('open-file', (event, filename) => {
  if (win) {
    const data = fs.readFileSync(filename);
    return data;
  } else {
    return null;
  }
});

ipcMain.handle('regist', (event, user) => {
  if (win) {
    return registerUser(user.name, user.password);
  } else {
    return false;
  }
});

ipcMain.handle('validate-user', (event, user) => {
  if (win) {
    return validateUser(user.name, user.password);
  } else {
    return false;
  }
});

ipcMain.handle('prompt-llm', async (event, prompt) => {
  if (win) {
    const response = await ollama.chat({
      model: prompt.model? prompt.model: 'llama3',
      messages: [{ role: prompt.user? prompt.user: 'user', content: prompt.content }],
      stream: true,
    });
    for await (const part of response) {
      event.sender.send('llm-stream', part.message.content);
    }
  } else {
    return;
  }
});

ipcMain.handle('launch-docker-containers', async (event, user_info) => {
  if (win) {
    try {
      const containers = await launchDockerContainers(user_info);
      app.on('window-all-closed', async () => {
        await stopAndRemoveContainers(containers);
      });
      return true;
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
});

ipcMain.handle('create-chroma-client', async (event, session_name) => {
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

ipcMain.handle('add-session-history', async (event, message) => {
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

ipcMain.handle('query-session-history', async (event, prompt) => {
  if (win) {
    if (embedding_client?.isValid()) {
      const results = await embedding_client.querySessionHistory(prompt.content, prompt.nResults, prompt.user);
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

ipcMain.handle('add-knowledge', async (event, knowledge) => {
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

ipcMain.handle('query-knowledge', async (event, prompt) => {
  if (win) {
    if (embedding_client?.isValid()) {
      const results = await embedding_client.queryPdfSegment(prompt.content, prompt.nResults, prompt.meta);
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