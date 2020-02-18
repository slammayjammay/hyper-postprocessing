const { readFileSync } = require('fs');
const { resolve } = require('path');
const { EffectPass, Effect, BlendFunction } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const filmEffect = new Effect(
		'filmEffect',
		readFileSync(resolve(__dirname, '../../glsl/film.glsl')).toString(),
		{ blendFunction: BlendFunction.NORMAL }
	);

	return { passes: [new EffectPass(null, filmEffect)] };
};
