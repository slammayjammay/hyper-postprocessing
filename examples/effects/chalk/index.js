const { readFileSync } = require('fs');
const { resolve } = require('path');
const three = require('three');
const postprocessing = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const effect = new postprocessing.Effect(
		'chalkEffect',
		readFileSync(resolve(__dirname, '../../glsl/chalk.glsl')).toString(),
		{
			uniforms: new Map([['noiseTexture', new three.Uniform(null)]])
		}
	);

	new three.TextureLoader().load(resolve(__dirname, '../../images/noise.png'), texture => {
		texture.minFilter = three.LinearFilter;
		effect.uniforms.get('noiseTexture').value = texture;
	});

	return {
		passes: [new postprocessing.EffectPass(null, effect)],
		three,
		postprocessing
	};
};
