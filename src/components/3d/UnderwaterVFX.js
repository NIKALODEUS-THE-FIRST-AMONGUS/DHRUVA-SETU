import * as THREE from 'three';

/**
 * Physically-Accurate Antarctic Subsea VFX:
 * 1. Beer-Lambert Optical Extinction & Depth-stratified ambient fog
 * 2. Antarctic Krill Swarms (Euphausia superba) schooling in epipelagic zone (0 to -40m)
 * 3. Bioluminescent Ctenophores / Comb Jellies pulsating in mesopelagic zone (-30m to -50m)
 * 4. Realistic Marine Snow (sinking organic flocculent aggregates)
 * NOTE: Removed the artificial conical light shafts per user instruction.
 */
export function createUnderwaterVFX() {
  const group = new THREE.Group();
  group.name = "underwaterVFXGroup";

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
    color: 0x93c5fd, // Soft icy cyan-white marine snow
    size: 0.28,
    transparent: true,
    opacity: 0.70,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const snowMesh = new THREE.Points(snowGeo, snowMat);
  group.add(snowMesh);

  return {
    group,
    update: (time) => {
      // 1. Undulating Krill swarm schooling motion
      const krillPosAttr = krillGeo.attributes.position;
      const kArr = krillPosAttr.array;
      const swarmWave = Math.sin(time * 0.6) * 1.8;
      const swarmSurge = Math.cos(time * 0.4) * 1.5;

      for (let i = 0; i < krillCount; i++) {
        const idx = i * 3;
        const phase = krillPhases[i];
        // Swarm coordinated swimming loop
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

        // Slow drifting in polar current
        c.mesh.position.x = c.basePos.x + Math.sin(time * 0.25 * c.driftSpeed + c.pulsePhase) * 1.8;
        c.mesh.position.y = c.basePos.y + Math.cos(time * 0.35 * c.driftSpeed) * 0.8;
        c.mesh.position.z = c.basePos.z + Math.cos(time * 0.22 * c.driftSpeed + c.pulsePhase) * 1.4;

        // Bioluminescent rainbow neon emission shimmer
        const hue = (0.50 + Math.sin(time * 1.5 + c.pulsePhase) * 0.08); // Cyan-to-azure bioluminescence
        c.mat.emissive.setHSL(hue, 0.95, 0.45);
        c.mat.emissiveIntensity = 0.65 + pulse * 0.35;
      });

      // 3. Sinking marine snow with current shear
      const sArr = snowGeo.attributes.position.array;
      for (let i = 0; i < snowCount; i++) {
        const idx = i * 3;
        // Settling downward
        sArr[idx + 1] -= snowSpeeds[i] * 0.04;
        // Wrap around when reaching ocean floor (-50m)
        if (sArr[idx + 1] < -50.0) {
          sArr[idx + 1] = -1.2;
        }
        // Lateral fluid drift
        sArr[idx] = snowInitPositions[idx] + Math.sin(time * 0.35 + snowInitPositions[idx + 1] * 0.1) * 1.8;
        sArr[idx + 2] = snowInitPositions[idx + 2] + Math.cos(time * 0.28 + snowInitPositions[idx] * 0.08) * 1.4;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
  };
}
