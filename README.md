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

## Note:
For the latest Hyper version (3.1.0 and above), use hyper-postprocessing v4.

For previous Hyper versions <= 3.0.2, use hyper-postprocessing 3.0.2.

## How to setup
In your `.hyper.js` config file, add `hyper-postprocessing` to the list of plugins. Then to specify options for this plugin, add a key `hyperPostprocessing` inside the `config` entry:
```js
module.exports = {
	config: {
		hyperPostprocessing: {
			// defaults to `${HOME}/.hyper-postprocessing.js`
			entry: 'path-to-entry-file.js'
		}
	},
	plugins: [
		'hyper-postprocessing'
	]
}
```

### Entry file

The entry file will be imported at Hyper startup, and must export a function that returns an object. Every time a new tab or pane is opened, the function will be called and the object will be parsed and passed to [postprocessing](https://github.com/vanruesc/postprocessing), which handles all effect rendering. Reading the [postprocessing wiki](https://github.com/vanruesc/postprocessing/wiki) is highly recommended to understand how the `EffectComposer` works.

The returned object can have the following options:
- `passes` (required): array of fragment shader strings (adjacent strings will be incorporated into one `EffectPass`) or valid instances of a postprocessing `Pass` that will be used in `EffectComposer`.

- `fps` (default: 60): the frame rate per second

- `coordinateTransform` (optional): a function that transforms mouse event coordinates ([see note about mouse events below](#mouse-events))

- `three`+`postprocessing` (optional): the dependencies to use ([see note about peer dependencies below](#a-note-about-dependencies))

Do not include the initial `RenderPass` that `EffectComposer` requires. This is done automatically.

#### Careful of shared instances

Make sure that each pass instance is created every time the exported function is called, so that each tab/pane's effects are self-contained. Otherwise a single pass could be used in multiple contexts, and its properties could become overwritten and inaccurate.

<details>
<summary>Example</summary>

Bad -- one pass will be used for all tabs/panes.

```js
/* path-to-entry-file.js */
const pass = new MyPass();

module.exports = () => {
  return {
    passes: [pass]
  };
}
```

Good -- no shared passes.

```js
/* path-to-entry-file.js */
module.exports = () => {
  const pass = new MyPass();

  return {
    passes: [pass]
  };
}
```
</details>

#### Mouse events
If your effects reposition any content inside the terminal, then mouse events will not be in sync with terminal visuals. You can optionally provide a `coordinateTransform` function to change the coordinates of mouse events.

```js
/* path-to-entry-file.js */
module.exports = () => {
  return {
    passes: [
      `void mainUv(inout vec2 uv) {
        uv.x = 1.0 - uv.x;
      }`
    ],
    coordinateTransform: function(x, y) {
      return [1 - x, y];
    }
  };
}
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

By default this plugin uses `postprocessing` v6.22.5 and its compatible version of `three` (v0.132.2), but can use other versions of those if needed. To do this you can add the versions of `three`/`postprocessing` to the returned object from the entry file:

```js
/* path-to-entry-file.js */
const three = require('three'); // vX.X.X
const pp = require('postproessing'); // vY.Y.Y

module.exports = () => {
  return {
    passes: [new pp.EffectPass(null, new pp.VignetteEffect())],
    three: three,
    postprocessing: pp
  };
};
```
