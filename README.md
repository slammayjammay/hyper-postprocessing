# `hyper-postprocessing`
> Add postprocessing filters to the Hyper terminal window

# About
A [Hyper](https://github.com/zeit/hyper) plugin that makes it easy to attach fragment shaders to the terminal window. [Hyper v2](https://zeit.co/blog/hyper2) trashed the old [hterm](https://chromium.googlesource.com/apps/libapps/+/master/hterm) DOM-based rendering system and transitioned to the [xterm](https://github.com/xtermjs/xterm.js/) canvas-based system. This makes it much easier to add filter effects to the terminal window.

I thought it would be neat to add some effects to Hyper similar to those in [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

# Performance
- _needs improvement_

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
1. A string representing a fragment shader
2. An object with keys `fragmentShader` and `vertexShader` (vertex shader is optional)
3. An array of strings or objects

In the case the object has the key `shaderPass`, it will assume the value points to a valid instance of a THREE.js ShaderPass and the `fragmentShader` and `vertexShader` keys will be ignored.

# Uniforms
Vertex and fragment shaders have access to several uniforms:
1. `tDiffuse` -- the image to sample
2. `aspect` -- the aspect ratio of the screen
3. `timeElapsed` -- the amount of time that has passed since the initial render
4. `timeDelta` -- the amount of time that has passed since the last render of this terminal

Note: if you export a custom shader you will have to implement these uniforms yourself.
