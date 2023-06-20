const { readFileSync } = require('fs');
const { resolve } = require('path');
const three = require('three');
const postprocessing = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const effects = [];

	const backgroundEffect = new postprocessing.Effect(
		'backgroundImage',
		readFileSync(resolve(__dirname, '../../glsl/background-image.glsl')).toString(),
		{
			uniforms: new Map([['backgroundImage', new three.Uniform(null)]]),
			blendFunction: postprocessing.BlendFunction.SCREEN
		}
	);
	new three.TextureLoader().load(resolve(__dirname, '../../images/underwater.jpg'), texture => {
		texture.minFilter = three.LinearFilter;
		backgroundEffect.uniforms.get('backgroundImage').value = texture;
	});
	effects.push(backgroundEffect);

	effects.push(new postprocessing.Effect(
		'underwaterEffect',
		readFileSync(resolve(__dirname, '../../glsl/ripple.glsl')).toString()
	));

	effects.push(new postprocessing.Effect(
		'scaleEffect',
		readFileSync(resolve(__dirname, '../../glsl/scale.glsl')).toString(),
		{ defines: new Map([['scale', '0.9']]) }
	));

	effects.push(new postprocessing.Effect(
		'sampling',
		readFileSync(resolve(__dirname, '../../glsl/sampling.glsl')).toString(),
		{ blendFunction: postprocessing.BlendFunction.NORMAL }
	));

	return {
		passes: [new postprocessing.EffectPass(null, ...effects)],
		three,
		postprocessing
	};
};
