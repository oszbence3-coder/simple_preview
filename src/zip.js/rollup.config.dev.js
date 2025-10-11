import replace from "@rollup/plugin-replace";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { compress } from "./lib/core/util/mini-lz.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyWasmModule() {
	return {
		name: "copy-wasm",
		buildStart() {
			const wasmSrc = path.resolve(__dirname, "lib/core/streams/zlib-wasm/zlib-streams.wasm");
			const wasmDest = path.resolve(__dirname, "dist/zip-module.wasm");
			try {
				fs.copyFileSync(wasmSrc, wasmDest);
			} catch (e) {
				this.warn && this.warn("copy-wasm: failed to copy wasm file: " + e.message);
			}
		}
	};
}

const GLOBALS = "const { Array, Object, String, Number, BigInt, Math, Date, Map, Set, Response, URL, Error, Uint8Array, Uint16Array, Uint32Array, DataView, Blob, Promise, TextEncoder, TextDecoder, document, crypto, btoa, TransformStream, ReadableStream, WritableStream, CompressionStream, DecompressionStream, navigator, Worker } = typeof globalThis !== 'undefined' ? globalThis : this || self;";
const GLOBALS_WORKER = "const { Array, Object, Number, Math, Error, Uint8Array, Uint16Array, Uint32Array, Int32Array, Map, DataView, Promise, TextEncoder, crypto, postMessage, TransformStream, ReadableStream, WritableStream, CompressionStream, DecompressionStream } = self;";

export default [{
	input: "lib/core/web-worker-wasm.js",
	output: [{
		intro: GLOBALS_WORKER,
		file: "lib/core/web-worker-inline-wasm.js",
		format: "umd",
		plugins: []
	}]
}, {
	input: "lib/core/web-worker-native.js",
	output: [{
		intro: GLOBALS_WORKER,
		file: "lib/core/web-worker-inline-native.js",
		format: "umd",
		plugins: []
	}]
}, {
	input: "lib/core/web-worker-inline-template.js",
	output: [{
		file: "lib/core/web-worker-inline-wasm.js",
		format: "es"
	}],
	plugins: [
		replace({
			preventAssignment: true,
			"__workerCode__": () => fs.readFileSync("lib/core/web-worker-inline-wasm.js").toString()
		}),

	]
}, {
	input: "lib/core/web-worker-inline-template-native.js",
	output: [{
		file: "lib/core/web-worker-inline-native.js",
		format: "es"
	}],
	plugins: [
		replace({
			preventAssignment: true,
			"__workerCode__": () => compress(fs.readFileSync("lib/core/web-worker-inline-native.js"))
		}),

	]
}, {
	input: "lib/core/zlib-streams-inline-template.js",
	output: [{
		file: "lib/core/zlib-streams-inline.js",
		format: "es"
	}],
	plugins: [
		copyWasmModule(),
		replace({
			preventAssignment: true,
			"__wasmBinary__": () => compress(fs.readFileSync("lib/core/streams/zlib-wasm/zlib-streams.wasm"))
		}),

	]
}, {
	input: ["lib/zip-wasm.js"],
	output: [{
		intro: GLOBALS,
		file: "dist/zip.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip.js",
		format: "umd",
		name: "zip"
	}]
}, {
	input: ["lib/zip-native.js"],
	output: [{
		intro: GLOBALS,
		file: "dist/zip-native.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-native.js",
		format: "umd",
		name: "zip"
	}]
}, {
	input: ["lib/zip-legacy.js"],
	output: [{
		intro: GLOBALS,
		file: "dist/zip-legacy.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-legacy.js",
		format: "umd",
		name: "zip"
	}]
}, {
	input: ["lib/zip-core.js"],
	output: [{
		intro: GLOBALS,
		file: "dist/zip-core.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-core.js",
		format: "umd",
		name: "zip"
	}]
}, {
	input: "lib/core/zip-fs.js",
	output: [{
		intro: GLOBALS,
		file: "dist/zip-fs-core.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-fs-core.js",
		format: "umd",
		name: "zip"
	}]
}, {
	input: "lib/zip-fs-wasm.js",
	output: [{
		intro: GLOBALS,
		file: "dist/zip-fs.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-fs.js",
		format: "umd",
		name: "zip"
	}, {
		file: "index.cjs",
		format: "cjs"
	}, {
		file: "index.min.js",
		format: "es",
		plugins: []
	}]
}, {
	input: "lib/zip-fs-native.js",
	output: [{
		intro: GLOBALS,
		file: "dist/zip-fs-native.min.js",
		format: "umd",
		name: "zip",
		plugins: []
	}, {
		intro: GLOBALS,
		file: "dist/zip-fs-native.js",
		format: "umd",
		name: "zip"
	}, {
		file: "index-native.cjs",
		format: "cjs"
	}, {
		file: "index-native.min.js",
		format: "es",
		plugins: []
	}]
}, {
	input: "lib/core/web-worker-wasm.js",
	output: [{
		intro: GLOBALS_WORKER,
		file: "dist/zip-web-worker.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: "lib/core/web-worker-native.js",
	output: [{
		intro: GLOBALS_WORKER,
		file: "dist/zip-web-worker-native.js",
		format: "iife",
		plugins: []
	}]
}];