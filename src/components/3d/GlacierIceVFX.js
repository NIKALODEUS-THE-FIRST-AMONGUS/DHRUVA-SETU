import * as THREE from 'three';
import { generateIceFractureMap } from './ProceduralTextures';

/**
 * Authentic Antarctic Tabular & Weather-Calved Icebergs
 * Features:
 * 1. Realistic tabular ice shelf calvings with flat snow plateaus and sheer vertical compaction cliffs
 * 2. Weather-carved pinnacle bergs with waterline wave-cut erosion notches
 * 3. Translucent glacial compaction ice material with subsurface scattering & internal fracture normal maps
 * 4. Massive submerged ice keels displaying deep cyan optical absorption
 */
export function createPolarGlaciers() {
  const group = new THREE.Group();
  group.name = "polarGlaciersGroup";

  const iceFractureMap = generateIceFractureMap();

  // Translucent deep compaction glacial ice material with volume absorption (no fake emissive glow)
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xecfeff,
    roughness: 0.24,
    metalness: 0.01,
    transmission: 0.35,
    ior: 1.31, // Polar ice refractive index
    thickness: 4.8,
    attenuationColor: new THREE.Color(0x0284c7), // Cyan glacial absorption
    attenuationDistance: 3.2,
    normalMap: iceFractureMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    specularIntensity: 0.9,
    clearcoat: 0.45,
    clearcoatRoughness: 0.16,
    flatShading: false
  });

  // Wind-packed Antarctic firn snow plateau material
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.92,
    metalness: 0.01,
    flatShading: false
  });

  // Deep underwater glacial ice keel (cyan volume absorption)
  const keelMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.32,
    metalness: 0.01,
    transmission: 0.42,
    thickness: 6.0,
    attenuationColor: new THREE.Color(0x0369a1),
    attenuationDistance: 2.6,
    transparent: true,
    opacity: 0.82,
    flatShading: false
  });

  // Helper: Create authentic tabular berg with irregular cliff perimeter
  function createTabularBergGeometry(width, length, height) {
    const shape = new THREE.Shape();
    const segments = 36;
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Multi-harmonic cleaved ice shelf perimeter
      const noise = 1.0 +
        Math.sin(theta * 2.0) * 0.12 +
        Math.cos(theta * 5.0) * 0.06 +
        Math.sin(theta * 11.0) * 0.025;
      const x = Math.cos(theta) * (width * 0.5) * noise;
      const y = Math.sin(theta) * (length * 0.5) * noise;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 2,
      bevelSize: 1.4,
      bevelThickness: 1.0
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(Math.PI / 2);
    geo.center();
    return geo;
  }

  // Helper: Create weathered pinnacle berg with natural wind/wave-cut striations
  function createPinnacleGeometry(radius, height) {
    const geo = new THREE.CylinderGeometry(radius * 0.28, radius, height, 28, 8);
    // Perturb vertices for organic weathered cleavage
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const factor = 1.0 - (y / height);
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const perturbation =
        (Math.sin(angle * 3.0 + y * 0.25) * 1.5 +
         Math.sin(angle * 7.0 - y * 0.15) * 0.6) * factor;
      pos.setX(i, pos.getX(i) + perturbation);
      pos.setZ(i, pos.getZ(i) + perturbation * 0.7);
    }
    geo.computeVertexNormals();
    return geo;
  }

  const icebergConfigs = [
    { type: 'tabular', width: 36, length: 24, height: 16, angle: 0.4, dist: 105 },
    { type: 'pinnacle', radius: 18, height: 28, angle: 1.15, dist: 135 },
    { type: 'tabular', width: 28, length: 20, height: 14, angle: 1.85, dist: 115 },
    { type: 'pinnacle', radius: 24, height: 36, angle: 2.55, dist: 155 },
    { type: 'tabular', width: 44, length: 30, height: 18, angle: 3.35, dist: 125 },
    { type: 'pinnacle', radius: 20, height: 30, angle: 4.15, dist: 140 },
    { type: 'tabular', width: 32, length: 22, height: 15, angle: 4.95, dist: 110 },
    { type: 'pinnacle', radius: 18, height: 26, angle: 5.75, dist: 128 }
  ];

  const bergs = [];

  icebergConfigs.forEach((cfg) => {
    const bergGroup = new THREE.Group();

    if (cfg.type === 'tabular') {
      // 1. Tabular sheer ice cliff body
      const cliffGeo = createTabularBergGeometry(cfg.width, cfg.length, cfg.height);
      const cliffMesh = new THREE.Mesh(cliffGeo, iceMat);
      cliffMesh.position.y = cfg.height * 0.42;
      cliffMesh.castShadow = true;
      cliffMesh.receiveShadow = true;
      bergGroup.add(cliffMesh);

      // 2. Snow plateau cap
      const snowGeo = createTabularBergGeometry(cfg.width * 0.96, cfg.length * 0.96, 1.2);
      const snowMesh = new THREE.Mesh(snowGeo, snowMat);
      snowMesh.position.y = cfg.height * 0.92;
      snowMesh.receiveShadow = true;
      bergGroup.add(snowMesh);

      // 3. Submerged keel block
      const keelGeo = createTabularBergGeometry(cfg.width * 1.2, cfg.length * 1.2, cfg.height * 1.5);
      const keelMesh = new THREE.Mesh(keelGeo, keelMat);
      keelMesh.position.y = -cfg.height * 0.75;
      bergGroup.add(keelMesh);
    } else {
      // Pinnacle weather-sculpted berg
      const pinGeo = createPinnacleGeometry(cfg.radius, cfg.height);
      const pinMesh = new THREE.Mesh(pinGeo, iceMat);
      pinMesh.position.y = cfg.height * 0.45;
      pinMesh.castShadow = true;
      pinMesh.receiveShadow = true;
      bergGroup.add(pinMesh);

      // Pinnacle snow cap
      const capGeo = new THREE.ConeGeometry(cfg.radius * 0.45, cfg.height * 0.35, 8);
      const capMesh = new THREE.Mesh(capGeo, snowMat);
      capMesh.position.y = cfg.height * 0.82;
      bergGroup.add(capMesh);

      // Submerged pinnacle keel
      const keelGeo = new THREE.ConeGeometry(cfg.radius * 1.35, cfg.height * 1.2, 9);
      keelGeo.rotateX(Math.PI);
      const keelMesh = new THREE.Mesh(keelGeo, keelMat);
      keelMesh.position.y = -cfg.height * 0.60;
      bergGroup.add(keelMesh);
    }

    const x = Math.cos(cfg.angle) * cfg.dist;
    const z = Math.sin(cfg.angle) * cfg.dist;
    bergGroup.position.set(x, 0, z);
    bergGroup.rotation.y = Math.random() * Math.PI;

    group.add(bergGroup);
    bergs.push({ group: bergGroup, angle: cfg.angle, baseDist: cfg.dist });
  });

  group.setDistanceScale = (scale = 1.0) => {
    bergs.forEach(b => {
      const d = b.baseDist * scale;
      b.group.position.set(Math.cos(b.angle) * d, 0, Math.sin(b.angle) * d);
    });
  };

  return group;
}
