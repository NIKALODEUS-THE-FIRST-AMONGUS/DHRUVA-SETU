import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

/**
 * VFX Post-Processing Pipeline
 * - ACES Filmic Tone Mapping with high dynamic range color grading
 * - Unreal Bloom for atmospheric Aurora ribbons, maritime strobe LED, and ocean glints
 * - FXAA (Fast Approximate Anti-Aliasing) pass to eliminate offscreen render-target specular crawling & thin-line aliasing
 */
export function setupPostProcessing(renderer, scene, camera, width, height) {
  // Cinematic tone mapping configuration
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const renderPass = new RenderPass(scene, camera);

  // Unreal Bloom Pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.65, // Strength (lush, cinematic glow)
    0.45, // Radius
    0.72  // Threshold (only bright aurora, LED strobes, and specular water highlights glow)
  );

  // FXAA Anti-Aliasing Pass (crucial for thin antennas, titanium cage bars & solar gridlines)
  const fxaaPass = new ShaderPass(FXAAShader);
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pr);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pr);

  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(fxaaPass);

  return {
    composer,
    bloomPass,
    fxaaPass,
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
    }
  };
}
