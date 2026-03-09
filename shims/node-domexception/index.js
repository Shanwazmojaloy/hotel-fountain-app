'use strict';

// Use the platform's native DOMException instead of the deprecated node-domexception package
if (typeof globalThis.DOMException === 'undefined') {
  throw new Error('DOMException is not available in this environment. Node.js 16+ is required.');
}

module.exports = globalThis.DOMException;
