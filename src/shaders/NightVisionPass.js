import * as THREE from 'three';

export class NightVisionPass {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Render target for capturing the scene
    this.renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      }
    );

    // Create full-screen quad for post-processing
    this.createPostProcessQuad();
  }

  createPostProcessQuad() {
    // Night vision shader - authentic camcorder nightshot look
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform vec2 resolution;

      varying vec2 vUv;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = vUv;

        // Get original color
        vec4 color = texture2D(tDiffuse, uv);

        // Convert to luminance
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        // Boost luminance significantly for night vision
        lum = pow(lum, 0.6) * 2.5;
        lum = clamp(lum, 0.0, 1.0);

        // Night vision green/white tint (like real nightshot)
        vec3 nightVision = vec3(lum * 0.7, lum * 1.0, lum * 0.75);

        // Add film grain noise
        float noise = (random(uv + fract(time * 0.1)) - 0.5) * 0.1;
        nightVision += noise;

        // Subtle scanlines
        float scanline = sin(uv.y * resolution.y * 0.5 + time * 2.0) * 0.03;
        nightVision -= scanline * 0.5;

        // Very subtle vignette
        vec2 center = uv - 0.5;
        float dist = length(center);
        float vignette = 1.0 - dist * 0.5;
        nightVision *= vignette;

        // Clamp final output
        nightVision = clamp(nightVision, 0.0, 1.0);

        gl_FragColor = vec4(nightVision, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader,
      fragmentShader
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);

    // Ortho camera for full-screen quad
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
    this.material.uniforms.resolution.value.set(width, height);
  }

  render() {
    // Update time uniform
    this.material.uniforms.time.value = performance.now() * 0.001;

    // Render scene to render target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    // Render post-processed result to screen
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.quadScene, this.orthoCamera);
  }
}
