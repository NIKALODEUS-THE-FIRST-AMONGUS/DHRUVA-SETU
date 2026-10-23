import * as THREE from 'three';
import { generateIceFractureMap } from './ProceduralTextures';

/**
 * Marginal Ice Zone (MIZ) Sea Ice Floes
 * Recreates authentic Antarctic pancake ice floes, drifting pack ice slabs,
 * and slushy ice rims characteristic of Prydz Bay and Southern Ocean marginal zones.
 * Each floe bobs and tilts with the local ocean wave displacement.
 */
export function createSeaIceFloes(ocean) {
  const group = new THREE.Group();
  group.name = "seaIceFloesGroup";

  const iceFractureMap = generateIceFractureMap();

  // 1. Translucent Pancake Ice Material with Volume Absorption & Glacial Sheen
  const floeIceMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    emissive: 0x0284c7,
    emissiveIntensity: 0.18,
    roughness: 0.14,
    metalness: 0.02,
    transmission: 0.62,
    ior: 1.31,
    thickness: 2.2,
    attenuationColor: new THREE.Color(0x38bdf8),
    attenuationDistance: 1.8,
    normalMap: iceFractureMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    specularIntensity: 1.0,
    specularColor: 0xffffff,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08
  });

  // 2. High-Albedo Antarctic Fresh Snow Cap
  const snowCapMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.94,
    metalness: 0.01,
    flatShading: false
  });

  // 3. Submerged Ice Keel Material (deep cyan glacial ice absorption)
  const keelMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.28,
    metalness: 0.02,
    transmission: 0.55,
    thickness: 3.5,
    attenuationColor: new THREE.Color(0x0369a1),
    attenuationDistance: 1.5,
    transparent: true,
    opacity: 0.85
  });

  // 4. Upturned Slushy Ice Rims (formed by pancake floe edge-to-edge wave collisions)
  const slushRimMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.95,
    metalness: 0.02
  });

  // 5. Surrounding Frazil Ice Crystal Slush Halo
  const frazilHaloMat = new THREE.MeshBasicMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  // Helper: create irregular rounded pancake ice disc geometry
  function createPancakeGeometry(radius, segments = 16) {
    const shape = new THREE.Shape();
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Irregular natural contour variation
      const noise = 1.0 + Math.sin(theta * 3.0) * 0.12 + Math.cos(theta * 5.0) * 0.08;
      const r = radius * noise;
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      pts.push(new THREE.Vector2(px, py));
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.22,
      bevelThickness: 0.18
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0.08, 0); // Center slightly above waterline
    return geo;
  }

  // Floe configurations distributed around the buoy and sensor zone (maintained >28m from center so no plates clip overhead underwater)
  const floeConfigs = [
    { x: -32.0, z: -28.0, radius: 5.5, rotSpeed: 0.015, scale: 1.1 },
    { x: 30.0,  z: -32.0, radius: 5.8, rotSpeed: -0.012, scale: 1.1 },
    { x: -36.0, z: 22.0,  radius: 6.2, rotSpeed: 0.010, scale: 1.25 },
    { x: 34.0,  z: 26.0,  radius: 5.2, rotSpeed: -0.018, scale: 1.05 },
    { x: 28.0,  z: -28.0, radius: 5.8, rotSpeed: 0.008, scale: 1.15 },
    { x: -38.0, z: -35.0, radius: 8.5, rotSpeed: -0.006, scale: 1.4 },
    { x: 38.0,  z: 28.0,  radius: 7.2, rotSpeed: 0.009, scale: 1.3 },
    { x: -26.0, z: 36.0,  radius: 6.0, rotSpeed: -0.014, scale: 1.1 },
    { x: 28.0,  z: 38.0,  radius: 5.2, rotSpeed: 0.011, scale: 1.0 },
    { x: -42.0, z: 6.0,   radius: 7.8, rotSpeed: 0.007, scale: 1.3 },
    { x: 44.0,  z: -24.0, radius: 6.8, rotSpeed: -0.009, scale: 1.2 },
    { x: -18.0, z: -42.0, radius: 4.5, rotSpeed: 0.016, scale: 0.95 },
    { x: -30.0, z: -55.0, radius: 9.2, rotSpeed: 0.005, scale: 1.5 },
    { x: 32.0,  z: -50.0, radius: 8.0, rotSpeed: -0.006, scale: 1.35 },
    { x: 52.0,  z: 12.0,  radius: 7.5, rotSpeed: 0.008, scale: 1.25 },
    { x: -55.0, z: 32.0,  radius: 8.8, rotSpeed: -0.005, scale: 1.45 },
    { x: 0.0,   z: 55.0,  radius: 6.5, rotSpeed: 0.012, scale: 1.15 }
  ];

  const floeMeshes = [];

  floeConfigs.forEach((cfg, idx) => {
    const floeGroup = new THREE.Group();
    floeGroup.position.set(cfg.x, 0, cfg.z);

    // 1. Pancake ice disc (upper visible body with natural bevel)
    const discGeo = createPancakeGeometry(cfg.radius);
    const discMesh = new THREE.Mesh(discGeo, floeIceMat);
    discMesh.castShadow = true;
    discMesh.receiveShadow = true;
    floeGroup.add(discMesh);

    // 2. Snow cap layer on top (with slight elevation and soft white bevel)
    const capShape = new THREE.CircleGeometry(cfg.radius * 0.78, 16);
    capShape.rotateX(-Math.PI / 2);
    const capMesh = new THREE.Mesh(capShape, snowCapMat);
    capMesh.position.y = 0.38;
    capMesh.receiveShadow = true;
    floeGroup.add(capMesh);

    // 3. Submerged Ice Keel / Brine pocket under waterline (soft glacial blue absorption)
    const keelGeo = new THREE.CylinderGeometry(cfg.radius * 0.88, cfg.radius * 0.5, 1.2, 12);
    const keelMesh = new THREE.Mesh(keelGeo, keelMat);
    keelMesh.position.y = -0.65;
    floeGroup.add(keelMesh);

    // 4. Raised Upturned Slush Rim (Pancake ice morphology)
    const rimGeo = new THREE.TorusGeometry(cfg.radius * 0.96, 0.22, 6, 20);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, slushRimMat);
    rimMesh.position.y = 0.32;
    rimMesh.receiveShadow = true;
    floeGroup.add(rimMesh);

    // 5. Translucent Frazil Ice Slush Halo on Water Surface
    const haloGeo = new THREE.RingGeometry(cfg.radius * 0.90, cfg.radius * 1.32, 24);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMesh = new THREE.Mesh(haloGeo, frazilHaloMat);
    haloMesh.position.y = 0.03;
    floeGroup.add(haloMesh);

    floeGroup.scale.setScalar(cfg.scale);

    group.add(floeGroup);

    floeMeshes.push({
      group: floeGroup,
      baseX: cfg.x,
      baseZ: cfg.z,
      radius: cfg.radius,
      rotSpeed: cfg.rotSpeed,
      phase: idx * 0.73,
      active: true
    });
  });

  let currentDensity = 1.0;

  return {
    group,
    setDensity: (density) => {
      currentDensity = Math.max(0.0, Math.min(1.0, density));
      const activeCount = Math.floor(floeMeshes.length * currentDensity);
      floeMeshes.forEach((item, i) => {
        item.group.visible = i < activeCount;
      });
    },
    update: (time, currentData = null) => {
      const iceDrift = (currentData && currentData.iceDrift)
        ? currentData.iceDrift
        : { x: -0.09, z: 0.01 };

      floeMeshes.forEach(item => {
        if (!item.group.visible) return;

        // Floes drift with a mix of ocean current (85%) and surface wind drag (15%),
        // with individual hydrodynamic variation per floe size and draft
        const floeDragFactor = 0.85 + Math.sin(item.phase) * 0.3;
        const driftX = (iceDrift.x * 14.0 * floeDragFactor) + Math.sin(time * 0.09 + item.phase) * 1.2;
        const driftZ = (iceDrift.z * 14.0 * floeDragFactor) + Math.cos(time * 0.07 + item.phase * 1.3) * 1.0;
        const posX = item.baseX + driftX;
        const posZ = item.baseZ + driftZ;

        // Local wave elevation at floe center with authentic positive ice buoyancy
        const waveH = ocean.getWaveHeight(posX, posZ);
        item.group.position.set(posX, waveH + 0.16, posZ);

        // Wave slope pitch and roll
        const waveSlopeX = (ocean.getWaveHeight(posX + 1.0, posZ) - ocean.getWaveHeight(posX - 1.0, posZ)) * 0.5;
        const waveSlopeZ = (ocean.getWaveHeight(posX, posZ + 1.0) - ocean.getWaveHeight(posX, posZ - 1.0)) * 0.5;

        item.group.rotation.x = -waveSlopeZ * 0.75;
        item.group.rotation.z = waveSlopeX * 0.75;
        item.group.rotation.y += item.rotSpeed * 0.015;
      });
    }
  };
}
