// from: https://github.com/BradLarson/GPUImage/blob/master/framework/Source/GPUImageChromaKeyFilter.m

THREE.ChromaShader = {

	uniforms: {
    "tDiffuse": { value: null },
		"thresholdSensitivity": { value: 0.2 },
		"smoothing": { value: 0.8 },
    "colorToReplace": { value: new THREE.Color( 0x000000 ) }
	},

	vertexShader: `
    varying vec2 vUv;

    void main() {
    	vUv = uv;
    	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

	fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float thresholdSensitivity;
    uniform float smoothing;
    uniform vec3 colorToReplace;

    varying vec2 vUv;

    void main() {
      vec4 textureColor = texture2D(tDiffuse, vUv.xy);
      float blendValue = smoothstep(thresholdSensitivity, thresholdSensitivity + smoothing, distance(colorToReplace, textureColor.rgb));
      gl_FragColor = vec4(textureColor.rgb, blendValue);
      // gl_FragColor = vec4(blendValue, blendValue, blendValue, blendValue);
    }
  `
};