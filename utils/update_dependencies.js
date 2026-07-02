#!/usr/bin/env node
/* This will copy some assets from node_modules into www/dependencies.
It will also update hardcoded dependency paths to point to the proper resources across the project.
This script is only relevant for the self hosting use case.
*/
import { mkdir, copyFile, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const relativeNodeModulesRoot = 'node_modules';
const nodeModulesRoot = path.join(repoRoot, relativeNodeModulesRoot);
const relativeDestinationRoot = 'www/dependencies';
const destinationRoot = path.join(repoRoot, relativeDestinationRoot);
const FILES_TO_UPDATE_ALL = [
	'www/examples/basic/maplibreGlThree-cdn-example/index.html',
	'www/examples/basic/maplibreGlThree-selfhost-example/index.html',
	'www/examples/other/washington/index.html',
];
// threeJS lazy loads some stuff and those URLs are hardcoded in a few places.
const FILES_TO_UPDATE_THREEJS = [
	'src/library/maplibre-gl-three.js',
	'www/examples/basic/maplibreGlThree-selfhost-example/script.js',
	'www/examples/other/washington/script.js',
	'README.md'
];


const LIBRARIES = {
	'maplibre-gl': ['dist/maplibre-gl.js', 'dist/maplibre-gl.css'],
	proj4: ['dist/proj4.js', 'dist/proj4-src.js'],
	three: [
		'build/three.module.js',
		'build/three.core.js',
		'examples/jsm/utils/WorkerPool.js',
		'examples/jsm/utils/SkeletonUtils.js',
		'examples/jsm/utils/BufferGeometryUtils.js',
		'examples/jsm/loaders/KTX2Loader.js',
		'examples/jsm/loaders/DRACOLoader.js',
		'examples/jsm/loaders/GLTFLoader.js',
		'examples/jsm/math/ColorSpaces.js',
		'examples/jsm/libs/zstddec.module.js',
		'examples/jsm/libs/ktx-parse.module.js',
		'examples/jsm/libs/draco/draco_wasm_wrapper.js',
		'examples/jsm/libs/draco/draco_decoder.wasm',
	],
	'3d-tiles-renderer': [
		'build/index.three.js',
		'build/index.core.js',
		{ relativeDir: 'build', fileRegex: /^MemoryUtils-.*\.js$/ },
		{ relativeDir: 'build', fileRegex: /^LoaderBase-.*\.js$/ },
		{ relativeDir: 'build', fileRegex: /^constants-.*\.js$/ },
		{ relativeDir: 'build', fileRegex: /^CameraTransitionManager-.*\.js$/ },
		{ relativeDir: 'build', fileRegex: /^B3DMLoaderBase-.*\.js$/ },
	],
};

async function getPackageVersion(packageName) {
	const packageJsonPath = path.join(nodeModulesRoot, packageName, 'package.json');
	const contents = await readFile(packageJsonPath, 'utf8');
	const packageJson = JSON.parse(contents);

	if (!packageJson.version) {
		throw new Error(`Missing version in ${packageJsonPath}`);
	}

	return packageJson.version;
}

async function fileExists(filePath) {
	try {
		await stat(filePath);
		return true;
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return false;
		}

		throw error;
	}
}

function isRegexEntry(fileEntry) {
	return typeof fileEntry === 'object' && fileEntry !== null;
}

async function resolveLibraryFiles(sourceRoot, files) {
	const fileList = [];

	for (const fileEntry of files) {
		if (typeof fileEntry === 'string') {
			fileList.push(fileEntry);
			continue;
		}

		if (!isRegexEntry(fileEntry)) {
			throw new Error('Invalid library file entry');
		}

		const directoryPath = path.join(sourceRoot, fileEntry.relativeDir);
		const directoryEntries = await readdir(directoryPath, { withFileTypes: true });

		for (const entry of directoryEntries) {
			if (entry.isFile() && fileEntry.fileRegex.test(entry.name)) {
				fileList.push(path.join(fileEntry.relativeDir, entry.name));
			}
		}
	}

	return fileList;
}

async function copyLibraryFiles(packageName, version, files) {
	const sourceRoot = path.join(nodeModulesRoot, packageName);
	const destinationDir = path.join(destinationRoot, `${packageName}@${version}`);
	const fileList = await resolveLibraryFiles(sourceRoot, files);

	for (const relativeFile of fileList) {
		const sourcePath = path.join(sourceRoot, relativeFile);

		if (!(await fileExists(sourcePath))) {
			throw new Error(`ERROR: missing file ${sourcePath}`);
		}

		const destinationPath = path.join(destinationDir, relativeFile);
		await mkdir(path.dirname(destinationPath), { recursive: true });
		await copyFile(sourcePath, destinationPath);
		console.log(`Copied ${path.join(relativeNodeModulesRoot, relativeFile)} -> ${path.join(relativeDestinationRoot, relativeFile)}`);
	}
}

async function resetDestinationRoot() {
	await rm(destinationRoot, { recursive: true, force: true });
	await mkdir(destinationRoot, { recursive: true });
}

function replaceVersionPin(contents, packageName, version) {
	return contents.replace(
		new RegExp(`${packageName}@[0-9A-Za-z.-]+`, 'g'),
		`${packageName}@${version}`,
	);
}

async function updateFile(relativePath, callback) {
	const fullPath = path.join(repoRoot, relativePath);
	const originalStr = await readFile(fullPath, 'utf8');
	const updatedStr = callback(originalStr);
	if (updatedStr !== originalStr) {
		await writeFile(fullPath, updatedStr, 'utf8');
		console.log(`Updated versions in ${relativePath}`);
	}
	else {
		console.log(`No need to update ${relativePath}`);
	}
}

async function updateExampleHtmlVersions(versions) {
	for (const relativePath of FILES_TO_UPDATE_ALL) {
		updateFile(relativePath, (text) => {
			text = replaceVersionPin(text, 'maplibre-gl', versions['maplibre-gl']);
			text = replaceVersionPin(text, 'three', versions['three']);
			text = replaceVersionPin(text, '3d-tiles-renderer', versions['3d-tiles-renderer']);
			text = replaceVersionPin(text, 'proj4', versions['proj4']);
			text = replaceVersionPin(text, versions['maplibre-gl']);
			return text;
		});
	}
}

async function updateSourceFiles(versions) {
	for (const relativePath of FILES_TO_UPDATE_THREEJS) {
		updateFile(relativePath, (text) => {
			text = replaceVersionPin(text, 'three', versions['three']);
			return text;
		});
	}
}

async function main() {
	const versions = {};

	await resetDestinationRoot();

	for (const [packageName, files] of Object.entries(LIBRARIES)) {
		versions[packageName] = await getPackageVersion(packageName);
		await copyLibraryFiles(packageName, versions[packageName], files);
	}
	console.log('');
	console.log('All dependency files have been copied.');
	console.log('');
	await updateExampleHtmlVersions(versions);
	await updateSourceFiles(versions);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
