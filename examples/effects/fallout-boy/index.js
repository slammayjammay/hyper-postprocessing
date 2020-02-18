const { readFileSync } = require('fs');
const { resolve } = require('path');
const { TextureLoader, LinearFilter, Uniform } = require('three');
const { EffectPass, Effect, BlendFunction } = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	// turn all colors that aren't black into white -- then we can multiply the
	// image against this to "shine" through only the text (setting the background
	// to black in the hyper config is required)
	const textEffect = new Effect(
		'textEffect',
		readFileSync(resolve(__dirname, '../../glsl/black-and-white.glsl')).toString()
	);

	// move background image left
	const backgroundEffect = new Effect(
		'backgroundEffect',
		readFileSync(resolve(__dirname, '../../glsl/background-image.glsl')).toString(),
		{
			uniforms: new Map([['backgroundImage', new Uniform(null)]]),
			defines: new Map([['motionX', '-0.1']]),
			blendFunction: BlendFunction.MULTIPLY
		}
	);

	new TextureLoader().load(resolve(__dirname, '../../images/fallout-boy.jpg'), texture => {
		texture.minFilter = LinearFilter;
		backgroundEffect.uniforms.get('backgroundImage').value = texture;
	});

	return { passes: [new EffectPass(null, textEffect, backgroundEffect)] };
};
