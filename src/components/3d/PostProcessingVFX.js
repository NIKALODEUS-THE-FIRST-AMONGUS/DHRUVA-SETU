import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * Cinematic Master Post-Processing Shader (Cooke / Panavision Anamorphic Inspired)
 * - Radial Chromatic Aberration (peripheral wavelength dispersion r^2)
 * - High-Dynamic-Range Polar Ocean Color Grading (icy navy shadows, glacial cyan midtones, low-sun gold highlights)
 * - Subsea Optical Turbidity & Beer-Lambert Depth Color Absorption (when camera is submerged)
 * - Physical Polar Sea-Spray Water Droplets on Lens (Fresnel ring refraction & gravity teardrop elongation)
 * - Optical Telephoto Lens Barrel Vignette
 * - 35mm Analog Micro-Film Grain & Spatio-Temporal Dither (eliminates 8-bit quantization banding)
 */
const CineMasterPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    u_time: { value: 0.0 },
    u_vignetteDarkness: { value: 0.24 },
    u_vignetteOffset: { value: 0.92 },
    u_grainStrength: { value: 0.016 },
    u_dropletIntensity: { value: 0.0 },
    u_chromaticAberration: { value: 0.0022 },
    u_underwaterFactor: { value: 0.0 },
    u_exposure: { value: 1.0 },
    u_contrast: { value: 1.06 }
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
    uniform float u_chromaticAberration;
    uniform float u_underwaterFactor;
    uniform float u_exposure;
    uniform float u_contrast;
    varying vec2 vUv;

    // High frequency spatio-temporal hash
    float hash21(vec2 p) {
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // 1. Physical Sea-Spray Lens Droplets (with refraction & Fresnel ring)
      if (u_dropletIntensity > 0.01) {
        vec2 dUv = uv * vec2(18.0, 10.125);
        vec2 gridId = floor(dUv);
        vec2 gridFract = fract(dUv) - 0.5;

        float dropHash = hash21(gridId + vec2(7.13, 13.91));
        float edgeDist = length(uv - 0.5);

        // Clustered predominantly towards peripheral lens regions to keep center target unobstructed
        if (dropHash > 0.74 && edgeDist > 0.22) {
          float dropRadius = 0.10 + fract(dropHash * 37.1) * 0.18;
          // Slight teardrop gravity sag
          vec2 dropCenter = gridFract + vec2(0.0, 0.04 * (1.0 - dropRadius));
          float d = length(dropCenter);

          if (d < dropRadius) {
            float dropNormal = sqrt(max(0.0, 1.0 - (d / dropRadius) * (d / dropRadius)));
            vec2 refractOffset = -dropCenter * dropNormal * 0.028 * u_dropletIntensity;
            uv = clamp(uv + refractOffset, 0.0, 1.0);
          }
        }
      }

      // 2. Radial Chromatic Aberration (Anamorphic peripheral dispersion)
      vec2 centerOffset = uv - 0.5;
      float r2 = dot(centerOffset, centerOffset);
      vec2 caDisp = centerOffset * r2 * u_chromaticAberration;

      float r = texture2D(tDiffuse, uv + caDisp).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - caDisp).b;
      vec3 color = vec3(r, g, b) * u_exposure;

      // 3. Subsea Optical Turbidity & Beer-Lambert Depth Color Absorption (Underwater)
      if (u_underwaterFactor > 0.01) {
        // Seawater selectively absorbs red wavelengths 3.5x faster than green and blue
        vec3 waterAbsorption = vec3(0.58, 0.88, 1.04);
        vec3 subseaAmbientScattering = vec3(0.008, 0.026, 0.052);
        color = mix(color, color * waterAbsorption + subseaAmbientScattering, u_underwaterFactor * 0.42);
      }

      // 4. Cinematic Polar Color Grading (Split-Toning & S-Curve Contrast)
      // Filmic S-curve contrast around midpoint 0.42
      color = (color - 0.42) * u_contrast + 0.42;

      // Split-toning: Deep icy navy shadows & low-sun golden rim highlights
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowGrade = vec3(0.012, 0.038, 0.075); // Polar abyssal navy
      vec3 highlightGrade = vec3(1.035, 1.010, 0.965); // Warm golden low-sun lift
      color = mix(color + shadowGrade * (1.0 - smoothstep(0.0, 0.45, lum)), color * highlightGrade, smoothstep(0.55, 1.0, lum));

      // 5. Natural Telephoto Lens Optical Vignette
      vec2 coord = (vUv - 0.5) * vec2(u_vignetteOffset);
      float dist = length(coord);
      float vignette = smoothstep(0.86, 0.22, dist * (1.0 + u_vignetteDarkness));
      // Subtle cool blue cast in extreme peripheral corners
      color = mix(color * (1.0 - u_vignetteDarkness) * vec3(0.92, 0.96, 1.02), color, vignette);

      // 6. High-Frequency Analog 35mm Micro-Film Grain & Dither
      float grain = (hash21(vUv * 640.0 + fract(u_time * 0.001)) - 0.5) * u_grainStrength;
      color += grain;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `
};

/**
 * VFX Post-Processing Pipeline
 * - ACES Filmic Tone Mapping with calibrated dynamic range
 * - Multi-scale Unreal Bloom for atmospheric polar sky, sun specular road, and telemetry beacons
 * - Cine Master Composite (Chromatic Aberration, Polar Color Grade, Lens Droplets, Vignette, Film Dither)
 * - Fast Approximate Anti-Aliasing (FXAA)
 * - Dynamic performance tier scaling (Low / Medium / High)
 */
export function setupPostProcessing(renderer, scene, camera, width, height) {
  // sRGB output color space & ACES Filmic Tone Mapping
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96; // Calibrated for high-latitude polar sunlight

  const renderPass = new RenderPass(scene, camera);

  // Unreal Bloom Pass (calibrated threshold so only genuine emitters and specular diamonds bloom)
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.30, // Calibrated cinematic strength (clean, high-tech glow without blinding blowout)
    0.35, // Organic, soft diffusion radius
    0.94  // Precision threshold: only genuine specular glints, laser downlink, and status LEDs bloom
  );

  // Cine Master Post Composite Pass
  const masterPostPass = new ShaderPass(CineMasterPostShader);

  // FXAA Anti-Aliasing Pass
  const fxaaPass = new ShaderPass(FXAAShader);
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pr);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pr);

  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(masterPostPass);
  composer.addPass(fxaaPass);

  return {
    composer,
    bloomPass,
    masterPostPass,
    fxaaPass,
    update: (time, cameraY = 1.0, preset = 'wide') => {
      masterPostPass.material.uniforms['u_time'].value = time;

      // 1. Water droplets on lens: dynamic when camera is near surface / waterline
      const isNearWaterline = cameraY > -0.25 && cameraY < 2.2;
      const isInspecting = preset && preset.startsWith('electronics');
      const targetDropletIntensity = (isNearWaterline && !isInspecting) ? 0.75 : 0.0;
      const curDroplet = masterPostPass.material.uniforms['u_dropletIntensity'].value;
      masterPostPass.material.uniforms['u_dropletIntensity'].value += (targetDropletIntensity - curDroplet) * 0.08;

      // 2. Subsea underwater depth factor
      const targetUnderwater = cameraY < -0.15 ? Math.min(1.0, (-cameraY - 0.15) / 4.0) : 0.0;
      const curUnderwater = masterPostPass.material.uniforms['u_underwaterFactor'].value;
      masterPostPass.material.uniforms['u_underwaterFactor'].value += (targetUnderwater - curUnderwater) * 0.12;

      // 3. Inspection mode framing (clean studio clarity vs. cinematic anamorphic)
      const targetCA = isInspecting ? 0.0006 : 0.0022;
      const curCA = masterPostPass.material.uniforms['u_chromaticAberration'].value;
      masterPostPass.material.uniforms['u_chromaticAberration'].value += (targetCA - curCA) * 0.10;
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
      masterPostPass.enabled = enabled;
    },
    setToneMapping: (type = 'aces') => {
      if (type === 'agx' && THREE.AgXToneMapping !== undefined) {
        renderer.toneMapping = THREE.AgXToneMapping;
        renderer.toneMappingExposure = 0.92;
      } else {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.96;
      }
    },
    setQualityTier: (tier) => {
      switch (tier) {
        case 'low':
          bloomPass.enabled = false;
          masterPostPass.material.uniforms['u_chromaticAberration'].value = 0.0;
          masterPostPass.material.uniforms['u_grainStrength'].value = 0.008;
          fxaaPass.enabled = false;
          renderer.setPixelRatio(1.0);
          break;
        case 'medium':
          bloomPass.enabled = true;
          bloomPass.strength = 0.20;
          masterPostPass.material.uniforms['u_chromaticAberration'].value = 0.0012;
          masterPostPass.material.uniforms['u_grainStrength'].value = 0.012;
          fxaaPass.enabled = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          break;
        case 'high':
        default:
          bloomPass.enabled = true;
          bloomPass.strength = 0.30;
          masterPostPass.material.uniforms['u_chromaticAberration'].value = 0.0022;
          masterPostPass.material.uniforms['u_grainStrength'].value = 0.016;
          fxaaPass.enabled = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
          break;
      }
    },
    dispose: () => {
      if (composer.renderTarget1) composer.renderTarget1.dispose();
      if (composer.renderTarget2) composer.renderTarget2.dispose();
      if (bloomPass.renderTargetsHorizontal) {
        bloomPass.renderTargetsHorizontal.forEach(rt => rt.dispose());
      }
      if (bloomPass.renderTargetsVertical) {
        bloomPass.renderTargetsVertical.forEach(rt => rt.dispose());
      }
      if (masterPostPass && masterPostPass.material) {
        masterPostPass.material.dispose();
      }
      if (fxaaPass && fxaaPass.material) {
        fxaaPass.material.dispose();
      }
    }
  };
}
