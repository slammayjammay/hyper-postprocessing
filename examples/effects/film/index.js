const { readFileSync } = require('fs');
const { resolve } = require('path');
const three = require('three');
const postprocessing = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const filmEffect = new postprocessing.Effect(
		'filmEffect',
		readFileSync(resolve(__dirname, '../../glsl/film.glsl')).toString(),
		{ blendFunction: postprocessing.BlendFunction.NORMAL }
	);

	return {
		passes: [new postprocessing.EffectPass(null, filmEffect)],
		three,
		postprocessing
	};
};
