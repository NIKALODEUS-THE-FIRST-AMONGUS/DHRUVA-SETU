import * as THREE from 'three';
import { generateIceFractureMap } from './ProceduralTextures';

/**
 * Procedural Polar Glacier Icebergs
 * Features translucent glacier ice shader with subsurface scattering,
 * procedural internal ice fracture normal maps, frosted snow tops,
 * and massive submerged blue ice keels.
 */
export function createPolarGlaciers() {
  const group = new THREE.Group();
  group.name = "polarGlaciersGroup";

  const iceFractureMap = generateIceFractureMap();

  // Translucent glacier ice material with internal fracture veins
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    emissive: 0x0c2540,
    emissiveIntensity: 0.18,
    roughness: 0.20,
    metalness: 0.05,
    transmission: 0.58,
    ior: 1.31, // Ice refractive index
    thickness: 2.2,
    normalMap: iceFractureMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    specularIntensity: 1.0,
    specularColor: 0xffffff,
    flatShading: true
  });

  // Frosted snow cap material
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true
  });

  const icebergConfigs = [
    { radius: 14, height: 20, angle: 0.4, dist: 95 },
    { radius: 18, height: 26, angle: 1.1, dist: 125 },
    { radius: 12, height: 16, angle: 1.8, dist: 105 },
    { radius: 22, height: 32, angle: 2.5, dist: 140 },
    { radius: 15, height: 22, angle: 3.3, dist: 110 },
    { radius: 20, height: 28, angle: 4.1, dist: 130 },
    { radius: 13, height: 18, angle: 4.9, dist: 100 },
    { radius: 16, height: 24, angle: 5.7, dist: 118 }
  ];

  const bergs = [];

  icebergConfigs.forEach((cfg) => {
    const bergGroup = new THREE.Group();

    // 1. Above-water visible pinnacle
    const topGeo = new THREE.ConeGeometry(cfg.radius, cfg.height, 7, 3);
    const topMesh = new THREE.Mesh(topGeo, iceMat);
    topMesh.position.y = cfg.height * 0.35 - 1.0;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    bergGroup.add(topMesh);

    // 2. Snow crest cap
    const capGeo = new THREE.ConeGeometry(cfg.radius * 0.6, cfg.height * 0.4, 7);
    const capMesh = new THREE.Mesh(capGeo, snowMat);
    capMesh.position.y = cfg.height * 0.65;
    bergGroup.add(capMesh);

    // 3. Massive Submerged Ice Keel
    const keelGeo = new THREE.ConeGeometry(cfg.radius * 1.35, cfg.height * 1.4, 7);
    keelGeo.rotateX(Math.PI);
    const keelMesh = new THREE.Mesh(keelGeo, iceMat);
    keelMesh.position.y = -cfg.height * 0.65;
    bergGroup.add(keelMesh);

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
