/**
 * We can set up a Three.js scene, use the XTerm screen as an image texture, and
 * add fragment shaders using the "postprocessing" npm package.
 *
 * XTerm inserts 4 canvases into the DOM:
 *   1) one to render any text output
 *   2) one to render the background for any selected text done with the mouse
 *   3) one to render any clickable links to webpages
 *   4) one to render the cursor
 *
 * So we must apply any shader effects to all of these layers.
 */

import { homedir } from 'os';
import loadConfig from './load-config';
import requirePeer from './require-peer';

// `three` and `postprocessing` will be required at runtime, either using what's
// exported from the entry file or a fallback.
// they will be required when loading the config, so they should only be used
// after that occurs
let THREE, PP;

const CONFIG_DEFAULTS = {
	entry: `${homedir()}/.hyper-postprocessing.js`,
};

exports.decorateTerm = (Term, { React }) => {
	class HyperPostProcessing extends React.Component {
		constructor(...args) {
			super(...args);

			this._onDecorated = this._onDecorated.bind(this);
			this._onCanvasReplacement = this._onCanvasReplacement.bind(this);

			this._isInit = false; // have we already initialized?
			this._term = null; // IV for the argument passed in `onDecorated`
			this._xTermScreen = null; // xterm's container for render layers
			this._xTermLayerMap = new Map(); // map for each render layer and the material we will create
			this._container = null; // container for the canvas we will inject
			this._canvas = null; // the canvas we will inject
			this._clock = this._scene = this._renderer = this._camera = this._composer = null; // threejs + postprocessing stuff

			this.passes = []; // all of the passes for EffectComposer
			this._shaderPasses = []; // a subset of all passes that are not an EffectPass

			const userConfig = window.config.getConfig().hyperPostprocessing || {};
			this.config = Object.assign({}, CONFIG_DEFAULTS, userConfig);
			this.parsedEntry = null; // exported object from entry file
		}

		_onDecorated(term) {
			if (this.props.onDecorated) {
				this.props.onDecorated(term);
			}

			if (!term || !this.config.entry || this._isInit) {
				return;
			}

			this._term = term;
			this._init();
		}

		_init() {
			this.parsedEntry = loadConfig(this.config.entry, {
				hyperTerm: this._term,
				xTerm: this._term.term
			});

			if (!this.parsedEntry || this.parsedEntry.passes.length === 0) {
				return;
			}

			THREE = requirePeer.get('three');
			PP = requirePeer.get('postprocessing');

			this._isInit = true;

			this._container = this._term.termRef;
			this._xTermScreen = this._container.querySelector('.xterm .xterm-screen');

			const renderLayers = Array.from(this._xTermScreen.querySelectorAll('canvas'));
			for (const canvas of renderLayers) {
				canvas.style.opacity = 0;
			}

			const sortedLayers = this._sortLayers(renderLayers);
			this._setupScene(sortedLayers);
			this._clock = new THREE.Clock({ autoStart: false});

			// store all our passes
			this.passes = [new PP.RenderPass(this._scene, this._camera), ...this.parsedEntry.passes];
			this.passes[this.passes.length - 1].renderToScreen = true;
			this.passes.forEach(pass => this._composer.addPass(pass));
			this._shaderPasses = this.passes.slice(1).filter(pass => {
				return (pass instanceof PP.Pass) && !(pass instanceof PP.EffectPass);
			});

			// listen for any changes that happen inside XTerm's screen
			this._layerObserver = new MutationObserver(this._onCanvasReplacement);
			this._layerObserver.observe(this._xTermScreen, { childList: true });

			// set our canvas size and begin rendering
			// i don't think there's a need to remove this listener
			this._term.term.on('resize', () => {
				const { offsetWidth: w, offsetHeight: h } = this._term.term.element;
				const dpRatio = window.devicePixelRatio;

				this._composer.setSize(w, h);

				this._setUniforms({
					aspect: w / h,
					resolution: new THREE.Vector2(w * dpRatio, h * dpRatio)
				});
			});

			const that = this;
			this._term.term.on('resize', function resizeOnce() {
				that._term.term.off('resize', resizeOnce);
				that._clock.start();
				that._startAnimationLoop();
			});

			if (typeof this.parsedEntry.coordinateTransform === 'function') {
				function replaceEvent(e, coordinateTransform) {
					if (e.syntethic) {
						return;
					}

					e.preventDefault();
					e.stopPropagation();

					let copy = {};
					for (var attr in e) {
						copy[attr] = e[attr];
					}

					let r = e.target.getBoundingClientRect();
					let [w, h] = [r.width, r.height];
					let [x, y] = [(copy.clientX - r.left) / w, (r.bottom - copy.clientY) / h];
					[x, y] = coordinateTransform(x, y);
					[copy.clientX, copy.clientY] = [x * w + r.left, r.bottom - y * h];

					let e2 = new MouseEvent(copy.type, copy);
					e2.syntethic = true;
					copy.target.dispatchEvent(e2);
				}

				const el = document.querySelector('.term_wrapper');
				for (let eventType of ['click', 'mousedown', 'mouseup', 'mousemove']) {
					el.addEventListener(eventType, e => {
						replaceEvent(e, this.parsedEntry.coordinateTransform);
					});
				}
			}
		}

		/**
		 * Boilerplate for threejs.
		 *
		 * @param {Iterable} renderLayers - The list of xTerm's render layers we
		 * will use to create textures out of.
		 */
		_setupScene(renderLayers) {
			const { offsetWidth, offsetHeight } = this._term.term.element;

			this._canvas = document.createElement('canvas');
			this._canvas.classList.add('hyper-postprocessing', 'canvas');

			// scene!
			this._scene = new THREE.Scene();

			// renderer!
			this._renderer = new THREE.WebGLRenderer({
				canvas: this._canvas,
				preserveDrawingBuffer: true,
				alpha: true
			});
			this._renderer.setPixelRatio(window.devicePixelRatio);
			this._renderer.setSize(offsetWidth, offsetHeight);

			// camera!
			const [w, h] = [offsetWidth / 2, offsetHeight / 2];
			this._camera = new THREE.OrthographicCamera(-w, w, h, -h, 1, 1000);
			this._camera.position.z = 1;

			// composer!
			this._composer = new PP.EffectComposer(this._renderer);

			// xTerm textures!
			let zOffset = -renderLayers.length;
			for (const canvas of renderLayers) {
				const texture = new THREE.CanvasTexture(canvas);
				texture.minFilter = THREE.LinearFilter;

				const geometry = new THREE.PlaneGeometry(offsetWidth, offsetHeight);
				const material = new THREE.MeshBasicMaterial({
					color: 0xFFFFFF,
					map: texture,
					transparent: true
				});
				const mesh = new THREE.Mesh(geometry, material);
				mesh.position.z = ++zOffset;

				this._scene.add(mesh);
				this._xTermLayerMap.set(canvas, material);
			}

			// add the element to the page
			this._container.append(this._renderer.domElement);
		}

		/**
		 * On tab switch, cancel/start the rendering loop.
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

		/**
		 * Sets the given uniforms on all instances of ShaderPasses. We don't need
		 * to set uniforms on any EffectPasses -- all of the uniforms used here are
		 * automatically updated by postprocessing.
		 *
		 * @param {Object} obj - A map with uniform strings as keys and their value
		 * as values.
		 */
		_setUniforms(obj) {
			for (const uniformKey of Object.keys(obj)) {
				const value = obj[uniformKey];

				for (const pass of this._shaderPasses) {
					const material = pass.getFullscreenMaterial();

					if (material.uniforms[uniformKey] !== undefined) {
						material.uniforms[uniformKey].value = value;
					}
				}
			}
		}

		/**
		 * Sort correctly the renderLayers so the cursor texture is always
		 * on top when we render it.
		 *
		 * @param {Iterable} renderLayers - The list of xTerm's render layers we
		 * need to sort.
		 */
		_sortLayers(renderLayers) {
			function zIndex(element) {
				const { zIndex } = window.getComputedStyle(element);
				return zIndex === 'auto' ? 0 : Number(zIndex);
			}

			renderLayers.sort((a, b) => {
				return zIndex(a) - zIndex(b);
			});

			return renderLayers;
		}

		/**
		 * Begins the rendering loop, as well as sets time uniforms on passes that
		 * contain them, and sets the `needsUpdate` flag on all of our xTerm
		 * materials.
		 */
		_startAnimationLoop() {
			const xTermMaterials = Array.from(this._xTermLayerMap.values());
			const timeUniforms = this._shaderPasses.filter(pass => {
				return pass.getFullscreenMaterial().uniforms.time !== undefined;
			}).map(pass => {
				return pass.getFullscreenMaterial().uniforms.time;
			});

			const xTermMaterialsLength = xTermMaterials.length;
			const timeUniformsLength = timeUniforms.length;

			const that = this;
			const fps = 1000 / this.parsedEntry.fps;
			let lastRenderTime = fps;
			(function render() {
				that._animationId = window.requestAnimationFrame(render);

				const now = performance.now();
				if (now - lastRenderTime < fps) {
					return;
				}

				for (let i = 0; i < timeUniformsLength; i++) {
					timeUniforms.value = that._clock.getElapsedTime();
				}

				for (let i = 0; i < xTermMaterialsLength; i++) {
					xTermMaterials[i].map.needsUpdate = true;
				}

				that._composer.render(that._clock.getDelta());
				lastRenderTime = now;
			})();
		}

		_cancelAnimationLoop() {
			window.cancelAnimationFrame(this._animationId);
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
			const affectedMaterial = this._xTermLayerMap.get(removedCanvas);
			const newTexture = new THREE.CanvasTexture(addedCanvas);
			newTexture.minFilter = THREE.LinearFilter;

			affectedMaterial.map.dispose();
			affectedMaterial.map = newTexture;
		}

		componentWillUnmount() {
			if (this._isInit) {
				this.destroy();
			}
		}

		/**
		 * Garbage collection.
		 */
		destroy() {
			this._cancelAnimationLoop();
			this._clock.stop();

			while (this._scene.children.length > 0) {
				const mesh = this._scene.children[0];
				this._scene.remove(mesh);

				mesh.material.map.dispose();
				mesh.material.dispose();
				mesh.geometry.dispose();
			}

			this._layerObserver.disconnect();
			this._canvas.remove();
			this._composer.dispose();

			this._renderer.dispose();
			this._renderer.forceContextLoss();
			this._renderer.context = null;
			this._renderer.domElement = null;

			this._isInit = false;
			this._term = this._container = this._xTermScreen = this._canvas = null;
			this._layerObserver = this._xTermLayerMap = null;
			this.passes = this._shaderPasses = null;
			this._clock = this._scene = this._renderer = this._camera = this._composer = null;
			this.config = this.parsedEntry = null;
		}
	}

	return HyperPostProcessing;
};

// CSS to position the our canvas correctly
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
