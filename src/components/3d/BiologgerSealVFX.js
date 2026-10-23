import * as THREE from 'three';
import { CONFIG } from '../../constants/config';
import { generateSealSkinBumpMap } from './ProceduralTextures';

/**
 * Natural Wild Antarctic Weddell Seal Pod & Opportunistic Telemetry Harvester
 * - Natural wild foraging behavior (not tamed or artificial)
 * - 4 distinct wild seals foraging at different ocean depths and trajectories
 * - Opportunistic telemetry: Buoy hydrophone automatically intercepts pings when seals enter ~800m proximity
 * - Dorsal LoRa tag bursts on breach/surfacing -> Uplinks through buoy to LEO satellites
 */
export function createBiologgerSeal(splashSystem) {
  const podGroup = new THREE.Group();
  podGroup.name = "wildSealPodRoot";

  const sealSkinBump = generateSealSkinBumpMap();

  // Seal Pod Configuration (4 wild Antarctic Weddell seals)
  const POD_MEMBERS = [
    {
      id: "WED-PRYDZ-42",
      role: "Lead Adult Cow",
      scale: 1.0,
      baseRadius: 22.0,
      radiusVar: 6.0,
      orbitSpeed: 0.16,
      orbitOffset: 0.0,
      depthMin: -16.0,
      depthMax: 0.2,
      depthFreq: 0.42,
      tagColor: 0xf97316 // International Safety Orange Tag
    },
    {
      id: "WED-PRYDZ-19",
      role: "Sub-Adult Forager",
      scale: 0.88,
      baseRadius: 30.0,
      radiusVar: 8.0,
      orbitSpeed: 0.22,
      orbitOffset: 1.9,
      depthMin: -26.0,
      depthMax: -6.0,
      depthFreq: 0.35,
      tagColor: 0x06b6d4 // Cyan Oceanic Tag
    },
    {
      id: "WED-PRYDZ-07",
      role: "Juvenile Surfacing Pup",
      scale: 0.72,
      baseRadius: 18.0,
      radiusVar: 4.5,
      orbitSpeed: 0.28,
      orbitOffset: 3.8,
      depthMin: -8.0,
      depthMax: 0.25,
      depthFreq: 0.58,
      tagColor: 0x10b981 // Emerald Marine Tag
    },
    {
      id: "WED-PRYDZ-88",
      role: "Benthic Deep Diver",
      scale: 1.08,
      baseRadius: 36.0,
      radiusVar: 9.0,
      orbitSpeed: 0.12,
      orbitOffset: 5.1,
      depthMin: -44.0,
      depthMax: -20.0,
      depthFreq: 0.24,
      tagColor: 0xa855f7 // Deep Purple Tag
    }
  ];

  // Shared Seal Lathe Anatomy Profile
  const points = [];
  points.push(new THREE.Vector2(0.04, 1.45));  // Snout
  points.push(new THREE.Vector2(0.18, 1.25));  // Head
  points.push(new THREE.Vector2(0.34, 0.95));  // Neck
  points.push(new THREE.Vector2(0.48, 0.50));  // Shoulder
  points.push(new THREE.Vector2(0.54, 0.00));  // Midriff
  points.push(new THREE.Vector2(0.46, -0.55)); // Lower belly
  points.push(new THREE.Vector2(0.32, -1.05)); // Flank
  points.push(new THREE.Vector2(0.16, -1.50)); // Tail base
  points.push(new THREE.Vector2(0.05, -1.80)); // Tail tip

  const latheGeo = new THREE.LatheGeometry(points, 24);
  const flipperGeo = new THREE.BoxGeometry(0.72, 0.06, 0.35);
  const flukeGeo = new THREE.BoxGeometry(0.52, 0.05, 0.26);

  function createSealMember(cfg) {
    const sealRoot = new THREE.Group();
    sealRoot.name = `seal_${cfg.id}`;
    sealRoot.scale.setScalar(cfg.scale);

    // Wet Mammal Skin Material
    const sealSkinMat = new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      roughness: 0.22,
      metalness: 0.12,
      bumpMap: sealSkinBump,
      bumpScale: 0.012,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15
    });

    const body = new THREE.Mesh(latheGeo, sealSkinMat);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    sealRoot.add(body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.05, metalness: 0.9 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.18, 0.16, 1.15);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.18, 0.16, 1.15);
    sealRoot.add(leftEye);
    sealRoot.add(rightEye);

    // Snout Whiskers (vibrissae)
    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, linewidth: 1 });
    for (let side = -1; side <= 1; side += 2) {
      for (let w = 0; w < 3; w++) {
        const wGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(side * 0.08, 0.02 + w * 0.02, 1.40),
          new THREE.Vector3(side * 0.26, -0.02 + w * 0.02, 1.30)
        ]);
        const whisker = new THREE.Line(wGeo, whiskerMat);
        sealRoot.add(whisker);
      }
    }

    // Flippers
    const flipperMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.1,
      bumpMap: sealSkinBump,
      bumpScale: 0.008,
      clearcoat: 0.6
    });

    const leftFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    leftFlipper.position.set(0.55, -0.08, 0.45);
    leftFlipper.rotation.y = 0.35;
    sealRoot.add(leftFlipper);

    const rightFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    rightFlipper.position.set(-0.55, -0.08, 0.45);
    rightFlipper.rotation.y = -0.35;
    sealRoot.add(rightFlipper);

    const leftFluke = new THREE.Mesh(flukeGeo, flipperMat);
    leftFluke.position.set(0.24, 0, -1.85);
    leftFluke.rotation.y = 0.25;
    sealRoot.add(leftFluke);

    const rightFluke = new THREE.Mesh(flukeGeo, flipperMat);
    rightFluke.position.set(-0.24, 0, -1.85);
    rightFluke.rotation.y = -0.25;
    sealRoot.add(rightFluke);

    // Dorsal Biologger Telemetry Tag
    const tagGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);
    const tagMat = new THREE.MeshStandardMaterial({
      color: cfg.tagColor,
      roughness: 0.3,
      metalness: 0.3
    });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.position.set(0, 0.58, 0.1);
    sealRoot.add(tagMesh);

    // Flexible LoRa Antenna Whip
    const antGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.36, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xffedd5, metalness: 0.9 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.set(0, 0.74, 0.2);
    ant.rotation.x = -0.2;
    sealRoot.add(ant);

    // Telemetry Status Indicator LED
    const tagLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const tagLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), tagLedMat);
    tagLed.position.set(0, 0.65, 0.0);
    sealRoot.add(tagLed);

    podGroup.add(sealRoot);

    return {
      cfg,
      sealRoot,
      tagMesh,
      tagLedMat,
      leftFlipper,
      rightFlipper,
      leftFluke,
      rightFluke,
      wasBreaching: false
    };
  }

  const seals = POD_MEMBERS.map(createSealMember);

  // Opportunistic Telemetry Hop Beam & RF Pulse Line
  const beamPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 10, 0)];
  const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
  const beamMat = new THREE.LineDashedMaterial({
    color: 0x34d399,
    dashSize: 1.2,
    gapSize: 0.6,
    linewidth: 3,
    transparent: true,
    opacity: 0.0
  });
  const signalBeam = new THREE.Line(beamGeo, beamMat);
  signalBeam.computeLineDistances();
  podGroup.add(signalBeam);

  const hopSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.0 })
  );
  podGroup.add(hopSphere);

  // Expose primary sealRoot for focal camera tracking
  const primarySeal = seals[0];

  return {
    sealRoot: primarySeal.sealRoot,
    podGroup,
    seals,
    tagMesh: primarySeal.tagMesh,
    signalBeam,
    hopSphere,
    update: (time, buoyWorldPos) => {
      let closestDist = Infinity;
      let activeOpportunisticSeal = null;
      let anyBreachingInProximity = false;

      // Update all seals in the wild foraging pod
      seals.forEach((s) => {
        const { cfg, sealRoot, tagLedMat, leftFlipper, rightFlipper, leftFluke, rightFluke } = s;

        // Independent foraging trajectory spline
        const pathAngle = time * cfg.orbitSpeed + cfg.orbitOffset;
        const pathRadius = cfg.baseRadius + Math.sin(time * 0.15 + cfg.orbitOffset) * cfg.radiusVar;

        const sx = Math.cos(pathAngle) * pathRadius;
        const sz = Math.sin(pathAngle) * pathRadius;

        // Natural vertical dive undulating pattern
        const divePhase = Math.sin(time * cfg.depthFreq + cfg.orbitOffset);
        let sy = cfg.depthMin + (divePhase + 1.0) * 0.5 * (cfg.depthMax - cfg.depthMin);

        // Natural surfacing behavior for breathing
        const isBreaching = cfg.depthMax >= 0 && sy > -1.2;
        if (isBreaching) {
          sy = 0.2 + Math.sin(time * 2.0) * 0.12;
        }

        sealRoot.position.set(sx, sy, sz);

        // Orient along tangent of swimming trajectory
        sealRoot.rotation.y = -pathAngle - Math.PI / 2;
        sealRoot.rotation.z = Math.sin(time * 3.0 + cfg.orbitOffset) * 0.08;
        sealRoot.rotation.x = isBreaching ? -0.08 : Math.cos(time * cfg.depthFreq + cfg.orbitOffset) * 0.18;

        // Kinematic flipper & fluke undulation
        const flukeWave = Math.sin(time * 5.0 + cfg.orbitOffset) * 0.35;
        leftFluke.rotation.y = 0.25 + flukeWave;
        rightFluke.rotation.y = -0.25 + flukeWave;

        const flipperWave = Math.sin(time * 3.5 + cfg.orbitOffset) * 0.15;
        leftFlipper.rotation.z = flipperWave;
        rightFlipper.rotation.z = -flipperWave;

        // Splash trigger on breaching surface
        if (splashSystem) {
          if (isBreaching && !s.wasBreaching) {
            splashSystem.triggerSplash(sx, sz);
          }
          if (!isBreaching && Math.random() < 0.25) {
            splashSystem.emitBubble(sx, sy, sz);
          }
        }
        s.wasBreaching = isBreaching;

        // Distance to Buoy (Opportunistic Detection Zone = 28m ~800m acoustic radius)
        const distToBuoy = Math.hypot(sx - buoyWorldPos.x, sz - buoyWorldPos.z);
        const inAcousticRange = distToBuoy < 28.0;

        if (distToBuoy < closestDist) {
          closestDist = distToBuoy;
          activeOpportunisticSeal = s;
        }

        if (inAcousticRange && isBreaching) {
          anyBreachingInProximity = true;
          tagLedMat.color.setHex(0x10b981); // Bright green LoRa burst
        } else if (inAcousticRange) {
          tagLedMat.color.setHex(0x38bdf8); // Cyan acoustic ping
        } else {
          tagLedMat.color.setHex(0x64748b); // Dormant tag beacon
        }

        s.currentDepth = -sy * (CONFIG.MAX_DEPTH_METERS / 45.0);
        s.distToBuoy = distToBuoy;
        s.inAcousticRange = inAcousticRange;
        s.isBreaching = isBreaching;
      });

      // Opportunistic Data Relay Beam to Buoy
      const lead = activeOpportunisticSeal || seals[0];
      const leadPos = lead.sealRoot.position;

      if (anyBreachingInProximity) {
        signalBeam.material.opacity = 0.95;
        hopSphere.material.opacity = 0.95;

        const hopT = (time * 2.2) % 1.0;
        const startPos = new THREE.Vector3(leadPos.x, leadPos.y + 0.6, leadPos.z);
        const endPos = new THREE.Vector3(buoyWorldPos.x, buoyWorldPos.y + CONFIG.BUOY_RADIUS_3D + 1.2, buoyWorldPos.z);
        hopSphere.position.lerpVectors(startPos, endPos, hopT);

        const positions = beamGeo.attributes.position.array;
        positions[0] = startPos.x;
        positions[1] = startPos.y;
        positions[2] = startPos.z;
        positions[3] = endPos.x;
        positions[4] = endPos.y;
        positions[5] = endPos.z;
        beamGeo.attributes.position.needsUpdate = true;
        signalBeam.computeLineDistances();
      } else {
        signalBeam.material.opacity = 0.0;
        hopSphere.material.opacity = 0.0;
      }

      return {
        isBreaching: anyBreachingInProximity || lead.isBreaching,
        inProximity: lead.inAcousticRange,
        activeSealTag: lead.cfg.id,
        activeSealRole: lead.cfg.role,
        sealDepth: lead.currentDepth,
        distToBuoyMeters: (lead.distToBuoy * 28.5).toFixed(0), // scaled to meters
        podCount: seals.length,
        podMembers: seals.map(s => ({
          id: s.cfg.id,
          role: s.cfg.role,
          depth: s.currentDepth.toFixed(1),
          inRange: s.inAcousticRange,
          isBreaching: s.isBreaching
        }))
      };
    }
  };
}
