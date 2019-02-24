const { homedir } = require('os');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { EffectPass, Effect } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const filmEffect = new Effect(
		'filmEffect',
		readFileSync(resolve(__dirname, '../../glsl/film.glsl')).toString(),
		{
			blendFunction: 12 // normal -- overwrite
		}
	);

	return { pass: new EffectPass(null, filmEffect) };
};
