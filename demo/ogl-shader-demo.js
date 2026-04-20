import { Renderer, Geometry, Program, Mesh } from "ogl";

class OglShaderDemo extends HTMLElement {
  static meta = {
    title: "ogl Shader Demo", // shown in catalog and page title
    category: "Browser", // groups demos in the catalog
    description: "A simple shader in a rectangle",
  };

  connectedCallback() {
    this._onResize = () => this.resize();
    this.initOgl();
    window.addEventListener("resize", this._onResize);
  }

  initOgl() {
    this.renderer = new Renderer({
      width: this.parentElement.clientWidth,
      height: Math.min(this.parentElement.clientHeight, 400),
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });

    this.gl = this.renderer.gl;
    this.appendChild(this.gl.canvas);

    // Triangle that covers viewport, with UVs spanning 0..1 across the view.
    this.geometry = new Geometry(this.gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });

    this.program = new Program(this.gl, {
      vertex: /* glsl */ `
        attribute vec2 uv;
        attribute vec2 position;

        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;

        uniform float uTime;
        varying vec2 vUv;

        void main() {
          gl_FragColor.rgb = vec3(0.8, 0.7, 1.0) + 0.3 * cos(vUv.xyx + uTime);
          gl_FragColor.a = 1.0;
        }
      `,
      uniforms: {
        uTime: { value: 0 },
      },
    });

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });

    this.resize();
    this.update = this.update.bind(this);
    this._rafId = requestAnimationFrame(this.update);
  }

  resize() {
    if (!this.renderer) return;
    this.renderer.setSize(this.parentElement.clientWidth, Math.min(window.innerHeight, 400));
  }

  update(t) {
    if (!this.program || !this.renderer || !this.mesh) return;

    this.program.uniforms.uTime.value = t * 0.001;
    this.renderer.render({ scene: this.mesh });
    this._rafId = requestAnimationFrame(this.update);
  }

  disconnectedCallback() {
    window.removeEventListener("resize", this._onResize);
    if (this._rafId) cancelAnimationFrame(this._rafId);

    if (this.gl?.canvas?.parentNode) {
      this.gl.canvas.parentNode.removeChild(this.gl.canvas);
    }

    this.geometry = null;
    this.program = null;
    this.mesh = null;
    this.renderer = null;
    this.gl = null;
    this._wrapEl = null;
  }
}

customElements.define("ogl-shader-demo", OglShaderDemo);
export default OglShaderDemo;
