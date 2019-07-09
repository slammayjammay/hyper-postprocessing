import requirePeer from './require-peer';

/**
 * Tries to load from the config path, then parses the export and returns an
 * object containing an array of shader passes and a coordinateTransform function
 *
 * @param {String} configPath - Absolute file path to the config file.
 * @param {Object} cbObj - Contains additional data that will be passed along
 * to the exported function.
 */
export default (configPath, cbObj) => {
	let config;

	try {
		config = window.require(configPath);
	} catch (e) {
		console.warn(e);
		return null;
	}

	if (typeof config === 'function') {
		config = config(cbObj);
	}

	if (typeof config === 'object') {
		requirePeer.set('three', config.three);
		requirePeer.set('postprocessing', config.postprocessing);
	}

	const parsed = parseConfig(config);

	return {
		passes: parsed,
		coordinateTransform: config.coordinateTransform,
	};
}

function parseConfig(config) {
	if (Array.isArray(config)) {
		return loadFromArray(config);
	}

	if (typeof config === 'string') {
		return [loadFromEffectStrings(config)];
	}

	if (typeof config === 'object') {
		return loadFromObject(config);
	}

	return [];
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
			newConfig.push(loadFromEffectStrings(effectStrings));
			effectStrings = [];
		}

		newConfig.push(...parseConfig(array[i]));
	}

	if (effectStrings.length > 0) {
		newConfig.push(loadFromEffectStrings(effectStrings));
	}

	return newConfig;
}

function loadFromEffectStrings(fragments) {
	if (typeof fragments === 'string') {
		fragments = [fragments];
	}

	const { EffectPass, Effect } = requirePeer.get('postprocessing');

	const effects = [];

	for (const fragment of fragments) {
		effects.push(new Effect('DefaultEffect', fragment));
	}

	return new EffectPass(null, ...effects);
}

function loadFromObject(object) {
	if (object.pass) {
		return [object.pass];
	}

	if (object.passes) {
		return object.passes;
	}

	if (object.fragmentShader) {
		return [loadFromEffectStrings(object.fragmentShader)];
	}

	return [];
}

