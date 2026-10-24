import * as THREE from 'three';
import { generatePolarCloudMap } from './ProceduralTextures';

/**
 * Polar Atmospheric & Seasonal Weather VFX Engine
 * Accurately models the 4 extreme Antarctic seasonal cycles:
 * 1. Austral Summer (Midnight Sun) — 24-hour continuous low-angle golden sunlight, parhelion glints, crepuscular sun shafts
 * 2. Austral Winter (Polar Night / No Sun) — Sun below horizon, brilliant Aurora Australis ribbons & celestial starfield
 * 3. Autumn Freeze-up (Blizzard & Ice Flurries) — Freezing gale-force blizzard with 2500 swirling snow particles & spindrift
 * 4. Spring Thaw (Breakup & Polar Sleet) — Drifting ice melt, high-velocity polar sleet & freezing drizzle
 */
// Procedural soft radial circle texture for point particles (prevents square pixel banding)
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

export function createAtmosphere() {
  const group = new THREE.Group();
  group.name = "atmosphereGroup";
  const particleCircleTex = createParticleCircleTexture();
  const cloudMap = generatePolarCloudMap();

  // 1. Celestial Starfield (Visible in Winter / Polar Night)
  const starCount = 2000;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.88 + 0.12);
    const r = 260 + Math.random() * 30;

    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) + 12;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    starSizes[i] = Math.random() * 2.2 + 0.8;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

  const starMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xe0f2fe,
    size: 1.6,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });

  const starMesh = new THREE.Points(starGeo, starMat);
  group.add(starMesh);

  // 2. Volumetric Aurora Australis Ribbons (Winter & Polar Night)
  const auroraRibbons = [];
  const ribbonCount = 5;

  const auroraVertShader = `
    uniform float u_time;
    uniform float u_offset;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float wave1 = sin(pos.x * 0.04 + u_time * 0.8 + u_offset) * 6.5;
      float wave2 = cos(pos.x * 0.08 - u_time * 0.5 + u_offset * 1.5) * 3.2;
      pos.z += (wave1 + wave2) * (1.0 - uv.y * 0.3);
      pos.y += sin(pos.x * 0.02 + u_time * 0.4) * 2.5;

      vWave = (wave1 + wave2) / 9.7;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const auroraFragShader = `
    uniform float u_time;
    uniform float u_globalOpacity;
    uniform vec3 u_colorA; // Emerald green
    uniform vec3 u_colorB; // Electric cyan
    uniform vec3 u_colorC; // Violet magenta
    varying vec2 vUv;
    varying float vWave;

    void main() {
      float verticalFade = sin(vUv.y * 3.14159265);
      verticalFade = pow(verticalFade, 1.4);

      float t = clamp((vUv.x + sin(u_time * 0.3) * 0.2), 0.0, 1.0);
      vec3 auroraColor = mix(u_colorA, u_colorB, t);
      auroraColor = mix(auroraColor, u_colorC, clamp(vUv.y * 1.2 - 0.2, 0.0, 1.0));

      float curtains = sin(vUv.x * 60.0 + u_time * 1.2 + vWave * 4.0) * 0.5 + 0.5;
      curtains = pow(curtains, 2.5) * 0.35 + 0.65;

      vec3 finalColor = auroraColor * curtains * 1.9;
      float alpha = verticalFade * 0.75 * u_globalOpacity;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  const auroraGroup = new THREE.Group();
  auroraGroup.name = "auroraAustralisGroup";

  for (let i = 0; i < ribbonCount; i++) {
    const ribbonGeo = new THREE.PlaneGeometry(160, 24, 64, 12);
    const ribbonMat = new THREE.ShaderMaterial({
      vertexShader: auroraVertShader,
      fragmentShader: auroraFragShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_offset: { value: i * 1.7 },
        u_globalOpacity: { value: 0.2 }, // modulated by season
        u_colorA: { value: new THREE.Color(0x10b981) }, // Emerald
        u_colorB: { value: new THREE.Color(0x06b6d4) }, // Cyan
        u_colorC: { value: new THREE.Color(0x8b5cf6) }  // Violet
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    const angle = (i / ribbonCount) * Math.PI * 0.6 + 0.2;
    const distance = 110 + i * 14;
    mesh.position.set(Math.cos(angle) * distance - 40, 42 + i * 4, -Math.sin(angle) * distance - 30);
    mesh.rotation.y = angle + 0.4;
    mesh.rotation.x = 0.15;

    auroraGroup.add(mesh);
    auroraRibbons.push(ribbonMat);
  }
  group.add(auroraGroup);

  // 3. Swirling Blizzard Snow Particles (Autumn & Winter Flurries)
  const snowCount = 2500;
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(snowCount * 3);
  const snowVelocities = [];

  for (let i = 0; i < snowCount; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * 120;
    snowPos[i * 3 + 1] = Math.random() * 45;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 120;

    snowVelocities.push({
      x: (Math.random() - 0.5) * 0.4 - 0.8, // West-to-east gale drift
      y: -(Math.random() * 0.4 + 0.2),       // Downward fall
      z: (Math.random() - 0.5) * 0.3
    });
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));

  const snowMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xffffff,
    size: 1.4,
    transparent: true,
    opacity: 0.0, // enabled in autumn/winter
    blending: THREE.NormalBlending,
    depthWrite: false
  });

  const snowMesh = new THREE.Points(snowGeo, snowMat);
  snowMesh.name = "blizzardSnowParticles";
  group.add(snowMesh);

  // 4. Polar Sleet & Freezing Rain (Spring Thaw)
  const rainCount = 1200;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 6); // Line segments (start & end)

  for (let i = 0; i < rainCount; i++) {
    const rx = (Math.random() - 0.5) * 100;
    const ry = Math.random() * 40;
    const rz = (Math.random() - 0.5) * 100;

    rainPos[i * 6] = rx;
    rainPos[i * 6 + 1] = ry;
    rainPos[i * 6 + 2] = rz;

    rainPos[i * 6 + 3] = rx - 0.3;
    rainPos[i * 6 + 4] = ry - 1.2; // Sleet streak
    rainPos[i * 6 + 5] = rz;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.0, // enabled in spring
    linewidth: 1
  });

  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.name = "polarSleetRain";
  group.add(rainLines);

  // 5. Antarctic Sun Dog / 22° Parhelion Atmospheric Ice Crystal Halo
  const haloGroup = new THREE.Group();
  haloGroup.name = "sunDogHaloGroup";
  haloGroup.position.set(45, 28, 40);
  haloGroup.lookAt(0, 5, 0);

  // 22° Circular Ice Crystal Halo (subtle atmospheric refraction)
  const haloRingGeo = new THREE.RingGeometry(22, 23.8, 64);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfed7aa,
    transparent: true,
    opacity: 0.06,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const haloMesh = new THREE.Mesh(haloRingGeo, haloMat);
  haloGroup.add(haloMesh);

  // Left & Right Parhelia (Flanking Sun Dogs with prismatic flare)
  const sunDogGeo = new THREE.CircleGeometry(2.2, 24);
  const sunDogMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.10,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const leftSunDog = new THREE.Mesh(sunDogGeo, sunDogMat);
  leftSunDog.position.set(-23.0, 0, 0);
  haloGroup.add(leftSunDog);

  const rightSunDog = new THREE.Mesh(sunDogGeo, sunDogMat);
  rightSunDog.position.set(23.0, 0, 0);
  haloGroup.add(rightSunDog);

  group.add(haloGroup);

  // 6. Arctic Sea Smoke (Evaporative Frost Smoke / Steam Fog hovering in ocean troughs)
  const smokeCount = 420;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeVel = [];

  for (let i = 0; i < smokeCount; i++) {
    const sx = (Math.random() - 0.5) * 110;
    const sy = 0.12 + Math.random() * 0.78;
    const sz = (Math.random() - 0.5) * 110;

    smokePos[i * 3] = sx;
    smokePos[i * 3 + 1] = sy;
    smokePos[i * 3 + 2] = sz;

    smokeVel.push({
      vx: 0.25 + Math.random() * 0.35,
      vz: 0.12 + Math.random() * 0.20,
      phase: Math.random() * Math.PI * 2
    });
  }

  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xe2e8f0,
    size: 2.2,
    transparent: true,
    opacity: 0.18,
    blending: THREE.NormalBlending,
    depthWrite: false
  });
  const seaSmokeMesh = new THREE.Points(smokeGeo, smokeMat);
  seaSmokeMesh.name = "arcticSeaSmoke";
  group.add(seaSmokeMesh);

  // 7. Volumetric Polar Stratus Cloud Deck on the Horizon
  const cloudGeo = new THREE.CylinderGeometry(210, 210, 36, 48, 1, true);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudMap,
    color: 0xfed7aa,
    transparent: true,
    opacity: 0.24,
    side: THREE.BackSide,
    depthWrite: false
  });
  const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  cloudMesh.position.y = 18;
  group.add(cloudMesh);

  // 8. Low-Sun Crepuscular Sun Rays / Atmospheric God-Rays
  const godRaysGroup = new THREE.Group();
  godRaysGroup.name = "godRaysGroup";
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xfed7aa,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let r = 0; r < 7; r++) {
    const rayGeo = new THREE.BufferGeometry();
    const angle = (r - 3) * 0.14;
    const spread = 8.0;
    const length = 110.0;
    const vertices = new Float32Array([
      0, 0, 0,
      Math.sin(angle - 0.05) * length - spread, -length * 0.42, Math.cos(angle - 0.05) * length,
      Math.sin(angle + 0.05) * length + spread, -length * 0.42, Math.cos(angle + 0.05) * length
    ]);
    rayGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    godRaysGroup.add(rayMesh);
  }
  godRaysGroup.position.set(45, 28, 40);
  godRaysGroup.lookAt(0, 0, 0);
  group.add(godRaysGroup);

  // 9. Waterline Spindrift Spray Particles
  const spindriftCount = 450;
  const spindriftGeo = new THREE.BufferGeometry();
  const spindriftPos = new Float32Array(spindriftCount * 3);
  const spindriftVel = [];

  for (let s = 0; s < spindriftCount; s++) {
    spindriftPos[s * 3] = (Math.random() - 0.5) * 80;
    spindriftPos[s * 3 + 1] = 0.2 + Math.random() * 1.4;
    spindriftPos[s * 3 + 2] = (Math.random() - 0.5) * 80;
    spindriftVel.push({
      vx: 1.2 + Math.random() * 0.9,
      vy: (Math.random() - 0.4) * 0.2,
      vz: 0.5 + Math.random() * 0.4
    });
  }
  spindriftGeo.setAttribute('position', new THREE.BufferAttribute(spindriftPos, 3));
  const spindriftMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xf1f5f9,
    size: 0.9,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const spindriftMesh = new THREE.Points(spindriftGeo, spindriftMat);
  spindriftMesh.name = "waterlineSpindrift";
  group.add(spindriftMesh);

  // Current Season State
  let currentSeason = 'summer';

  return {
    group,
    setSeason: (seasonId) => {
      currentSeason = seasonId;
      switch (seasonId) {
        case 'summer': // 24-Hour Midnight Sun
          starMat.opacity = 0.25;
          snowMat.opacity = 0.0;
          rainMat.opacity = 0.0;
          haloMat.opacity = 0.06;
          sunDogMat.opacity = 0.10;
          smokeMat.opacity = 0.14;
          cloudMat.color.setHex(0xfed7aa);
          cloudMat.opacity = 0.24;
          rayMat.color.setHex(0xfed7aa);
          rayMat.opacity = 0.05;
          spindriftMat.opacity = 0.25;
          auroraRibbons.forEach(m => { m.uniforms.u_globalOpacity.value = 0.05; });
          break;
        case 'winter': // Polar Night / No Sun
          starMat.opacity = 0.95;
          snowMat.opacity = 0.25;
          rainMat.opacity = 0.0;
          haloMat.opacity = 0.0;
          sunDogMat.opacity = 0.0;
          smokeMat.opacity = 0.34; // Deep frost smoke over freezing sea
          cloudMat.color.setHex(0x064e3b);
          cloudMat.opacity = 0.26;
          rayMat.opacity = 0.0;
          spindriftMat.opacity = 0.20;
          auroraRibbons.forEach(m => { m.uniforms.u_globalOpacity.value = 1.0; });
          break;
        case 'autumn': // Gale-force Blizzard & Snow Flurries
          starMat.opacity = 0.15;
          snowMat.opacity = 0.85;
          rainMat.opacity = 0.0;
          haloMat.opacity = 0.12;
          sunDogMat.opacity = 0.22;
          smokeMat.opacity = 0.38; // Dense freeze-up steam fog
          cloudMat.color.setHex(0x475569);
          cloudMat.opacity = 0.82;
          rayMat.opacity = 0.0;
          spindriftMat.opacity = 0.65; // Gale spindrift spray
          auroraRibbons.forEach(m => { m.uniforms.u_globalOpacity.value = 0.1; });
          break;
        case 'spring': // Austral Spring Thaw & Sleet
          starMat.opacity = 0.45;
          snowMat.opacity = 0.15;
          rainMat.opacity = 0.65;
          haloMat.opacity = 0.20;
          sunDogMat.opacity = 0.35;
          smokeMat.opacity = 0.25;
          cloudMat.color.setHex(0xbae6fd);
          cloudMat.opacity = 0.50;
          rayMat.color.setHex(0xfef9c3);
          rayMat.opacity = 0.20;
          spindriftMat.opacity = 0.35;
          auroraRibbons.forEach(m => { m.uniforms.u_globalOpacity.value = 0.35; });
          break;
        default:
          break;
      }
    },
    update: (time) => {
      // Wave Aurora ribbons
      auroraRibbons.forEach(mat => {
        mat.uniforms.u_time.value = time;
      });

      // Slowly drift horizon stratus cloud deck
      cloudMesh.rotation.y = time * 0.003;

      // Animate Blizzard Snow Particles
      if (snowMat.opacity > 0.02) {
        const positions = snowGeo.attributes.position.array;
        for (let i = 0; i < snowCount; i++) {
          positions[i * 3] += snowVelocities[i].x * (currentSeason === 'autumn' ? 1.8 : 0.8);
          positions[i * 3 + 1] += snowVelocities[i].y * (currentSeason === 'autumn' ? 1.5 : 0.7);
          positions[i * 3 + 2] += snowVelocities[i].z;

          // Wrap around volume bounds
          if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 45;
          if (positions[i * 3] < -60) positions[i * 3] = 60;
          if (positions[i * 3] > 60) positions[i * 3] = -60;
        }
        snowGeo.attributes.position.needsUpdate = true;
      }

      // Animate Polar Sleet Rain Streaks
      if (rainMat.opacity > 0.02) {
        const rPositions = rainGeo.attributes.position.array;
        for (let i = 0; i < rainCount; i++) {
          rPositions[i * 6 + 1] -= 1.8;
          rPositions[i * 6 + 4] -= 1.8;
          rPositions[i * 6] -= 0.3;
          rPositions[i * 6 + 3] -= 0.3;

          if (rPositions[i * 6 + 1] < 0) {
            const rx = (Math.random() - 0.5) * 100;
            const rz = (Math.random() - 0.5) * 100;
            rPositions[i * 6] = rx;
            rPositions[i * 6 + 1] = 40;
            rPositions[i * 6 + 2] = rz;
            rPositions[i * 6 + 3] = rx - 0.3;
            rPositions[i * 6 + 4] = 38.8;
            rPositions[i * 6 + 5] = rz;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Animate Arctic Sea Smoke (Frost Smoke) Drifting in Ocean Troughs
      if (smokeMat.opacity > 0.02) {
        const smPos = smokeGeo.attributes.position.array;
        for (let i = 0; i < smokeCount; i++) {
          smPos[i * 3] += smokeVel[i].vx * 0.45;
          smPos[i * 3 + 2] += smokeVel[i].vz * 0.45;
          // Curling vertical heave in troughs
          smPos[i * 3 + 1] = 0.22 + Math.sin(time * 1.8 + smokeVel[i].phase) * 0.22;

          if (smPos[i * 3] > 60) smPos[i * 3] = -60;
          if (smPos[i * 3 + 2] > 60) smPos[i * 3 + 2] = -60;
        }
        smokeGeo.attributes.position.needsUpdate = true;
      }

      // Animate Waterline Spindrift Spray along wind vector
      if (spindriftMat.opacity > 0.02) {
        const sPos = spindriftGeo.attributes.position.array;
        for (let s = 0; s < spindriftCount; s++) {
          sPos[s * 3] += spindriftVel[s].vx;
          sPos[s * 3 + 1] += spindriftVel[s].vy;
          sPos[s * 3 + 2] += spindriftVel[s].vz;

          if (sPos[s * 3] > 40) sPos[s * 3] = -40;
          if (sPos[s * 3 + 2] > 40) sPos[s * 3 + 2] = -40;
          if (sPos[s * 3 + 1] < 0.1 || sPos[s * 3 + 1] > 1.8) {
            sPos[s * 3 + 1] = 0.2 + Math.random() * 0.6;
          }
        }
        spindriftGeo.attributes.position.needsUpdate = true;
      }
    }
  };
}
