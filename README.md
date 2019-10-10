# `hyper-postprocessing`

A [Hyper](https://github.com/zeit/hyper) plugin that makes it easy to attach fragment shaders to the terminal window.

Inspired by [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

## Examples
| ![Cool Retro Term][1] |
|:---:|
| Some of the effects used in Cool Retro Term ported over by **norill**. [Example](examples/effects/retro)

| ![Space travel][2] |
|:---:|
| A killer [space shader](https://www.shadertoy.com/view/XlfGRj) made by **Kali**. [Example](examples/effects/space-travel)

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

[1]: https://user-images.githubusercontent.com/11801881/61190318-49112b80-a64f-11e9-806d-0dc89f73d70c.gif
[2]: https://user-images.githubusercontent.com/11801881/53447611-56908680-39ca-11e9-98e6-3594f0f29b74.gif
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

Additional options will be read from the exported object:
- `fps`: the frame rate per second (defaults to 60fps)
- `coordinateTransform`: a function that transforms mouse event coordinates ([see note about mouse events below](#mouse-events))
- `three`+`postprocessing`: the dependencies to use ([see note about peer dependencies below](#a-note-about-dependencies))

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


#### Mouse events
If your effects reposition any content inside the terminal, then mouse events will not be in sync with terminal visuals. You can optionally provide a `coordinateTransform` function in the exported object to change the coordinates of mouse events.

```js
/* path-to-entry-file.js */
module.exports = {
  fragmentShader: `
  void mainUv(inout vec2 uv) {
    uv.x = 1.0 - uv.x;
  }
  `,
  coordinateTransform: function(x, y) {
    return [1 - x, y];
  }
};
```

`coordinateTransform` will take in the x and y values of the mouse event, and return a tuple containing the modified values for each. The original mouse event will be prevented and stopped, and a new event will be fired at the new location.

The `x` and `y` values are similar to `uv.x` and `uv.y` used in shaders, in that they both range from 0 to 1 and represent the location of the mouse event by percentage of the terminal screen. So a click at [x=0, y=0] would represent the bottom left corner of the screen and a click at [x=1, y=1] would represent the top right corner. Theoretically you can duplicate any `uv` transformations made in shaders and use them in this callback to fix any mouse-visual problems.

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
This plugin comes bundled with `three` and `postprocessing` as dependencies in order to work upon installation, however those should be viewed more as peer dependencies -- if your entry file makes use of either of them you should install them yourself.

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
