import { EffectPass, Effect } from 'postprocessing';

let hyperTerm, xTerm;

/**
 * Tries to load from the config path, then parses the export and returns an
 * array of shader passes.
 *
 * @param {String} configPath - Absolute file path to the config file.
 * @param {Object} object - Contains additional data that will be passed along
 * to the exported function.
 */
export default (configPath, object) => {
	let config;

	try {
		config = window.require(configPath);
	} catch (e) {
		console.warn(e);
	}

	if (!config) {
		return null;
	}

	hyperTerm = object.hyperTerm;
	xTerm = object.xTerm;

	const parsed = parseConfig(config);
	return (Array.isArray(parsed)) ? parsed : [parsed];
}

function parseConfig(config) {
	if (Array.isArray(config)) {
		return loadFromArray(config);
	}

	if (typeof config === 'string') {
		return loadFromEffectStrings([config]);
	}

	if (typeof config === 'object') {
		return loadFromObject(config);
	}

	if (typeof config === 'function') {
		return loadFromFunction(config);
	}
}

/**
 * Iterates over the array, combines any adjacent strings into one EffectPass,
 * then re-parses the config object.
 */
function loadFromArray(array) {
	const newConfig = [];
	let effectStrings = [];

	for (let i = 0; i < array.length; i++) {
		if (typeof array[i] === 'string') {
			effectStrings.push(array[i]);
			continue;
		}

		if (effectStrings.length > 0) {
			newConfig.push({ shaderPass: loadFromEffectStrings(effectStrings) });
			effectStrings = [];
		}

		newConfig.push(array[i]);
	}

	if (effectStrings.length > 0) {
		newConfig.push({ shaderPass: loadFromEffectStrings(effectStrings) });
	}

	return newConfig.map(item => parseConfig(item));
}

function loadFromEffectStrings(strings, vertexShader) {
	const effects = [];

	for (const fragment of strings) {
		effects.push(new Effect('DefaultEffect', fragment));
	}

	return new EffectPass(null, ...effects);
}

function loadFromObject(object) {
	if (object.shaderPass) {
		return object.shaderPass;
	}

	if (object.fragmentShader) {
		return loadFromEffectString(object.fragmentShader, object.vertexShader);
	}

	return null;
}

function loadFromFunction(callback) {
	const config = callback({ hyperTerm, xTerm });
	return parseConfig(config);
}
