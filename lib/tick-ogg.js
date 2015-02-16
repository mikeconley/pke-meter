'use strict';

exports.tick_ogg = "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";