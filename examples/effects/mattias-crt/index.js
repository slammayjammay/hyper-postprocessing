const { readFileSync } = require('fs');
const { resolve } = require('path');
const { EffectPass, Effect, BlendFunction } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {

	return { 
		pass: new EffectPass(null, new Effect(
			'mattias-crt',
			readFileSync(resolve(__dirname, '../../glsl/mattias-crt.glsl')).toString(),
			{ blendFunction: BlendFunction.NORMAL },
		)),
		coordinateTransform: function(x, y) {
			x = (x - 0.5) * 2;
			y = (y - 0.5) * 2;

			x *= 1.1 + Math.pow(x / 6, 2);
			y *= 1.1 + Math.pow(y / 6, 2);

			x = x / 2 + 0.5;
			y = y / 2 + 0.5;

			x = x * 0.91 + 0.045;
			y = y * 0.91 + 0.045;

			return [x, y];
		},
	};
};
