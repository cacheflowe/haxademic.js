import { Renderer, Geometry, Program, Mesh } from "ogl";

class OglShaderLogo extends HTMLElement {
  static meta = {
    title: "ogl Shader Logo",
    category: "Graphics",
    description: "Two rounded cubes in an iridescent raymarch scene — tilt with mouse",
  };

  connectedCallback() {
    this._mouseTarget = [0.17, 0.0];
    this._mouseTargetStart = [0.17, 0.0]; // default: slight downward tilt
    this._mouseTargetEnd = [0.5, 0.5]; // center
    this._mouse = [0.17, 0.0];
    this._onResize = () => this.resize();
    this._onPointerMove = (e) => {
      const rect = this.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      // this._mouseTarget = [(cx - rect.left) / rect.width, (cy - rect.top) / rect.height];
    };
    this.addEventListener("mousemove", this._onPointerMove);
    this.addEventListener("touchmove", this._onPointerMove);
    window.addEventListener("resize", this._onResize);
    this._manualBlend = null;
    this.initOgl();
    this.addSVGOverlay();
    this.addSlider();
    this.addCSS();
  }

  addSlider() {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "1";
    slider.step = "0.001";
    slider.value = "0";
    slider.className = "blend-slider";
    slider.addEventListener("input", () => {
      this._manualBlend = parseFloat(slider.value);
    });
    this.appendChild(slider);
  }

  addSVGOverlay() {
    let svg = /* html */ `
      <svg xmlns="http://www.w3.org/2000/svg" width="31" height="18" fill="none" aria-label="Hovercraft" viewBox="0 0 31 18">
        <mask id="a" width="31" height="18" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:luminance">
          <path fill="#fff" d="M30.103 0H0v18h30.103z"/>
        </mask>
        <g fill="currentColor" mask="url(#a)">
          <path d="M6.037 0-.002 9v9h9.013l6.039-9V0zm15.052 0L15.05 9v9h9.013l6.039-9V0zm7.844 15.65q-.492 0-.836.341c-.225.225-.339.51-.339.836q0 .49.339.827c.229.23.512.34.835.34q.487 0 .832-.34c.225-.225.338-.495.338-.827q0-.497-.338-.836a1.14 1.14 0 0 0-.831-.34m.638 1.824a.88.88 0 0 1-.639.26.87.87 0 0 1-.638-.26.87.87 0 0 1-.26-.647q0-.392.26-.656a.88.88 0 0 1 .639-.26.876.876 0 0 1 .893.916.88.88 0 0 1-.255.647"/>
          <path d="M29.441 17.423h-.297v-.475h-.43v.475h-.297v-1.202h.298v.446h.428v-.446h.298z"/>
        </g>
      </svg>
    `;
    // this.innerHTML += svg;
    // this.appendChild(new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("svg"));
  }

  addCSS() {
    const style = document.createElement("style");
    style.textContent = /* css */ `

      :host,
      ogl-shader-logo {
        display: block;
        position: relative;
        background: #10131a;
      }

      svg {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 3;
        width: 60%;
        height: auto;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.4;
      }

      .blend-slider {
        position: absolute;
        bottom: -50px;
        left: 0;
        z-index: 4;
        width: 70%;
        accent-color: #fff;
      }
    `;
    this.appendChild(style);
  }

  initOgl() {
    const w = this.parentElement.clientWidth;
    const h = Math.min(this.parentElement.clientHeight || w, w);

    this.renderer = new Renderer({
      width: w,
      height: h,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.gl = this.renderer.gl;
    this.appendChild(this.gl.canvas);

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
        uniform float uBlend;
        uniform float uZoom;
        uniform float uGap;
        uniform vec2  uMouse;
        uniform vec2  uResolution;
        varying vec2  vUv;

        // ---- uBlend phase timeline (0 → 1) ----
        // merge:  0.00 → 0.38   shapes slide together
        // spin:   0.20 → 0.65   counter-rotate into/out of a circle (bell peak at 0.42)
        // grid:   0.65 → 1.00   domain-repeat logo grid with wavy UV

        // The 3D sheared box viewed orthographically projects to a hexagon:
        // Minkowski sum of box(sz) and the shear line segment (-sz*shear → +sz*shear).
        // That hexagon has exactly 3 pairs of parallel edges → 3 half-plane constraints.
        //
        //   d1: |p.x| ≤ sz*(1+|shear.x|)          (left/right faces)
        //   d2: |p.y| ≤ sz*(1+|shear.y|)          (top/bottom faces)
        //   d3: |dot(p,n3)| ≤ sz*(|sx|+|sy|)/|s|  (diagonal faces, n3 ⊥ shear)
        //
        // SDF uses the same pattern as sdBox2D, generalised to 3 constraints.
        float sdHex(vec2 p, float sz, vec2 shear) {
          float d1 = abs(p.x) - sz * (1.0 + abs(shear.x));
          float d2 = abs(p.y) - sz * (1.0 + abs(shear.y));

          float shearLen = length(shear);
          if (shearLen < 0.001) {
            // Degenerate (no shear) → plain box
            return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.0);
          }

          float r3 = sz * (abs(shear.x) + abs(shear.y)) / shearLen;
          vec2  n3 = vec2(-shear.y, shear.x) / shearLen; // unit vec perpendicular to shear
          float d3 = abs(dot(p, n3)) - r3;

          return length(max(vec3(d1, d2, d3), 0.0)) + min(max(d1, max(d2, d3)), 0.0);
        }

        float map2D(vec2 p, vec2 shear) {
          float baseSz   = 0.3;
          float bMerge   = smoothstep(0.00, 0.38, uBlend);
          float bRotate  = smoothstep(0.20, 0.65, uBlend);  // spin window
          float bScatter = smoothstep(0.65, 1.00, uBlend);
          float bCircle  = sin(bRotate * 3.14159);           // bell: 0 → 1 → 0

          float gridScale = mix(1.0, 0.3, bScatter);
          float scaledSz  = baseSz * gridScale;
          float scaledGap = scaledSz + uGap * gridScale;
          float period    = mix(8.0, 0.6, bScatter);

          // Wavy UV — only active during grid phase, animates with uTime
          vec2 pOrig = p;
          p.x += sin(pOrig.y * 2.5 + uTime * 1.2) * bScatter * 0.12;
          p.y += sin(pOrig.x * 2.5 + uTime * 0.9) * bScatter * 0.12;

          vec2 q = mod(p + period * 0.5, period) - period * 0.5;

          // Sep: closes during merge, re-opens for grid
          float sep = scaledGap * max(1.0 - bMerge, bScatter);

          // Full 2π spin over the [0.20, 0.65] window
          float rotAngle = bRotate * 6.28318;
          float ca = cos(rotAngle), sa = sin(rotAngle);

          // Antipodal orbit: shapes revolve together (always opposite each other).
          // Orbit radius tightens toward the circle peak so they occupy the circle centre.
          float orbitR = mix(sep, scaledSz * 0.7, bCircle);
          vec2 c1 = vec2(-ca, -sa) * orbitR;  // starts left
          vec2 c2 = vec2( ca,  sa) * orbitR;  // starts right (antipodal)

          // Counter-spinning internal orientations (shape 1 CCW, shape 2 CW)
          vec2 q1 = q - c1;
          vec2 q1s = vec2( ca * q1.x - sa * q1.y,  sa * q1.x + ca * q1.y);
          vec2 q2 = q - c2;
          vec2 q2s = vec2( ca * q2.x + sa * q2.y, -sa * q2.x + ca * q2.y);

          float d1 = sdHex(q1s, scaledSz, shear);
          float d2 = sdHex(q2s, scaledSz, shear);

          // Circle the shapes crossfade into at the spin peak, sized to just contain them
          float circleR = scaledGap + scaledSz * 0.5 * bCircle;
          float dCircle = length(q) - circleR;

          return mix(min(d1, d2), dCircle, bCircle);
        }

        void main() {
          vec2 shear = (uMouse * 2.0 - 1.0);

          vec2 uv = vUv - 0.5;
          uv.x *= uResolution.x / uResolution.y;

          float zoom = uZoom * mix(1., 1.5, uBlend);
          vec2  p    = uv * zoom;

          float d = map2D(p, shear);

          float pixelSize = zoom * 2.0 / min(uResolution.x, uResolution.y);
          float aaWidth   = mix(0.6, 1.0, uBlend);
          float coverage  = 1.0 - smoothstep(0.0, pixelSize * aaWidth, d);

          vec3 col = mix(vec3(1.0), vec3(0.0), coverage);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uBlend: { value: 0 },
        uZoom: { value: 3.3 },
        uGap: { value: 0.199 },
        uMouse: { value: [0.17, 0.0] },
        uResolution: { value: [w, h] },
      },
    });

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });

    this.resize();
    this.update = this.update.bind(this);
    this._rafId = requestAnimationFrame(this.update);
  }

  clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  // Cubic ease-in-out in [0, 1].
  easeInOutCubic(v) {
    v = this.clamp01(v);
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }

  // External control: pass 0 (two separate shapes) → 1 (fully merged blob).
  setBlend(v, ease = false) {
    if (!this.program) return;
    const blend = ease ? this.easeInOutCubic(v) : this.clamp01(v);
    this.program.uniforms.uBlend.value = blend;
  }

  // Zoom: larger values zoom out (more world space visible). Default 2.6.
  setZoom(v) {
    if (this.program) this.program.uniforms.uZoom.value = v;
  }

  resize() {
    if (!this.renderer) return;
    const w = this.parentElement.clientWidth;
    const h = Math.min(this.parentElement.clientHeight || w, w);
    this.renderer.setSize(w, h);
    if (this.program) this.program.uniforms.uResolution.value = [w, h];
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  update(t) {
    if (!this.program || !this.renderer || !this.mesh) return;
    const osc = 0.5 - 0.5 * Math.cos(t * 0.001);

    let blend = this._manualBlend !== null ? this._manualBlend : this.easeInOutCubic(osc);
    // Mouse: logo angle → center → logo angle — returns to start shear for the grid phase
    const mouseBlend = blend < 0.5 ? blend * 2.0 : (1.0 - blend) * 2.0;
    this._mouseTarget[0] = this.lerp(this._mouseTargetStart[0], this._mouseTargetEnd[0], mouseBlend);
    this._mouseTarget[1] = this.lerp(this._mouseTargetStart[1], this._mouseTargetEnd[1], mouseBlend);

    // smooth mouse tracking
    const lerp = 0.2;
    this._mouse[0] += (this._mouseTarget[0] - this._mouse[0]) * lerp;
    this._mouse[1] += (this._mouseTarget[1] - this._mouse[1]) * lerp;
    // console.log(this._mouse);

    // update shader uniforms and render
    this.program.uniforms.uTime.value = t * 0.001;
    this.program.uniforms.uMouse.value = this._mouse;
    this.program.uniforms.uBlend.value = blend;
    // this.program.uniforms.uBlend.value = 0;
    this.renderer.render({ scene: this.mesh });
    this._rafId = requestAnimationFrame(this.update);
  }

  disconnectedCallback() {
    this.removeEventListener("mousemove", this._onPointerMove);
    this.removeEventListener("touchmove", this._onPointerMove);
    window.removeEventListener("resize", this._onResize);
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this.gl?.canvas?.parentNode) this.gl.canvas.parentNode.removeChild(this.gl.canvas);
    this.geometry = null;
    this.program = null;
    this.mesh = null;
    this.renderer = null;
    this.gl = null;
  }
}

customElements.define("ogl-shader-logo", OglShaderLogo);
export default OglShaderLogo;
