import * as THREE from 'three';

/**
 * Dynamic Particle Splash & Subsea Bubble System
 * Emits bursting water droplets when the seal or CTD crosses the surface,
 * and leaves micro-bubble wakes trailing behind underwater motion.
 */
// Procedural soft circular texture for splash and bubble particles
function createParticleCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createSplashSystem() {
  const group = new THREE.Group();
  group.name = "splashSystemGroup";
  const particleCircleTex = createParticleCircleTexture();

  // 1. Surface Droplet Splash Particles
  const maxSplashParticles = 120;
  const splashGeo = new THREE.BufferGeometry();
  const splashPositions = new Float32Array(maxSplashParticles * 3);
  const splashVelocities = [];

  for (let i = 0; i < maxSplashParticles; i++) {
    splashPositions[i * 3] = 0;
    splashPositions[i * 3 + 1] = -100; // Hidden initially
    splashPositions[i * 3 + 2] = 0;

    splashVelocities.push({
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1.0
    });
  }

  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));

  const splashMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xe0f2fe,
    size: 0.45,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const splashMesh = new THREE.Points(splashGeo, splashMat);
  group.add(splashMesh);

  // 2. Subsea Rising Bubble Wake Particles
  const maxBubbles = 150;
  const bubbleGeo = new THREE.BufferGeometry();
  const bubblePositions = new Float32Array(maxBubbles * 3);
  const bubbleVelocities = [];

  for (let i = 0; i < maxBubbles; i++) {
    bubblePositions[i * 3] = 0;
    bubblePositions[i * 3 + 1] = -100;
    bubblePositions[i * 3 + 2] = 0;

    bubbleVelocities.push({
      vy: 0.05 + Math.random() * 0.08,
      wobble: Math.random() * Math.PI * 2,
      active: false
    });
  }

  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

  const bubbleMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0x38bdf8,
    size: 0.28,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const bubbleMesh = new THREE.Points(bubbleGeo, bubbleMat);
  group.add(bubbleMesh);

  let nextSplashIdx = 0;
  let nextBubbleIdx = 0;

  return {
    group,
    triggerSplash: (x, z) => {
      // Spawn bursting ring of water droplets at (x, 0, z)
      for (let i = 0; i < 28; i++) {
        const idx = (nextSplashIdx + i) % maxSplashParticles;
        const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1.8 + Math.random() * 2.2;

        splashPositions[idx * 3] = x;
        splashPositions[idx * 3 + 1] = 0.1;
        splashPositions[idx * 3 + 2] = z;

        splashVelocities[idx].vx = Math.cos(angle) * speed;
        splashVelocities[idx].vy = 2.5 + Math.random() * 3.0; // Upward burst
        splashVelocities[idx].vz = Math.sin(angle) * speed;
        splashVelocities[idx].life = 0;
        splashVelocities[idx].maxLife = 0.8 + Math.random() * 0.4;
      }
      nextSplashIdx = (nextSplashIdx + 28) % maxSplashParticles;
      splashGeo.attributes.position.needsUpdate = true;
    },
    emitBubble: (x, y, z) => {
      if (y > -0.2) return; // Only underwater
      const idx = nextBubbleIdx;
      bubblePositions[idx * 3] = x + (Math.random() - 0.5) * 0.4;
      bubblePositions[idx * 3 + 1] = y;
      bubblePositions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
      bubbleVelocities[idx].active = true;
      nextBubbleIdx = (nextBubbleIdx + 1) % maxBubbles;
      bubbleGeo.attributes.position.needsUpdate = true;
    },
    update: (delta, wind = null) => {
      // 1. Update Splash & Spindrift Particles (Gravity & Aerodynamic Wind Drag)
      const windAx = wind ? wind.x * 0.45 : -0.8;
      const windAz = wind ? wind.z * 0.45 : 0.0;

      const splashPos = splashGeo.attributes.position.array;
      for (let i = 0; i < maxSplashParticles; i++) {
        const vel = splashVelocities[i];
        if (vel.life < vel.maxLife) {
          vel.life += delta;
          vel.vy -= 9.8 * delta * 0.8; // Gravity
          vel.vx += windAx * delta;     // Airborne spray blown downwind by coastal wind
          vel.vz += windAz * delta;     // Spindrift

          splashPos[i * 3] += vel.vx * delta;
          splashPos[i * 3 + 1] += vel.vy * delta;
          splashPos[i * 3 + 2] += vel.vz * delta;

          // Hit water surface
          if (splashPos[i * 3 + 1] < -0.1) {
            vel.life = vel.maxLife; // Extinguish
            splashPos[i * 3 + 1] = -100;
          }
        } else {
          splashPos[i * 3 + 1] = -100;
        }
      }
      splashGeo.attributes.position.needsUpdate = true;

      // 2. Update Rising Bubbles
      const bPos = bubbleGeo.attributes.position.array;
      for (let i = 0; i < maxBubbles; i++) {
        if (bubbleVelocities[i].active) {
          bPos[i * 3 + 1] += bubbleVelocities[i].vy;
          bubbleVelocities[i].wobble += 0.1;
          bPos[i * 3] += Math.sin(bubbleVelocities[i].wobble) * 0.02;

          // Pop at surface
          if (bPos[i * 3 + 1] >= 0) {
            bubbleVelocities[i].active = false;
            bPos[i * 3 + 1] = -100;
          }
        }
      }
      bubbleGeo.attributes.position.needsUpdate = true;
    }
  };
}
