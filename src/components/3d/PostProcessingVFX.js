import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * VFX Post-Processing Pipeline
 * - ACES Filmic Tone Mapping with high dynamic range color grading
 * - Unreal Bloom for atmospheric Aurora ribbons, maritime strobe LED, and ocean glints
 * - Selective thresholding to preserve dark polar sea contrast
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

  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  return {
    composer,
    bloomPass,
    setSize: (w, h) => {
      composer.setSize(w, h);
      bloomPass.resolution.set(w, h);
    },
    setBloomEnabled: (enabled) => {
      bloomPass.enabled = enabled;
    },
    setBloomStrength: (strength) => {
      bloomPass.strength = strength;
    }
  };
}
