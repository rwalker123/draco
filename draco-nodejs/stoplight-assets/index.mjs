import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const assetsDir = resolve(dirname(fileURLToPath(import.meta.url)), 'dist');

export { assetsDir };
export default { assetsDir };
