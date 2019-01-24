
const { Effect, BloomEffect, BokehEffect, EffectComposer, EffectPass, BrightnessContrastEffect} = require('postprocessing');
const { RealisticBokehEffect, VignetteEffect, ToneMappingEffect, SSAOEffect, SMAAEffect} = require('postprocessing');
const { SepiaEffect, ShockWaveEffect, ScanlineEffect, PixelationEffect, NoiseEffect} = require('postprocessing');
const { OutlineEffect, HueSaturationEffect, GridEffect, GodRaysEffect, GlitchEffect} = require('postprocessing');
const { GammaCorrectionEffect, DotScreenEffect, DepthEffect, ChromaticAberrationEffect, ColorAverageEffect} = require('postprocessing');
module.exports = ({ hyperTerm, xTerm }) => {
	return { pass: [
        // new EffectPass(null, new BokehEffect()),
        // new EffectPass(null, new RealisticBokehEffect()),
        // new EffectPass(null, new VignetteEffect()),
        // new EffectPass(null, new ToneMappingEffect()),
        // new EffectPass(null, new TextureEffect()),
        // new EffectPass(null, new SSAOEffect()),
        // new EffectPass(null, new SMAAEffect()),
        // new EffectPass(null, new SepiaEffect()),
        // new EffectPass(null, new ShockWaveEffect()),
        // new EffectPass(null, new ScanlineEffect()),
        // new EffectPass(null, new PixelationEffect()),
        // new EffectPass(null, new NoiseEffect()),
        // new EffectPass(null, new OutlineEffect()),
        // new EffectPass(null, new HueSaturationEffect()),
        // new EffectPass(null, new GridEffect()),
        // new EffectPass(cameraFar, new GodRaysEffect()),
        // new EffectPass(null, new GlitchEffect()),
        // new EffectPass(null, new GammaCorrectionEffect()),
        // new EffectPass(null, new DotScreenEffect()),
        // new EffectPass(null, new DepthEffect()),
        // new EffectPass(null, new ChromaticAberrationEffect()),
        // new EffectPass(null, new ColorAverageEffect()),
        // new EffectPass(null, new BrightnessContrastEffect()),
        new EffectPass(null, new BloomEffect({resolutionScale:.2, distinction:.2})),
        // new EffectPass(null, new BloomEffect()),
    ] };
};
