import fs from 'fs';
import path from 'path';

try {
  const file = path.resolve('node_modules/vite/dist/client/client.mjs');
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (code.includes('ws.send(JSON.stringify(data));')) {
      code = code.replace(
        'ws.send(JSON.stringify(data));',
        'if (ws && typeof ws.send === "function" && ws.readyState === 1) { ws.send(JSON.stringify(data)); }'
      );
      modified = true;
    }

    if (code.includes('wsTransport.send(data);')) {
      code = code.replace(
        'wsTransport.send(data);',
        'wsTransport?.send?.(data);'
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, code, 'utf8');
      console.log('[patch-vite-client] Successfully patched Vite client transport');
    }
  }

  // Also patch vite-plugin-pwa dev-ready if present
  const pwaChunk = path.resolve('node_modules/vite-plugin-pwa/dist/chunk-I2Z7IWCN.js');
  if (fs.existsSync(pwaChunk)) {
    let pwaCode = fs.readFileSync(pwaChunk, 'utf8');
    if (pwaCode.includes("import.meta.hot.send('${DEV_READY_NAME}')")) {
      pwaCode = pwaCode.replace(
        "import.meta.hot.send('${DEV_READY_NAME}')",
        "if (import.meta.hot && typeof import.meta.hot.send === 'function') { try { import.meta.hot.send('${DEV_READY_NAME}'); } catch (_) {} }"
      );
      fs.writeFileSync(pwaChunk, pwaCode, 'utf8');
      console.log('[patch-vite-client] Successfully patched vite-plugin-pwa chunk');
    }
  }
} catch (err) {
  console.warn('[patch-vite-client] Non-fatal error during patch:', err.message);
}
