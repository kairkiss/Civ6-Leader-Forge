import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { generateMod, parseProjectConfig, type Civ6LeaderProjectConfig } from '../../generator/src';

const isDev = !app.isPackaged;

function getDefaultCiv6ModsPath(): string {
  return path.join(
    app.getPath('documents'),
    'My Games',
    "Sid Meier's Civilization VI",
    'Mods',
  );
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: 'Civ6 Leader Forge',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:selectOutputDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select output directory',
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:selectImageFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select image file',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const filePath = result.filePaths[0];
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return {
      path: filePath,
      dataUrl: `data:image/${mime};base64,${data.toString('base64')}`,
    };
  });

  ipcMain.handle(
    'generator:generateMod',
    async (_event, config: Civ6LeaderProjectConfig, outputDir: string) => {
      return generateMod(parseProjectConfig(config), outputDir);
    },
  );

  ipcMain.handle('export:zip', async (_event, folderPath: string) => {
    const info = await stat(folderPath);
    if (!info.isDirectory()) {
      throw new Error('Export ZIP expects a generated mod folder.');
    }
    const zipPath = `${folderPath}.zip`;
    const zip = new AdmZip();
    zip.addLocalFolder(folderPath, path.basename(folderPath));
    zip.writeZip(zipPath);
    return { zipPath };
  });

  ipcMain.handle('export:installToCiv6Mods', async (_event, folderPath: string) => {
    const modsPath = getDefaultCiv6ModsPath();
    const destination = path.join(modsPath, path.basename(folderPath));
    await mkdir(modsPath, { recursive: true });
    await cp(folderPath, destination, { recursive: true, force: true });
    return { destination };
  });

  ipcMain.handle('shell:openFolder', async (_event, folderPath: string) => {
    const info = await stat(folderPath);
    if (info.isDirectory()) {
      await shell.openPath(folderPath);
    } else {
      await shell.showItemInFolder(folderPath);
    }
  });

  ipcMain.handle('paths:getDefaultCiv6ModsPath', () => getDefaultCiv6ModsPath());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
