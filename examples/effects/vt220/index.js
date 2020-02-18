const { readFileSync } = require('fs');
const { resolve } = require('path');
const { EffectPass, Effect, BlendFunction } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	return {
		passes: [
			new EffectPass(null, new Effect(
				'vt220',
				readFileSync(resolve(__dirname, '../../glsl/vt220.glsl')).toString(),
				{ blendFunction: BlendFunction.NORMAL },
			))
		],
		coordinateTransform: function(x, y) {
			let r = 4;
			x = (x - 0.5) * 2;
			y = (y - 0.5) * 2;

			x = r * x / Math.sqrt(r * r - x * x - y * y) * (0.465 / 0.4);
			y = r * y / Math.sqrt(r * r - x * x - y * y) * (0.473 / 0.4);

			x = x / 2 + 0.5;
			y = y / 2 + 0.5;;

			return [x, y];
		},
	};
};

