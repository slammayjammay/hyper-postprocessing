const { readFileSync } = require('fs');
const { resolve } = require('path');
const three = require('three');
const postprocessing = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	const effects = [];

	effects.push(new postprocessing.GlitchEffect({
		delay: new three.Vector2(1, 7),
		duration: new three.Vector2(0, 1),
		columns: 0.05
	}));

	effects.push(new postprocessing.BloomEffect({
		kernelSize: 3,
		distinction: 1,
		blendFunction: postprocessing.BlendFunction.ADD
	}));

	effects.push(new postprocessing.ScanlineEffect({ density: 1.3 }));
	effects.push(new postprocessing.SepiaEffect({ intensity: 0.5 }));
	effects.push(new postprocessing.VignetteEffect({
		darkness: 0.6,
		offset: 0
	}));

	effects.push(new postprocessing.Effect(
		'curvedMonitorEffect',
		readFileSync(resolve(__dirname, '../../glsl/curved-monitor.glsl')).toString()
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
