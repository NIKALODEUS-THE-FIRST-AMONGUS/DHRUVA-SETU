import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Optical Lens Vignette & 35mm Analog Micro-Film Grain Shader
 * - Subtle natural telephoto lens peripheral attenuation (15-20%)
 * - Ultra-fine dynamic film grain to dither 8-bit color banding on smooth dark gradients
 */
const CineVignetteGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    u_time: { value: 0.0 },
    u_vignetteDarkness: { value: 0.22 },
    u_vignetteOffset: { value: 0.95 },
    u_grainStrength: { value: 0.016 },
    u_dropletIntensity: { value: 0.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float u_time;
    uniform float u_vignetteDarkness;
    uniform float u_vignetteOffset;
    uniform float u_grainStrength;
    uniform float u_dropletIntensity;
    varying vec2 vUv;

    // High frequency pseudo-random hash
    float grainRandom(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // 1. Subtle Polar Sea-Spray Micro-Droplets on Camera Lens (when above water)
      if (u_dropletIntensity > 0.01) {
        vec2 dUv = uv * vec2(16.0, 9.0);
        vec2 gridId = floor(dUv);
        vec2 gridFract = fract(dUv) - 0.5;

        float dropHash = grainRandom(gridId + vec2(7.13, 13.91));
        float edgeDist = length(uv - 0.5);

        // Clustered towards peripheral lens boundary to avoid blocking the center asset
        if (dropHash > 0.76 && edgeDist > 0.28) {
          float dropRadius = 0.12 + fract(dropHash * 37.1) * 0.16;
          float d = length(gridFract);
          if (d < dropRadius) {
            float dropNormal = sqrt(max(0.0, 1.0 - (d / dropRadius) * (d / dropRadius)));
            vec2 refractOffset = -gridFract * dropNormal * 0.022 * u_dropletIntensity;
            uv = clamp(uv + refractOffset, 0.0, 1.0);
          }
        }
      }

      vec4 color = texture2D(tDiffuse, uv);

      // 2. Natural optical lens vignette
      vec2 coord = (vUv - 0.5) * vec2(u_vignetteOffset);
      float dist = length(coord);
      float vignette = smoothstep(0.85, 0.25, dist * (1.0 + u_vignetteDarkness));
      color.rgb *= mix(1.0 - u_vignetteDarkness, 1.0, vignette);

      // 3. High-frequency analog 35mm film grain (dithers banding on gradients)
      float grain = (grainRandom(vUv * 600.0 + fract(u_time * 0.001)) - 0.5) * u_grainStrength;
      color.rgb += grain;

      gl_FragColor = color;
    }
  `
};

/**
 * VFX Post-Processing Pipeline
 * - ACES Filmic Tone Mapping with high dynamic range color grading
 * - sRGB output color space
 * - Unreal Bloom for atmospheric Aurora ribbons, maritime strobe LED, and ocean glints
 * - Restrained optical lens vignette & light film grain
 * - FXAA (Fast Approximate Anti-Aliasing) pass
 * - Quality tier scaling (Low / Medium / High)
 */
export function setupPostProcessing(renderer, scene, camera, width, height) {
  // sRGB output color space & ACES Filmic Tone Mapping
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  const renderPass = new RenderPass(scene, camera);

  // Unreal Bloom Pass (calibrated threshold so only genuine emitters glow)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.38, // Calibrated strength (clean, high-tech glow without blinding blowout)
    0.22, // Radius (tight, controlled halo around emissive emitters)
    0.88  // Threshold (only bright aurora, LED strobes, and genuine emitters bloom)
  );

  // Cine Vignette & Film Grain Pass
  const vignetteGrainPass = new ShaderPass(CineVignetteGrainShader);

  // FXAA Anti-Aliasing Pass
  const fxaaPass = new ShaderPass(FXAAShader);
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pr);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pr);

  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(vignetteGrainPass);
  composer.addPass(fxaaPass);

  return {
    composer,
    bloomPass,
    vignetteGrainPass,
    fxaaPass,
    update: (time, cameraY = 1.0, preset = 'wide') => {
      vignetteGrainPass.material.uniforms['u_time'].value = time;
      const isSurfaceCam = cameraY > 0.05 && (preset === 'wide' || preset === 'buoy' || preset === 'electronics_a');
      const targetIntensity = isSurfaceCam ? 0.65 : 0.0;
      const cur = vignetteGrainPass.material.uniforms['u_dropletIntensity'].value;
      vignetteGrainPass.material.uniforms['u_dropletIntensity'].value += (targetIntensity - cur) * 0.08;
    },
    setSize: (w, h) => {
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
      const currentPr = renderer.getPixelRatio();
      fxaaPass.material.uniforms['resolution'].value.x = 1 / (w * currentPr);
      fxaaPass.material.uniforms['resolution'].value.y = 1 / (h * currentPr);
    },
    setBloomEnabled: (enabled) => {
      bloomPass.enabled = enabled;
    },
    setBloomStrength: (strength) => {
      bloomPass.strength = strength;
    },
    setVignetteGrainEnabled: (enabled) => {
      vignetteGrainPass.enabled = enabled;
    },
    setToneMapping: (type = 'aces') => {
      if (type === 'agx' && THREE.AgXToneMapping !== undefined) {
        renderer.toneMapping = THREE.AgXToneMapping;
        renderer.toneMappingExposure = 1.0;
      } else {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;
      }
    },
    setQualityTier: (tier) => {
      switch (tier) {
        case 'low':
          bloomPass.enabled = false;
          vignetteGrainPass.enabled = false;
          fxaaPass.enabled = false;
          renderer.setPixelRatio(1.0);
          break;
        case 'medium':
          bloomPass.enabled = true;
          bloomPass.strength = 0.30;
          vignetteGrainPass.enabled = true;
          vignetteGrainPass.material.uniforms['u_grainStrength'].value = 0.012;
          fxaaPass.enabled = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          break;
        case 'high':
        default:
          bloomPass.enabled = true;
          bloomPass.strength = 0.38;
          vignetteGrainPass.enabled = true;
          vignetteGrainPass.material.uniforms['u_grainStrength'].value = 0.016;
          fxaaPass.enabled = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
          break;
      }
    }
  };
}
