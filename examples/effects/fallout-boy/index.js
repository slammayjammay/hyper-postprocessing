const { readFileSync } = require('fs');
const { resolve } = require('path');
const three = require('three');
const postprocessing = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	// turn all colors that aren't black into white -- then we can multiply the
	// image against this to "shine" through only the text (setting the background
	// to black in the hyper config is required)
	const textEffect = new postprocessing.Effect(
		'textEffect',
		readFileSync(resolve(__dirname, '../../glsl/black-and-white.glsl')).toString()
	);

	// move background image left
	const backgroundEffect = new postprocessing.Effect(
		'backgroundEffect',
		readFileSync(resolve(__dirname, '../../glsl/background-image.glsl')).toString(),
		{
			uniforms: new Map([['backgroundImage', new three.Uniform(null)]]),
			defines: new Map([['motionX', '-0.1']]),
			blendFunction: postprocessing.BlendFunction.MULTIPLY
		}
	);

	new three.TextureLoader().load(resolve(__dirname, '../../images/fallout-boy.jpg'), texture => {
		texture.minFilter = three.LinearFilter;
		backgroundEffect.uniforms.get('backgroundImage').value = texture;
	});

	return {
		passes: [new postprocessing.EffectPass(null, textEffect, backgroundEffect)],
		three,
		postprocessing
	};
};
