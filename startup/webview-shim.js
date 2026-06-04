(function () {
  'use strict';

  const _pendingIpcEvents = [];
  const _ipcListeners = [];

  function deliverIpcEvent(ipcEvent) {
    _ipcListeners.forEach(function (fn) {
      try { fn(ipcEvent); } catch (ex) {}
    });
  }

  const fakeWebview = {
    cache: {},

    send: function (channel, data) {
      if (window.__diskBridge) {
        window.__diskBridge.send(channel, data);
      }
    },

    addEventListener: function (event, fn) {
      if (event === 'ipc-message') {
        _ipcListeners.push(fn);
        if (_pendingIpcEvents.length > 0) {
          const toReplay = _pendingIpcEvents.splice(0);
          setTimeout(function () {
            toReplay.forEach(function (evt) { deliverIpcEvent(evt); });
          }, 0);
        }
      }
    },

    removeEventListener: function () {},
    tagName: 'WEBVIEW',
    nodeType: 1,
  };

  window.__fakeWebview = fakeWebview;

  ['options', 'debug', 'mods', 'savegames', 'saveerror', 'error'].forEach(function (ch) {
    window.addEventListener('__disk__' + ch, function (e) {
      const ipcEvent = { channel: ch, args: [e.detail] };
      if (_ipcListeners.length > 0) {
        deliverIpcEvent(ipcEvent);
      } else {
        _pendingIpcEvents.push(ipcEvent);
      }
    });
  });

  const _qs   = document.querySelector.bind(document);
  const _qsa  = document.querySelectorAll.bind(document);
  const _gbtn = document.getElementsByTagName.bind(document);

  document.querySelector = function (sel) {
    if (sel && sel.toLowerCase() === 'webview') return fakeWebview;
    return _qs(sel);
  };

  document.querySelectorAll = function (sel) {
    if (sel && sel.toLowerCase() === 'webview') return [fakeWebview];
    return _qsa(sel);
  };

  document.getElementsByTagName = function (tag) {
    if (tag && tag.toLowerCase() === 'webview') {
      const list = [fakeWebview];
      list.item = function (i) { return list[i] || null; };
      return list;
    }
    return _gbtn(tag);
  };

  if (!window.app) {
    window.app = {
      developerMode: false,
      isJonas: false,
      openLink: function (url) { window.open(url, '_blank'); },
      openItem: function () {},
      getAllFiles: function (cb) { cb([]); },
      saveFile: function () {},
    };
  }
})();
