'use strict';

// Hi stranger :-) Come say hi: https://discord.gg/hovgaardgames

const electron = require('electron');
const fs = require('fs');
const os = require('os');
const rimraf = require('rimraf');
var bugsnag = require("bugsnag");

bugsnag.register('15c283f2dd47c1303179935bd8653e6e', {
    appVersion: `electron`,
    collectUserIp: false
});

process.on('uncaughtException', function (error) {
    console.log(error);
});

const setupElectron = () => {
    const app = electron.app;
    const BrowserWindow = electron.BrowserWindow;

    const devHostnames = ['desktop-job0184'];
    const isDev = () => {
        const hostnameString = String(os.hostname());
        return devHostnames.includes(hostnameString.toLowerCase());
    };

    app.commandLine.appendSwitch('force-device-scale-factor', '1');
    app.commandLine.appendSwitch('high-dpi-support', 'true');
    app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');

    console.log(`Running Electron ${process.versions.electron } (node ${process.version})`);

    let mainWindow;

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            minWidth: 1024,
            minHeight: 768,
            width: 1024,
            height: 768,
            frame: true,
            icon: `${__dirname}/images/favicon.ico`,
            webPreferences: {
            }
        });

        // Attach app to the BrowserWindow
        mainWindow.app = app;

        mainWindow.getCurrentWindow = () => mainWindow;

        let indexUrl = 'file://' + __dirname + '/index.html';
        if (process.argv.includes('--dev')) {
            if (isDev()) {
                indexUrl = 'file://' + __dirname + '/index-development.html';
                app.isJonas = true;
            }
            app.developerMode = true;

            // Install AngularJS Batarang dev tools
            const {default: installExtension, ANGULARJS_BATARANG} = require('electron-devtools-installer');
            installExtension(ANGULARJS_BATARANG.id)
                .then((name) => console.log(`Added Extension:  ${name}`))
                .catch((err) => console.log('An error occurred: ', err));

            mainWindow.webContents.openDevTools();
        }

        mainWindow.setMenu(null);
        mainWindow.loadURL(indexUrl);

        mainWindow.on('closed', function () {
            mainWindow = null;
        });
    }

    const gotTheLock = app.requestSingleInstanceLock();
    if(!gotTheLock) {
        app.quit();
    }

    app.on('ready', createWindow);
    app.on('window-all-closed', function () {
        app.quit();
    });

    app.openLink = link => {
        electron.shell.openExternal(link);
    };

    app.openItem = item => {
        electron.shell.openItem(item);
    };

    // Backward compatibility stuff for mods
    app.getAllFiles = (cb) => {
        cb([]);
    };
    app.saveFile = () => {
    };
};

bugsnag.autoNotify(function() {
    setupElectron();
});
