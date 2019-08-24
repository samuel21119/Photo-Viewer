const {
    app,
    BrowserWindow,
    dialog,
    Menu,
    MenuItem
} = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');
const open = require('open');
const request = require('request');
const pkg = require('./package.json');
const ipc = require('electron').ipcMain
UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:68.0) Gecko/20100101 Firefox/68.0';


app.on('ready', function() {
    setMainMenu();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});
function createWindow() {
    // Create the browser window.
    var transparent = process.platform === 'darwin';
    win = new BrowserWindow({
        width: 800,
        height: 800,
        maximizable: true,
        transparent: transparent,
        backgroundColor: "#404040",
        webPreferences: {
            nodeIntegration: true
        },
        show: false
    });
    win.maximize();
    win.show();

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // When Window Close.
    win.on('closed', () => {
        win = null;
    });

    CheckUpdate();
}
function setMainMenu() {

    const isMac = process.platform === 'darwin'

    const template = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            {
                label: 'Open Folder...',
                accelerator: 'CmdOrCtrl+O',
                click: () => {open_file_dialog();}
            },
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startspeaking' },
                        { role: 'stopspeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
             ])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Find',
            submenu: [
                {
                    label: 'Find',
                    accelerator: 'CmdOrCtrl+F',
                    click: () => {
                        let mod = [];
                        mod.push('meta');
                        win.webContents.sendInputEvent({ type: 'keyDown', modifiers: mod, keyCode: 'F' });
                        // win.webContents.sendInputEvent({ type: 'char', mod, keyCode: 'F' });
                        win.webContents.sendInputEvent({ type: 'keyUp', modifiers: mod, keyCode: 'F'});
                    }
                }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
        {
            role: 'help',
            submenu: [{
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron')
                    await shell.openExternal('https://electronjs.org')
                }
            }
            ]
        }
    ]


    const menu = Menu.getApplicationMenu();
    const submenu = new Menu();
    submenu.append(new MenuItem({
        label: 'Open Folder',
        accelerator: 'Cmd+O',
        click: () => {open_file_dialog();}
    }))
    menu.insert(1, new MenuItem({
        label: "File",
        submenu: submenu
    }));
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
ipc.on('open-file-dialog', function (event) {
    open_file_dialog();
})
function CheckUpdate() {
    request({
        url: 'https://api.github.com/repos/samuel21119/Photo-Viewer/releases/latest',
        headers: {'User-Agent': UserAgent}}, function(err, resp, body) {
        if (err || resp.statusCode !== 200)
            return;
        body = JSON.parse(body);
        current_version = pkg.version;
        latest_version = body.name;
        console.log(latest_version , current_version);
        if (current_version !== latest_version) {
            const options = {
                type: 'question',
                buttons: [ 'Yes', 'No'],
                defaultId: 0,
                title: 'Question',
                message: `Do you want to download now?`,
                detail: `New version ${latest_version} found.`,
            };
            dialog.showMessageBox(null, options, (response) => {
                if (response === 0) {
                    var platform = process.platform === 'darwin' ? 0 : 1;
                    var url = body.assets[platform].browser_download_url;
                    var name = body.assets[platform].name;
                    request({url: url}).on('error', function(err) {return;}).pipe(fs.createWriteStream(path.join(app.getPath('downloads'), name))).on('close', function() {
                        const options = {
                            type: 'question',
                            buttons: [ 'Yes', 'No'],
                            defaultId: 0,
                            title: 'Question',
                            message: `Download complete!\nClose and install update now?`,
                        };
                        dialog.showMessageBox(null, options, (response) => {
                            if (response === 0) {
                                open(path.join(app.getPath('downloads'), name));
                                app.quit();
                            }
                        });
                    });
                }
            });
        }
    })
}
function open_file_dialog() {
    if (process.platform === 'darwin') {
        const window = win;
        dialog.showOpenDialog(window, { properties: [ 'openDirectory', 'openFile' ]}, function (folder) {
            if (folder) 
                win.webContents.send('selected-directory', folder);
        });
    }else
        dialog.showOpenDialog({properties: ['openDirectory']}, function (folder) {
            if (folder)
                win.webContents.send('selected-directory', folder);
        })
}





