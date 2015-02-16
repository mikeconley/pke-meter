'use strict';

const { Cc, Ci, Cu } = require('chrome');
const self = require('sdk/self');
const fileIO = require('sdk/io/file');
const UNSAFE_CPOW_MESSAGE = 'unsafe CPOW usage';

let tick_ogg = require('./tick-ogg').tick_ogg;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');

let gLoaded = false;

function tick() {
  if (!gLoaded) {
    return;
  }

  pageWorker.port.emit('play-tick');
}

// Hack alert - in order to play audio, we need to use the
// Audio API that's available in content scripts. The problem
// is that the coin.mp3 file is a resource:// url which
// about:blank is not privledged enough to access. about:about,
// however, is privledged, _and_ can run audio. I felt this was
// better than piping over a data URI.
let pageWorker = require('sdk/page-worker').Page({
  contentScriptFile: self.data.url('audio-content.js'),
  contentURL: 'about:about',
  contentScriptOptions: {
    ogg: tick_ogg,
  },
});

pageWorker.port.on('loaded', function() {
  gLoaded = true;
});

const ConsoleListener = {
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIConsoleListener]),
  observe: function(msg) {
    if (msg.message.contains(UNSAFE_CPOW_MESSAGE)) {
      tick();
    }
  },
};

exports.main = function(options, callbacks) {
  Services.console.registerListener(ConsoleListener);
};

exports.onUnload = function(reason) {
  Services.console.unregisterListener(ConsoleListener);
};

