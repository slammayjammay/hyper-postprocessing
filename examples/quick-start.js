const { readFileSync } = require('fs');
const { resolve } = require('path');
const pp = require('postprocessing');

module.exports = ({ hyperTerm, xTerm }) => {
	return { passes: [
		// new pp.EffectPass(null, new pp.BokehEffect()),
		// new pp.EffectPass(null, new pp.RealisticBokehEffect()),
		// new pp.EffectPass(null, new pp.VignetteEffect()),
		// new pp.EffectPass(null, new pp.ToneMappingEffect()),
		// new pp.EffectPass(null, new pp.TextureEffect()),
		// new pp.EffectPass(null, new pp.SSAOEffect()),
		// new pp.EffectPass(null, new pp.SMAAEffect()),
		// new pp.EffectPass(null, new pp.SepiaEffect()),
		// new pp.EffectPass(null, new pp.ShockWaveEffect()),
		// new pp.EffectPass(null, new pp.ScanlineEffect()),
		// new pp.EffectPass(null, new pp.PixelationEffect()),
		// new pp.EffectPass(null, new pp.NoiseEffect()),
		// new pp.EffectPass(null, new pp.OutlineEffect()),
		// new pp.EffectPass(null, new pp.HueSaturationEffect()),
		// new pp.EffectPass(null, new pp.GridEffect()),
		// new pp.EffectPass(cameraFar, new pp.GodRaysEffect()),
		// new pp.EffectPass(null, new pp.GlitchEffect()),
		// new pp.EffectPass(null, new pp.GammaCorrectionEffect()),
		// new pp.EffectPass(null, new pp.DotScreenEffect()),
		// new pp.EffectPass(null, new pp.DepthEffect()),
		// new pp.EffectPass(null, new pp.ChromaticAberrationEffect()),
		// new pp.EffectPass(null, new pp.ColorAverageEffect()),
		// new pp.EffectPass(null, new pp.BrightnessContrastEffect()),
		new pp.EffectPass(null, new pp.BloomEffect({ resolutionScale: 0.2, distinction: 0.2 })),
		// new pp.EffectPass(null, new pp.Effect(
		// 	'crt2',
		// 	readFileSync(resolve(__dirname, 'glsl/crt2.glsl')).toString(),
		// 	{ blendFunction: pp.BlendFunction.NORMAL }
		// )),
		// new pp.EffectPass(null, new pp.Effect(
		// 	'crt-scanline',
		// 	readFileSync(resolve(__dirname, 'glsl/crt-scanline.glsl')).toString(),
		// 	{ blendFunction: pp.BlendFunction.NORMAL }
		// )),
		// new pp.EffectPass(null, new pp.BloomEffect()),
	] };
};
