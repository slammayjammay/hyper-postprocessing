# `hyper-postprocessing`

A [Hyper](https://github.com/zeit/hyper) plugin that makes it easy to attach fragment shaders to the terminal window. [Hyper v2](https://zeit.co/blog/hyper2) trashed the old [hterm](https://chromium.googlesource.com/apps/libapps/+/master/hterm) DOM-based rendering system and transitioned to the [xterm](https://github.com/xtermjs/xterm.js/) canvas-based system, which makes it much easier to add [`postprocessing`](https://github.com/vanruesc/postprocessing) effects to the terminal window.

Inspired by the effects used by [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

<img width="500" src="./demos/glitch.gif"/>

<img width="500" src="./demos/underwater.gif"/>


# Performance
- Performance will decline as the number of shaders that are chained together increases. For the best results, keep the number of renders to a minimum.

# How to setup
In your `.hyper.js` config file, add `hyper-postprocessing` to the list of plugins. Then to specify options for this plugin, add a key `hyperPostprocessing` inside the `config` entry:
```js
module.exports = {
	config: {
		// ...,
		hyperPostprocessing: {
			// defaults to `${HOME}/.hyper-postprocessing.js`
			entry: 'path-to-entry-file.js'
		}
	},
	plugins: [
		// ...,
		'hyper-postprocessing'
	]
}
```
The entry file should export the shader(s) you want to add to your terminal window. It can be:
1. Option 1: a string, assumed to be a fragment shader.
2. Option 2: an object specifying `vertexShader`, `fragmentShader`, `shaderPass`, and/or `shaderMaterial`. If `shaderPass` is present, the value is assumed to be an instance of a `ShaderPass` that will be added to directly to `EffectComposer`. If `shaderMaterial` is present, the value is assumed to be an instance of a `ShaderMaterial` and will be paired with a `ShaderPass` that will be passed to `EffectComposer`. Providing `vertexShader` is optional.
3. Option 3: an array of options 1 or 2.
4. Option 4: a function that returns either option 1 or 2 or 3.

For more complex shaders, you can build on a (slightly tweaked) `ShaderPass` or `ShaderMaterial` from `postprocessing`. Let's say you want to load another image as a texture and add it as a uniform to `ShaderMaterial`.
```js
/* path-to-entry-file.js */

const { TextureLoader } = require('three');

// export option 4
module.exports = ({ ShaderPass, ShaderMaterial }) => {
  const shaderMaterialOptions = {
    uniforms: {
      // if constructing from the provided ShaderMaterial, the fragment shader
      // will have access to the default uniforms as well
      imageTexture: { value: null }
    },
    fragmentShader: '...a valid fragment shader string...'
  };
  const shaderMaterial = new ShaderMaterial(shaderMaterialOptions);

  new TextureLoader().load('path/to/image/', texture => {
    shaderMaterial.uniforms.imageTexture.value = texture;
  });

  // error! this function must return option 1, 2, or 3
  return shaderPass;

  return { shaderMaterial }; // option 2

  // option 3, containing options 1 or 2
  return [
    'a fragment shader',
    { shaderPass: new ShaderPass(shaderMaterial) }
  ];
};
```

# Uniforms
Vertex and fragment shaders have access to several uniforms:
* `sampler2D tDiffuse` -- the xterm terminal to sample
* `float aspect` -- the aspect ratio of the screen
* `vec2 resolution` -- the image width and height in pixels
* `float timeElapsed` -- the amount of time that has passed since the initial render
* `float timeDelta` -- the amount of time that has passed since the last render of this terminal

Note: if you export a custom shader material that is not an instance of the provided `ShaderMaterial`, the material's fragment shader will not have access to these uniforms.
