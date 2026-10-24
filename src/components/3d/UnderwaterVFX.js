import * as THREE from 'three';

/**
 * Physically-Accurate Antarctic Subsea VFX:
 * 1. Beer-Lambert Optical Extinction & Depth-stratified ambient fog
 * 2. Antarctic Krill Swarms (Euphausia superba) schooling in epipelagic zone (0 to -40m)
 * 3. Bioluminescent Ctenophores / Comb Jellies pulsating in mesopelagic zone (-30m to -50m)
 * 4. Realistic Marine Snow (sinking organic flocculent aggregates)
 * NOTE: Removed the artificial conical light shafts per user instruction.
 */
// Procedural soft circular texture for subsea point particles
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

export function createUnderwaterVFX() {
  const group = new THREE.Group();
  group.name = "underwaterVFXGroup";
  const particleCircleTex = createParticleCircleTexture();

  // 1. Antarctic Krill Swarm (Euphausia superba)
  // 450 individuals schooling with collective undulating fluid motion
  const krillCount = 450;
  const krillGeo = new THREE.BufferGeometry();
  const krillPos = new Float32Array(krillCount * 3);
  const krillOffsets = new Float32Array(krillCount * 3);
  const krillPhases = new Float32Array(krillCount);

  for (let i = 0; i < krillCount; i++) {
    // Schooling cluster centered around -15m to -35m depth
    const angle = Math.random() * Math.PI * 2;
    const rad = 4.0 + Math.random() * 14.0;
    const kx = Math.cos(angle) * rad;
    const ky = -12.0 - Math.random() * 26.0;
    const kz = Math.sin(angle) * rad;

    krillPos[i * 3] = kx;
    krillPos[i * 3 + 1] = ky;
    krillPos[i * 3 + 2] = kz;

    krillOffsets[i * 3] = kx;
    krillOffsets[i * 3 + 1] = ky;
    krillOffsets[i * 3 + 2] = kz;

    krillPhases[i] = Math.random() * Math.PI * 2;
  }

  krillGeo.setAttribute('position', new THREE.BufferAttribute(krillPos, 3));

  // Translucent pinkish-amber chitinous krill with bioluminescent photophore spots
  const krillMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0xfb923c, // Antarctic krill orange/pink carotenoid pigmentation
    size: 0.45,
    transparent: true,
    opacity: 0.85,
    blending: THREE.NormalBlending,
    depthWrite: false
  });

  const krillMesh = new THREE.Points(krillGeo, krillMat);
  group.add(krillMesh);

  // 2. Bioluminescent Comb Jellies / Ctenophores (Beroe cucumis & Mertensia ovum)
  // Translucent bell bodies with iridescent neon cilia bands
  const ctenoCount = 18;
  const ctenoMeshes = [];
  const ctenoGroup = new THREE.Group();

  const ctenoGeo = new THREE.SphereGeometry(0.35, 12, 10);
  ctenoGeo.scale(1.0, 1.45, 1.0); // Ovoid lobate comb jelly morphology

  for (let ci = 0; ci < ctenoCount; ci++) {
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.1
    });

    const cMesh = new THREE.Mesh(ctenoGeo, cMat);
    const angle = (ci / ctenoCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 8.0 + Math.random() * 18.0;
    const depth = -22.0 - Math.random() * 24.0; // Inhabits pycnocline twilight layer

    cMesh.position.set(Math.cos(angle) * dist, depth, Math.sin(angle) * dist);
    cMesh.rotation.z = (Math.random() - 0.5) * 0.4;

    ctenoGroup.add(cMesh);
    ctenoMeshes.push({
      mesh: cMesh,
      mat: cMat,
      basePos: cMesh.position.clone(),
      pulsePhase: Math.random() * Math.PI * 2,
      driftSpeed: 0.35 + Math.random() * 0.3
    });
  }
  group.add(ctenoGroup);

  // 3. Deep Marine Snow (Organic detritus aggregates drifting and slowly sinking)
  const snowCount = 2200;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(snowCount * 3);
  const snowInitPositions = new Float32Array(snowCount * 3);
  const snowSpeeds = new Float32Array(snowCount);

  for (let i = 0; i < snowCount; i++) {
    const x = (Math.random() - 0.5) * 90;
    const y = -1.0 - Math.random() * 52;
    const z = (Math.random() - 0.5) * 90;

    snowPositions[i * 3] = x;
    snowPositions[i * 3 + 1] = y;
    snowPositions[i * 3 + 2] = z;

    snowInitPositions[i * 3] = x;
    snowInitPositions[i * 3 + 1] = y;
    snowInitPositions[i * 3 + 2] = z;

    snowSpeeds[i] = 0.25 + Math.random() * 0.45; // Slow settling velocity in cold polar water
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

  const snowMat = new THREE.PointsMaterial({
    map: particleCircleTex,
    color: 0x93c5fd, // Soft icy cyan-white marine snow
    size: 0.28,
    transparent: true,
    opacity: 0.70,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const snowMesh = new THREE.Points(snowGeo, snowMat);
  group.add(snowMesh);

  // 4. Antarctic Pycnocline / Halocline Density Interface (-22m)
  // Physical boundary layer separating fresh polar surface water from deep high-salinity shelf water
  const haloclineGeo = new THREE.PlaneGeometry(160, 160, 24, 24);
  haloclineGeo.rotateX(-Math.PI / 2);
  const haloclineMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const haloclineMesh = new THREE.Mesh(haloclineGeo, haloclineMat);
  haloclineMesh.position.y = -22.0;
  group.add(haloclineMesh);

  // 5. Volumetric Underwater Caustic God Rays (Sunlight shafts refracting through Snell's window)
  const godRayGroup = new THREE.Group();
  const rayCount = 8;
  const rayMeshes = [];
  // Refracted polar sun vector in seawater: ~46° from vertical
  const refrDir = new THREE.Vector3(0.48, -0.72, 0.50).normalize();

  const rayGeo = new THREE.CylinderGeometry(0.35, 4.8, 32, 10, 1, true);
  rayGeo.translate(0, -16, 0); // Origin at waterline (y = 0)

  // Soft vertical gradient canvas texture for god rays
  const rayCanvas = document.createElement('canvas');
  rayCanvas.width = 64;
  rayCanvas.height = 256;
  const rCtx = rayCanvas.getContext('2d');
  const rGrad = rCtx.createLinearGradient(0, 0, 0, 256);
  rGrad.addColorStop(0.0, 'rgba(125, 211, 252, 0.55)');
  rGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.40)');
  rGrad.addColorStop(0.65, 'rgba(14, 165, 233, 0.18)');
  rGrad.addColorStop(1.0, 'rgba(2, 132, 199, 0.0)');
  rCtx.fillStyle = rGrad;
  rCtx.fillRect(0, 0, 64, 256);
  const rayTex = new THREE.CanvasTexture(rayCanvas);
  rayTex.needsUpdate = true;

  for (let ri = 0; ri < rayCount; ri++) {
    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTex,
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    // Disperse shafts across the buoy and CTD operating envelope
    const rDist = 2.0 + (ri / rayCount) * 14.0;
    const rAngle = (ri / rayCount) * Math.PI * 2 + Math.random() * 0.4;
    rayMesh.position.set(Math.cos(rAngle) * rDist, 0, Math.sin(rAngle) * rDist);

    // Align shaft axis along the refracted sun direction
    const rayAxis = refrDir.clone();
    rayMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), rayAxis);

    // Random scale variation
    rayMesh.scale.set(0.7 + Math.random() * 0.6, 1.0, 0.7 + Math.random() * 0.6);

    godRayGroup.add(rayMesh);
    rayMeshes.push({
      mesh: rayMesh,
      mat: rayMat,
      phase: Math.random() * Math.PI * 2,
      baseOpacity: 0.08 + Math.random() * 0.08,
      speed: 0.8 + Math.random() * 0.6
    });
  }
  group.add(godRayGroup);

  return {
    group,
    update: (time, delta = 0.016, buoyPos = null, current = null, camY = 1.0) => {
      // God rays only visible when camera is submerged below waterline
      godRayGroup.visible = (camY < -0.15);

      if (buoyPos && typeof buoyPos === 'object' && buoyPos.x !== undefined) {
        group.position.x = buoyPos.x;
        group.position.z = buoyPos.z;
      }

      const curX = current ? current.x : -0.10;
      const curZ = current ? current.z : 0.0;

      // Internal solitary wave oscillation along halocline pycnocline
      haloclineMesh.position.y = -22.0 + Math.sin(time * 0.45) * 0.28;

      // 1. Undulating Krill swarm schooling motion
      const krillPosAttr = krillGeo.attributes.position;
      const kArr = krillPosAttr.array;
      const swarmWave = Math.sin(time * 0.6) * 1.8 + curX * 4.0;
      const swarmSurge = Math.cos(time * 0.4) * 1.5 + curZ * 4.0;

      for (let i = 0; i < krillCount; i++) {
        const idx = i * 3;
        const phase = krillPhases[i];
        // Swarm coordinated swimming loop aligned with water mass
        kArr[idx] = krillOffsets[idx] + swarmWave + Math.sin(time * 1.2 + phase) * 0.6;
        kArr[idx + 1] = krillOffsets[idx + 1] + Math.sin(time * 0.8 + phase) * 0.5;
        kArr[idx + 2] = krillOffsets[idx + 2] + swarmSurge + Math.cos(time * 1.1 + phase) * 0.6;
      }
      krillPosAttr.needsUpdate = true;

      // 2. Comb Jelly pulsating contractions & iridescent bioluminescence
      ctenoMeshes.forEach(c => {
        const pulse = Math.sin(time * 2.2 + c.pulsePhase);
        const scaleY = 1.0 + pulse * 0.15;
        const scaleXZ = 1.0 - pulse * 0.08;
        c.mesh.scale.set(scaleXZ, scaleY * 1.45, scaleXZ);

        // Drifting with regional polar current
        c.mesh.position.x = c.basePos.x + (curX * 6.0) + Math.sin(time * 0.25 * c.driftSpeed + c.pulsePhase) * 1.8;
        c.mesh.position.y = c.basePos.y + Math.cos(time * 0.35 * c.driftSpeed) * 0.8;
        c.mesh.position.z = c.basePos.z + (curZ * 6.0) + Math.cos(time * 0.22 * c.driftSpeed + c.pulsePhase) * 1.4;

        // Bioluminescent rainbow neon emission shimmer
        const hue = (0.50 + Math.sin(time * 1.5 + c.pulsePhase) * 0.08); // Cyan-to-azure bioluminescence
        c.mat.emissive.setHSL(hue, 0.95, 0.45);
        c.mat.emissiveIntensity = 0.65 + pulse * 0.35;
      });

      // 3. Sinking marine snow with depth-dependent current shear
      const sArr = snowGeo.attributes.position.array;
      for (let i = 0; i < snowCount; i++) {
        const idx = i * 3;
        // Settling downward
        sArr[idx + 1] -= snowSpeeds[i] * 0.04;
        // Wrap around when reaching ocean floor (-50m)
        if (sArr[idx + 1] < -50.0) {
          sArr[idx + 1] = -1.2;
        }
        // Lateral fluid drift with vertical velocity shear (strongest near surface)
        const depthShear = Math.max(0.25, (50.0 + sArr[idx + 1]) / 50.0);
        sArr[idx] = snowInitPositions[idx] + (curX * 10.0 * depthShear) + Math.sin(time * 0.35 + snowInitPositions[idx + 1] * 0.1) * 1.6;
        sArr[idx + 2] = snowInitPositions[idx + 2] + (curZ * 10.0 * depthShear) + Math.cos(time * 0.28 + snowInitPositions[idx] * 0.08) * 1.2;
      }
      snowGeo.attributes.position.needsUpdate = true;

      // 4. Volumetric underwater god rays caustic shimmering
      rayMeshes.forEach(r => {
        const causticFlicker = Math.sin(time * 2.2 * r.speed + r.phase) * 0.35 +
                               Math.cos(time * 3.8 * r.speed + r.phase * 1.5) * 0.20;
        r.mat.opacity = THREE.MathUtils.clamp(r.baseOpacity + causticFlicker * 0.05, 0.02, 0.24);
      });
    }
  };
}
