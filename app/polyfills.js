// polyfills — this module's side effects run BEFORE other imports
// because ES module evaluation is dependency-order (this file first)
import { Buffer } from 'buffer';

if (typeof globalThis !== 'undefined') globalThis.Buffer = Buffer;
if (typeof window !== 'undefined') window.Buffer = Buffer;
if (typeof global !== 'undefined') global.Buffer = Buffer;
