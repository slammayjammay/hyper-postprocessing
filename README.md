# `hyper-postprocessing`

A [Hyper](https://github.com/zeit/hyper) plugin that makes it easy to attach fragment shaders to the terminal window. [Hyper v2](https://zeit.co/blog/hyper2) trashed the old [hterm](https://chromium.googlesource.com/apps/libapps/+/master/hterm) DOM-based rendering system and transitioned to the [xterm](https://github.com/xtermjs/xterm.js/) canvas-based system, which makes it much easier to add [`postprocessing`](https://github.com/vanruesc/postprocessing) effects to the terminal window.

Inspired by the effects used by [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

## Examples
| ![Glitch][1] |
|:---:|
| Glitchy effect, one of the effects provided by [`postprocessing`](https://github.com/vanruesc/postprocessing). [Source](examples/glitch/) |

| ![Underwater][2] |
|:---:|
| Underwatery effect, using a [shader](https://www.shadertoy.com/view/4slGRM) made by **bitek**. [Source](examples/underwater/) |

| ![Film][3] |
|:---:|
| Retro filmy effect, using a [shader](https://www.shadertoy.com/view/Md3SRM) made by **manoloide**. [Source](examples/film/) |

| ![Blend][4] |
|:---:|
| Example of [blending](http://mrdoob.github.io/webgl-blendfunctions/blendfunc.html) an image and text. [Source](examples/fallout-boy/) |

[1]: https://user-images.githubusercontent.com/11801881/40855038-1dce9a88-6588-11e8-9f3a-ec552faf0631.gif
[2]: https://user-images.githubusercontent.com/11801881/40855040-200a1b60-6588-11e8-8cd7-adffdb6482e3.gif
[3]: https://user-images.githubusercontent.com/11801881/40855043-2196500c-6588-11e8-8d00-79df78abeece.gif
[4]: https://user-images.githubusercontent.com/11801881/40855047-23c12546-6588-11e8-92a4-13d475afc5cd.gif

## Performance
Performance will decline as the number of shaders that are chained together increases. For the best results, keep the number of renders to a minimum. Tools like [glslify](https://github.com/glslify/glslify) can help achieve this.

## How to setup
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
2. Option 2: an object specifying `vertexShader`, `fragmentShader`, `shaderPass`, and/or `shaderMaterial`. If `shaderPass` is present, the value is assumed to be an instance of a `ShaderPass` that will be added directly to `EffectComposer`. If `shaderMaterial` is present, the value is assumed to be an instance of a `ShaderMaterial` and will be paired with a `ShaderPass` that will be passed to `EffectComposer`. Providing `vertexShader` is optional.
3. Option 3: an array of options 1 or 2.
4. Option 4: a function that returns either option 1 or 2 or 3.

For more complex shaders, you can build on a (slightly tweaked) `ShaderPass` or `ShaderMaterial` from `postprocessing`. Let's say you want to load another image as a texture and add it as a uniform to `ShaderMaterial`.
```js
/* path-to-entry-file.js */

const { TextureLoader } = require('three');

// export option 4
module.exports = ({ ShaderPass, ShaderMaterial, hyperTerm, xTerm }) => {
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
  return shaderMaterial;

  return { shaderMaterial }; // option 2

  // option 3, containing options 1 or 2
  return [
    'a fragment shader',
    { shaderPass: new ShaderPass(shaderMaterial) }
  ];
};
```

## Uniforms
Vertex and fragment shaders have access to several uniforms:
* `sampler2D tDiffuse` -- the xterm terminal image
* `float aspect` -- the aspect ratio of the screen
* `vec2 resolution` -- the image width and height in pixels
* `float timeElapsed` -- the amount of time that has passed since the initial render
* `float timeDelta` -- the amount of time that has passed since the last render of this terminal

Note: if you export a custom shader material that is not an instance of the provided `ShaderMaterial`, the material's fragment shader will not have access to these uniforms.

## Custom Uniforms
If you want to set additional uniforms, you can extend and return an instance of `ShaderPass`. For example if you wanted to set an opacity uniform (poor example but for demonstrative purposes):
```js
/* path-to-entry-file.js */

module.exports = ({ ShaderPass, ShaderMaterial, hyperTerm, xTerm }) => {
  const fragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float myOpacityUniform;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    color *= myOpacityUniform;
    gl_FragColor = color;
  }
  `;

  class CustomShaderPass extends ShaderPass {
    render(renderer, readBuffer, writeBuffer, timeDelta) {
      // set any custom uniforms here -- important to go before the `super` call
      this.material.uniforms.myOpacityUniform.value = 0.3;

      super.render(...arguments);
    }
  }

  const shaderMaterial = new ShaderMaterial({
    fragmentShader,
    uniforms: {
      myOpacityUniform: { value: null }
    }
  });

  const customShaderPass = new CustomShaderPass(shaderMaterial);

  return { shaderPass: customShaderPass };
};
```
