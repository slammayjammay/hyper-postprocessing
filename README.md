# `hyper-postprocessing`

A [Hyper](https://github.com/zeit/hyper) plugin that makes it easy to attach fragment shaders to the terminal window.

Inspired by [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

## Examples
| ![Space travel][1] |
|:---:|
| A killer [space shader](https://www.shadertoy.com/view/XlfGRj) made by **Kali**. [Example](examples/effects/space-travel)

| ![Glitch][2] |
|:---:|
| Glitch effect, as well as several more provided by [`postprocessing`](https://github.com/vanruesc/postprocessing). [Example](examples/effects/glitch)

| ![Ripple][3] |
|:---:|
| Ripply effect, using a [shader](https://www.shadertoy.com/view/4slGRM) made by **bitek**. [Example](examples/effects/ripple)

| ![Film][4] |
|:---:|
| Retro filmy effect, using a [shader](https://www.shadertoy.com/view/Md3SRM) made by **manoloide**. [Example](examples/effects/film)

| ![Blend][5] |
|:---:|
| An image blended through only where text is printed. [Example](examples/effects/fallout-boy)

| ![Chalk][6] |
|:---:|
| A sketchy/chalky shader made by [Ruofei Du](http://duruofei.com/). [Example](examples/effects/chalk)

[1]: https://user-images.githubusercontent.com/11801881/53447611-56908680-39ca-11e9-98e6-3594f0f29b74.gif
[2]: https://user-images.githubusercontent.com/11801881/46902282-74c07480-ce77-11e8-85aa-422e5b7bc39e.gif
[3]: https://user-images.githubusercontent.com/11801881/46912798-700dc600-cf34-11e8-89ce-89c195f06312.gif
[4]: https://user-images.githubusercontent.com/11801881/40855043-2196500c-6588-11e8-8d00-79df78abeece.gif
[5]: https://user-images.githubusercontent.com/11801881/40855047-23c12546-6588-11e8-92a4-13d475afc5cd.gif
[6]: https://user-images.githubusercontent.com/11801881/46054056-5bd76580-c0fa-11e8-95c2-e8dc6a2040e5.gif

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

### Entry file

The entry file will be required at Hyper startup. The exported object will be parsed and passed to [`postprocessing`](https://github.com/vanruesc/postprocessing), which handles all effect rendering. Reading the [postprocessing wiki](https://github.com/vanruesc/postprocessing/wiki) is highly recommended to understand how the Effect Composer works. Any one of these options is acceptable:

1. A string, assumed to be a fragment shader. An [Effect](https://github.com/vanruesc/postprocessing/wiki/Custom-Effects) will be created with the given string, and will then be incorporated into an [EffectPass](https://vanruesc.github.io/postprocessing/public/docs/class/src/passes/EffectPass.js~EffectPass.html).

2. An object specifying `vertexShader`, `fragmentShader`, `pass`, or `passes`. If `fragmentShader` is present, the same steps in option 1 will be taken, giving `vertexShader` if present. If `pass` or `passes` is present, those passes will be added to the EffectComposer (must be valid instances of a [postprocessing Pass](https://vanruesc.github.io/postprocessing/public/docs/class/src/passes/Pass.js~Pass.html)).

3. An array of options 1 or 2. If the array contains multiple adjacent strings, they will all be combined into one EffectPass. If the array given contains both strings and objects, only strings adjacent to one another will be combined.

4. A function that returns either option 1 or 2 or 3. An object containing the `hyperTerm` and `xTerm` instances will be passed to it.

Note: if exporting a custom pass, make sure to export an object with the "pass" key pointing to the pass:
```js
/* path-to-entry-file.js */
const customPass = new CustomPass();

// module.exports = customPass; // no!
module.exports = { pass: customPass };
```

or if exporting a function:
```js
/* path-to-entry-file.js */
module.exports = ({ hyperTerm, xTerm }) => {
  const customPass = new CustomPass();

  // return customPass; // no!
  return { pass: customPass };
};
```

Do not export the initial `RenderPass` that `EffectComposer` requires. This is done automatically.

**Note:** The entry file should be kept within the `.hyper_plugins` project in order for `postprocessing` or `three` to be used.

### Quick start
`postprocessing` already provides a number of effects out of the box ([demo](https://vanruesc.github.io/postprocessing/public/demo/#bloom)). You can use [examples/quick-start.js](examples/quick-start.js) as a starting point to build your own effect, or see one of the [example effects](examples/effects) for a more custom approach.

## Uniforms
* `sampler2D inputBuffer` -- the xterm terminal image
* `float aspect` -- the aspect ratio of the screen
* `vec2 resolution` -- the image width and height in pixels
* `float time` -- the amount of time that has passed since the initial render

EffectPasses also gain additional uniforms, courtesy of `postprocessing`. These will not be available to passes that are not EffectPasses.
* `uniform vec2 texelSize`
* `uniform float cameraNear`
* `uniform float cameraFar`

## A note about dependencies
This plugin comes bundled with `three` and `postprocessing` as dependencies in order to work upon installation, however those should be viewed more as peer dependencies -- if your entry file makes use of either of them you should install them yourself in the `.hyper_plugins` node project located in your home folder.

By default this plugin uses `postprocessing` v6.2.1 and its compatible version of `three` (v0.103.0), but can use other versions of those if needed. To do this you will need your entry file to export an object (or a function that returns an object) with a key of the dependency name and the value as the `require`'d dependency.

For example if you want to use `postprocessing` version X.X.X (and its hypothetically compatible version of `three` Y.Y.Y):

```js
/* path-to-entry-file.js */
const pp = require('postprocessing'); // version X.X.X
const three = require('three'); // version Y.Y.Y

module.exports = {
  pass: pp.EffectPass(null, new pp.VignetteEffect()),
  postprocessing: pp,
  three: three
};
```
