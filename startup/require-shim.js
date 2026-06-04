(function () {
  'use strict';

  var fakeBrowserWindow = {
    app: {
      developerMode: true,
      isJonas: false,
      relaunch: function () { location.reload(); },
      openItem: function (path) {},
      openLink: function (url) { window.open(url, '_blank'); },
      failedMods: [],
      getPath: function () { return ''; },
      getVersion: function () { return '1.24'; },
    },
    getCurrentWindow: function () { return fakeBrowserWindow; },
    setFullScreen: function () {},
    toggleDevTools: function () {},
    isDevToolsOpened: function () { return false; },
    openDevTools: function () {},
    setBounds: function () {},
    getBounds: function () {
      return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    },
    on: function () {},
    focus: function () {},
    blur: function () {},
    setMenu: function () {},
    loadURL: function () {},
    webContents: { openDevTools: function () {} },
  };

  var fakeElectronRemote = {
    BrowserWindow: {
      getAllWindows: function () { return [fakeBrowserWindow]; },
    },
    app: {
      getPath: function () { return ''; },
      getVersion: function () { return '1.24'; },
    },
    shell: {
      openExternal: function (url) { window.open(url, '_blank'); },
      openItem: function () {},
    },
    dialog: {
      showMessageBox: function () {},
      showOpenDialog: function (opts, cb) { if (cb) cb([]); },
    },
  };

  var fakeElectron = {
    remote: fakeElectronRemote,
    ipcRenderer: {
      send: function () {},
      on: function () {},
      once: function () {},
      removeListener: function () {},
    },
    shell: fakeElectronRemote.shell,
    app: fakeElectronRemote.app,
  };

  var fakeFs = {
    readFile: function (p, enc, cb) { if (typeof enc === 'function') enc(null, ''); else cb(null, ''); },
    readFileSync: function () { return ''; },
    writeFile: function (p, d, o, cb) { if (typeof o === 'function') o(null); else if (cb) cb(null); },
    writeFileSync: function () {},
    existsSync: function () { return false; },
    mkdirSync: function () {},
    mkdir: function (p, o, cb) { if (typeof o === 'function') o(null); else if (cb) cb(null); },
    unlink: function (p, cb) { if (cb) cb(null); },
    unlinkSync: function () {},
    readdirSync: function () { return []; },
    readdir: function (p, cb) { cb(null, []); },
    statSync: function () { return { isDirectory: function () { return false; }, isFile: function () { return true; }, mtime: new Date() }; },
    stat: function (p, cb) { cb(null, { isDirectory: function () { return false; }, mtime: new Date() }); },
    createReadStream: function () { return { pipe: function () {}, on: function () {} }; },
    createWriteStream: function () { return { on: function () {}, write: function () {}, end: function () {} }; },
    constants: { F_OK: 0, R_OK: 4, W_OK: 2 },
  };

  var fakeWriteFileAtomic = {
    sync: function (path, data) {
      if (window.__diskBridge) {
        try { window.__diskBridge.send('save-file', JSON.stringify({ fileName: path, content: data })); } catch (e) {}
      }
    },
  };

  var fakeFilenamify = function (str, opts) {
    var replacement = (opts && opts.replacement != null) ? opts.replacement : '!';
    return String(str).replace(/[\/\\:*?"<>|]/g, replacement).trim() || 'unnamed';
  };

  var fakeGreenworks = {
    initAPI: function () { return false; },
    activateAchievement: function (name, cb) { if (cb) cb(); },
    clearAchievement: function (name, cb) { if (cb) cb(); },
    getNumberOfPlayers: function (cb) { if (cb) cb(0); },
    ugcGetItems: function (opts, cb) { if (cb) cb([]); },
    ugcGetUserItems: function (opts, sortOrder, cb) { if (cb) cb([], 0); },
    ugcSynchronizeItems: function (path, cb) { if (cb) cb(); },
    ugcPublish: function (title, desc, dir, img, tags, cb) { if (cb) cb(null, {}); },
    ugcPublishUpdate: function (id, title, desc, dir, img, tags, cb) { if (cb) cb(null, {}); },
    ugcUnsubscribe: function (id, cb) { if (cb) cb(); },
    ugcShowOverlay: function () {},
    getSteamId: function () { return { steamId: '0', screenName: 'Player' }; },
    isCloudEnabled: function () { return false; },
    isCloudEnabledForUser: function () { return false; },
    _ugcGetItemInstallInfo: function () { return null; },
    on: function () {},
    _events: {},
  };

  var fakeTarFs = {
    extract: function () { return { on: function () {} }; },
    pack: function () { return { on: function () {} }; },
  };

  var fakeRimraf = function (path, cb) { if (cb) cb(null); };
  fakeRimraf.sync = function () {};

  var MODULE_MAP = {
    'electron':                   fakeElectron,
    'fs':                         fakeFs,
    'write-file-atomic':          fakeWriteFileAtomic,
    'filenamify':                 fakeFilenamify,
    './greenworks/greenworks.js': fakeGreenworks,
    'greenworks':                 fakeGreenworks,
    'tar-fs':                     fakeTarFs,
    'rimraf':                     fakeRimraf,
    'angular':    function () { return window.angular || {}; },
    'jquery':     function () { return window.jQuery || window.$ || function(){}; },
    'sortablejs': function () { return window.Sortable || {}; },
  };

  window.require = function (id) {
    if (typeof id === 'string' && id.startsWith('./locale/')) return {};
    if (id === './scripts/data/enums') return window.Enums || {};
    if (typeof id === 'string' && !MODULE_MAP[id]) return {};
    var mod = MODULE_MAP[id];
    if (typeof mod === 'function' && mod !== fakeFilenamify && mod !== fakeRimraf) return mod();
    return mod;
  };

  Object.defineProperty(window, 'require', { value: window.require, writable: true, configurable: true });
})();
