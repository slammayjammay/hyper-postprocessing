/**
 * This plugin attempts to make it easy to add fragment shaders to XTerm's
 * terminal. In your `.hyper.js` config file, add this plugin
 * ("hyper-postprocessing") to the `plugins` array. Then, inside the `config`
 * object, add a key `hyperPostprocessing` that points to an array. This will
 * be the config used for this plugin. For more info on the available config
 * options, see CONFIG_DEFAULTS below.
 *
 * Hyper v2 moves away from the HTerm rendering system (which uses the DOM) to
 * XTerm (which renders on a canvas). In addition to the performance benefits of
 * this, it also means it's way easier to add shader effects to the Hyper
 * terminal. We can set up a Three.js scene, use the XTerm canvas as an image
 * texture, and add fragment shaders using the "postprocessing" npm package.
 *
 * XTerm actually inserts 4 canvases into the DOM:
 *   1) one to render any text output
 *   2) one to render the background for any selected text done with the mouse
 *   3) one to render any clickable links to webpages
 *   4) one to render the cursor
 *
 * So we must apply any shader effects to all of these layers.
 *
 * One big, BIG downside: it's possible that mouse events do not visually sync
 * with outputted text. I haven't looked into the magic XTerm uses to add a
 * selection background when clicking with the mouse, but whatever it is, it
 * will be either impossible or really really difficult to make it work with
 * any fragment shaders.
 */

import { homedir } from 'os';
import {
	Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh,
	MeshBasicMaterial, CanvasTexture, LinearFilter, Clock
} from 'three';
import { EffectComposer, RenderPass } from 'postprocessing';
import { createPassFromFragmentString, createPassFromOptions } from './shader-loader';

// read config from the `hyperPostprocessing` key in .hyper.js config
// there is probably a better way of doing this using the middleware but idc
let CONFIG_OPTIONS = null;
const CONFIG_DEFAULTS = {
	// this plugin will require a javascript file that exports a single or
	// multiple shader pass "items". by default it looks in
	// "{{HOME}}/.hyper-postprocessing.js". each "item" can be one of 2 things:
	//   1) a string assumed to be a fragment shader (vertex shader is optional)
	//   2) an object with keys `fragmentShader` and `vertexShader` (vertex shader
	//      is optional). if you want to use a custom Three.js ShaderPass, provide
	//      one under the key `shaderPass`.
	entry: `${homedir()}/.hyper-postprocessing.js`

	// TODO: possible option to not render the selection and link layer?
};

exports.middleware = ({ getState, dispatch }) => next => action => {
	switch (action.type) {
		case 'CONFIG_LOAD':
		case 'CONFIG_RELOAD':
			const config = action.config.hyperPostprocessing || {};
			CONFIG_OPTIONS = Object.assign({}, CONFIG_DEFAULTS, config);
	}

	next(action);
};

exports.decorateTerm = (Term, { React }) => {
	class PostProcessing extends React.Component {
		constructor(...args) {
			super(...args);

			this._onDecorated = this._onDecorated.bind(this);
			this._onCanvasReplacement = this._onCanvasReplacement.bind(this);

			this._isInit = false; // have we already initialized?
			this._term = null; // IV for the argument passed in `onDecorated`
			this._aspectRatio; // to pass into each shader
			this._container = null; // container for the canvas we will inject
			this._canvas = null; // the canvas we will inject
			this._layers = {}; // holds XTerms rendered canvas, as well as the threejs Textures
			this.passes = []; // all of the shader passes for effectcomposer
			this._clock = this._scene = this._renderer = this._camera = this._composer = null; // threejs + postprocessing stuff
		}

		_onDecorated(term) {
			// according to Hyper docs, this is needed to continue the "chain flow"
			if (this.props.onDecorated) {
				this.props.onDecorated(term);
			}

			if (!term || !CONFIG_OPTIONS.entry) {
				return;
			}

			if (!this._isInit) {
				this._isInit = true;
				this._term = term;
				this._init();
			}
		}

		async _init() {
			let required, shaders;
			try {
				required = window.require(CONFIG_OPTIONS.entry);
				shaders = this._parseShadersFromConfig(required);
			} catch (e) {
				console.warn(e);
			}

			if (!required ||!shaders) {
				return;
			}

			this._container = this._term.termRef;
			this._xTermScreen = this._container.querySelector('.xterm .xterm-screen');

			// initialize this._layers["someClassList"] to an object holding an element
			// later we will also set the "material" key on this object
			this._xTermScreen.querySelectorAll('canvas').forEach(el => {
				this._layers[el.classList.toString()] = { el };
			});

			// listen for any changes that happen inside XTerm's screen
			this._layerObserver = new MutationObserver(this._onCanvasReplacement);
			this._layerObserver.observe(this._xTermScreen, { childList: true });

			Object.values(this._layers).forEach(({ el }) => el.style.opacity = 0);
			this._clock = new Clock({ autoStart: false});
			this._setupScene();

			this.passes = [
				new RenderPass(this._scene, this._camera),
				...(Array.isArray(shaders) ? shaders : [shaders])
			];
			this.passes[this.passes.length - 1].renderToScreen = true;

			// assign each pass an instance of a Three.js Clock
			// (to be safe, only on instances of "./ShaderPass")
			this.passes.forEach(pass => this._composer.addPass(pass));

			// i dont think there's a need to remove this listener later -- hyper takes care of it
			this._term.term.on('resize', () => {
				const { canvasWidth, canvasHeight } = this._term.term.renderer.dimensions;
				this._renderer.setSize(canvasWidth, canvasHeight);
				this._aspectRatio = canvasWidth / canvasHeight;
			});

			const that = this;
			this._term.term.on('resize', function resizeOnce() {
				that._term.term.off('resize', resizeOnce);
				that._startAnimationLoop();
			});
		}

		_parseShadersFromConfig(config) {
			if (typeof config === 'string') {
				return createPassFromFragmentString(config);
			} else if (Array.isArray(config)) {
				return config.map(item => this._parseShadersFromConfig(item));
			} else if (typeof config === 'object') {
				return createPassFromOptions(config);
			}

			return null;
		}

		/**
		 * Boilerplate for threejs
		 */
		_setupScene() {
			const { canvasWidth, canvasHeight } = this._term.term.renderer.dimensions;

			this._canvas = document.createElement('canvas');
			this._canvas.classList.add('hyper-postprocessing', 'canvas');

			// scene!
			this._scene = new Scene();

			// renderer!
			this._renderer = new WebGLRenderer({
				canvas: this._canvas,
				preserveDrawingBuffer: true,
				alpha: true
			});
			this._renderer.setPixelRatio(window.devicePixelRatio);
			this._renderer.setSize(canvasWidth, canvasHeight);

			// camera!
			const [w, h] = [canvasWidth / 2, canvasHeight / 2];
			this._camera = new OrthographicCamera(-w, w, h, -h, 1, 1000);

			// composer!
			this._composer = new EffectComposer(this._renderer);

			// create a texture and mesh for each of XTerm's canvases
			Object.values(this._layers).forEach((layerObj, idx) => {
				const canvas = layerObj.el;
				const texture = new CanvasTexture(canvas);
				texture.minFilter = LinearFilter;

				const geometry = new PlaneGeometry(canvasWidth, canvasHeight);
				const material = new MeshBasicMaterial({
					color: 0xFFFFFF,
					map: texture,
					transparent: true
				});
				const mesh = new Mesh(geometry, material);
				mesh.position.z = idx;

				layerObj.material = material;

				this._scene.add(mesh);
				this._camera.position.z += 1;
			});

			// add the element to the page
			this._container.append(this._renderer.domElement);
		}

		/**
		 * On tab switch, cancel/start the rendering loop
		 */
		componentWillReceiveProps(props) {
			if (!this._isInit) {
				return;
			}

			if (this.props.isTermActive && !props.isTermActive) {
				this._cancelAnimationLoop();
			} else if (!this.props.isTermActive && props.isTermActive) {
				this._startAnimationLoop();
			}
		}

		_startAnimationLoop() {
			const materials = Object.values(this._layers).map(({ material }) => material);
			const defaultPasses = this.passes.filter(pass => pass.name === 'DefaultShaderPass');
			this._clock.start();

			const that = this;

			(function render() {
				that._animationId = window.requestAnimationFrame(render);

				for (let i = 0, length = defaultPasses.length; i < length; i++) {
					defaultPasses[i].setUniform('timeElapsed', that._clock.getElapsedTime());
					defaultPasses[i].setUniform('aspect', that._aspectRatio);
				}

				for (let i = 0, length = materials.length; i < length; i++) {
					materials[i].map.needsUpdate = true;
				}

				that._composer.render(that._clock.getDelta());
			})();
		}

		_cancelAnimationLoop() {
			window.cancelAnimationFrame(this._animationId);
			this._clock.stop();
		}

		render() {
			return React.createElement(Term, Object.assign({}, this.props, {
				onDecorated: this._onDecorated
			}));
		}

		/**
		 * XTerm sometimes removes and replaces render layer canvases. afaik there
		 * isn't an event that fires when this happens (i think it only happens
		 * when Terminal#setTransparency is called). this function is the callback
		 * for a MutationObserver that observes `.xterm-screen` whenever the
		 * childList changes.
		 */
		_onCanvasReplacement([e]) {
			const { removedNodes, addedNodes } = e;
			for (let i = 0; i < removedNodes.length; i++) {
				this._replaceTexture(removedNodes[i], addedNodes[i]);
			}
		}

		_replaceTexture(removedCanvas, addedCanvas) {
			const affectedLayer = this._layers[removedCanvas.classList.toString()];
			const newTexture = new CanvasTexture(addedCanvas);
			newTexture.minFilter = LinearFilter;
			affectedLayer.material.map = newTexture;
		}

		componentWillUnmount() {
			if (this._isInit) {
				this.destroy();
			}
		}

		destroy() {
			this._cancelAnimationLoop();

			this._canvas && this._canvas.remove();
			this._composer && this._composer.dispose();

			this._isInit = false;
			this._term = this._container = this._canvas = null;
			this._layers = null;
			this._clock = this._scene = this._renderer = this._camera = this._composer = null;
		}
	}

	return PostProcessing;
};

// css
exports.decorateConfig = (config) => {
	return Object.assign({}, config, {
		css: `
		${config.css || ''}

		.term_term {
			position: relative;
		}

		.hyper-postprocessing.canvas {
			position: absolute;
			top: 0;
			left: 0;
		}
		`
	});
};
