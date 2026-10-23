import * as THREE from 'three';
import { CONFIG } from '../../constants/config';
import { generateSealSkinBumpMap, generateWeddellSealPelt } from './ProceduralTextures';

/**
 * Photorealistic Wild Antarctic Weddell Seal Pod & Biologger Acoustic Telemetry Engine
 * 
 * Anatomical & Kinematic Features:
 * 1. True fusiform mammalian anatomy: hydrodynamic torso, contoured blubber neck, cranium & muzzle
 * 2. Sculpted pectoral steering flippers & bilateral lunate caudal flukes with flexible trailing edges
 * 3. Organic Weddell seal mottled pelt (dorsal slate dapples -> pale silvery ventral belly) with wet clearcoat
 * 4. Multi-joint spine wave undulation: coordinated sinusoidal body flexion, tail oscillation & banking
 * 5. Streamlined Wildlife Computers-style dorsal biologger with low-profile hydro-bracket & whip antenna
 * 6. Volumetric 3D acoustic toroidal sonar pulses radiating through the water column on hydrophone ping
 * 7. Opportunistic acoustic detection cone (<28m in 3D ~800m acoustic reach) & 433MHz LoRa surface bursts
 */
export function createBiologgerSeal(splashSystem) {
  const podGroup = new THREE.Group();
  podGroup.name = "wildSealPodRoot";

  const sealSkinBump = generateSealSkinBumpMap();
  const sealSkinPelt = generateWeddellSealPelt();

  // Seal Pod Configuration (4 distinct wild Antarctic Weddell seals)
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
      scale: 0.74,
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
      scale: 1.12,
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

  // Helper: Create an anatomical curved paddle flipper with tapered leading and trailing edges
  function createFlipperGeometry(length, width, thickness, isLeft = true) {
    const shape = new THREE.Shape();
    const s = isLeft ? 1 : -1;
    // Base attachment
    shape.moveTo(0, 0);
    // Convex leading edge curve
    shape.bezierCurveTo(0.2 * length, 0.4 * width * s, 0.7 * length, 0.5 * width * s, length, 0.15 * width * s);
    // Curved rounded tip
    shape.bezierCurveTo(length * 1.05, 0.0, length * 1.02, -0.15 * width * s, length * 0.90, -0.30 * width * s);
    // Tapered trailing edge with slight scallop
    shape.bezierCurveTo(0.6 * length, -0.45 * width * s, 0.2 * length, -0.25 * width * s, 0, 0);

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: thickness * 0.4,
      bevelThickness: thickness * 0.3
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  // Helper: Create caudal tail fluke hydrofoil
  function createFlukeGeometry(span, chord, thickness) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.3 * span, 0.25 * chord, 0.8 * span, 0.4 * chord, span, 0.1 * chord);
    shape.bezierCurveTo(span * 0.95, -0.2 * chord, 0.5 * span, -0.35 * chord, 0.1 * span, -0.15 * chord);
    shape.lineTo(0, -0.1 * chord);

    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: thickness * 0.3,
      bevelThickness: thickness * 0.25
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  const foreFlipperLeftGeo = createFlipperGeometry(0.85, 0.36, 0.055, true);
  const foreFlipperRightGeo = createFlipperGeometry(0.85, 0.36, 0.055, false);
  const tailFlukeGeo = createFlukeGeometry(0.68, 0.32, 0.045);

  function createSealMember(cfg) {
    const sealRoot = new THREE.Group();
    sealRoot.name = `seal_${cfg.id}`;
    sealRoot.scale.setScalar(cfg.scale);

    // Wet Antarctic Mammal Pelt Material with Mottled Albedo & Clearcoat
    const sealPeltMat = new THREE.MeshPhysicalMaterial({
      map: sealSkinPelt,
      bumpMap: sealSkinBump,
      bumpScale: 0.015,
      color: 0xffffff,
      roughness: 0.28,
      metalness: 0.06,
      clearcoat: 0.82,
      clearcoatRoughness: 0.14
    });

    // Darker leathery flipper material
    const flipperMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      bumpMap: sealSkinBump,
      bumpScale: 0.008,
      roughness: 0.35,
      metalness: 0.08,
      clearcoat: 0.70
    });

    // ── 1. ARTICULATED MULTI-SEGMENT TORSO ──
    // Head & Cranium
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.08, 1.15);

    const craniumGeo = new THREE.SphereGeometry(0.32, 24, 20);
    craniumGeo.scale(0.88, 0.82, 1.25);
    const craniumMesh = new THREE.Mesh(craniumGeo, sealPeltMat);
    craniumMesh.castShadow = true;
    headGroup.add(craniumMesh);

    // Snout / Muzzle
    const snoutGeo = new THREE.SphereGeometry(0.18, 16, 14);
    snoutGeo.scale(0.92, 0.72, 1.2);
    const snoutMesh = new THREE.Mesh(snoutGeo, sealPeltMat);
    snoutMesh.position.set(0, -0.06, 0.35);
    headGroup.add(snoutMesh);

    // Leathery Black Nose Pad & Nostril Cleft
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.55, metalness: 0.1 });
    const noseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.04), noseMat);
    noseMesh.position.set(0, -0.03, 0.52);
    headGroup.add(noseMesh);

    // Dark Glassy Eyes with Corneal Depth & Specular Sun Glint
    const eyeGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      roughness: 0.02,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02
    });
    const glintGeo = new THREE.SphereGeometry(0.012, 8, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.18, 0.08, 0.22);
    const leftGlint = new THREE.Mesh(glintGeo, glintMat);
    leftGlint.position.set(0.02, 0.022, 0.038);
    leftEye.add(leftGlint);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.18, 0.08, 0.22);
    const rightGlint = new THREE.Mesh(glintGeo, glintMat);
    rightGlint.position.set(-0.02, 0.022, 0.038);
    rightEye.add(rightGlint);

    headGroup.add(leftEye);
    headGroup.add(rightEye);

    // Natural Curving Whiskers (Vibrissae)
    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.85 });
    for (let side = -1; side <= 1; side += 2) {
      for (let w = 0; w < 4; w++) {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(side * 0.08, -0.06 + w * 0.018, 0.44),
          new THREE.Vector3(side * 0.22, -0.08 + w * 0.015, 0.38),
          new THREE.Vector3(side * 0.34, -0.16 + w * 0.012, 0.30)
        );
        const wPoints = curve.getPoints(8);
        const wGeo = new THREE.BufferGeometry().setFromPoints(wPoints);
        const whisker = new THREE.Line(wGeo, whiskerMat);
        headGroup.add(whisker);
      }
    }

    sealRoot.add(headGroup);

    // Main Fusiform Torso (Thorax & Blubber Midriff)
    const torsoGeo = new THREE.CylinderGeometry(0.44, 0.52, 1.25, 24, 6);
    torsoGeo.scale(0.92, 1.0, 1.12);
    torsoGeo.rotateX(Math.PI / 2);
    const torsoMesh = new THREE.Mesh(torsoGeo, sealPeltMat);
    torsoMesh.position.set(0, 0, 0.45);
    torsoMesh.castShadow = true;
    sealRoot.add(torsoMesh);

    // Articulated Lumbar Flank (Spine segment 1)
    const lumbarGroup = new THREE.Group();
    lumbarGroup.position.set(0, 0, -0.18);

    const lumbarGeo = new THREE.CylinderGeometry(0.52, 0.38, 0.85, 24, 4);
    lumbarGeo.scale(0.88, 1.0, 1.05);
    lumbarGeo.rotateX(Math.PI / 2);
    const lumbarMesh = new THREE.Mesh(lumbarGeo, sealPeltMat);
    lumbarMesh.position.set(0, 0, -0.42);
    lumbarMesh.castShadow = true;
    lumbarGroup.add(lumbarMesh);

    // Articulated Caudal Peduncle & Flukes (Spine segment 2)
    const caudalGroup = new THREE.Group();
    caudalGroup.position.set(0, 0, -0.85);

    const peduncleGeo = new THREE.CylinderGeometry(0.38, 0.16, 0.85, 20, 4);
    peduncleGeo.scale(0.75, 1.0, 0.95);
    peduncleGeo.rotateX(Math.PI / 2);
    const peduncleMesh = new THREE.Mesh(peduncleGeo, sealPeltMat);
    peduncleMesh.position.set(0, 0, -0.42);
    peduncleMesh.castShadow = true;
    caudalGroup.add(peduncleMesh);

    // Bilateral Caudal Flukes
    const leftFluke = new THREE.Mesh(tailFlukeGeo, flipperMat);
    leftFluke.position.set(0.24, 0, -0.92);
    leftFluke.rotation.set(0, 0.35, -0.15);
    caudalGroup.add(leftFluke);

    const rightFluke = new THREE.Mesh(tailFlukeGeo, flipperMat);
    rightFluke.position.set(-0.24, 0, -0.92);
    rightFluke.rotation.set(0, -0.35, 0.15);
    caudalGroup.add(rightFluke);

    lumbarGroup.add(caudalGroup);
    sealRoot.add(lumbarGroup);

    // Pectoral Foreflippers
    const leftFlipper = new THREE.Mesh(foreFlipperLeftGeo, flipperMat);
    leftFlipper.position.set(0.56, -0.18, 0.55);
    leftFlipper.rotation.set(0.15, 0.45, -0.30);
    sealRoot.add(leftFlipper);

    const rightFlipper = new THREE.Mesh(foreFlipperRightGeo, flipperMat);
    rightFlipper.position.set(-0.56, -0.18, 0.55);
    rightFlipper.rotation.set(0.15, -0.45, 0.30);
    sealRoot.add(rightFlipper);

    // ── 2. STREAMLINED DORSAL BIOLOGGER TAG & HARNESS ──
    const tagGroup = new THREE.Group();
    tagGroup.position.set(0, 0.52, 0.25);

    // Low-profile hydrodynamic epoxy tag housing
    const tagGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.28, 16);
    tagGeo.rotateX(Math.PI / 2);
    tagGeo.scale(0.85, 0.55, 1.15);
    const tagMat = new THREE.MeshPhysicalMaterial({
      color: cfg.tagColor,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.6
    });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.name = "seal_tag_housing";
    tagMesh.userData.partId = "seal_tag";
    tagGroup.add(tagMesh);

    // Silicone Mounting Harness Strap
    const strapGeo = new THREE.TorusGeometry(0.54, 0.022, 8, 32, Math.PI * 0.95);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.rotation.x = Math.PI / 2;
    strap.rotation.z = Math.PI * 0.025;
    strap.position.set(0, -0.06, 0.0);
    strap.name = "seal_tag_strap";
    strap.userData.partId = "seal_tag";
    tagGroup.add(strap);

    // Flexible 433MHz Nitinol LoRa Whip Antenna
    const antCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.08, 0.10),
      new THREE.Vector3(0, 0.22, 0.08),
      new THREE.Vector3(0, 0.38, -0.02),
      new THREE.Vector3(0, 0.52, -0.14)
    );
    const antGeo = new THREE.TubeGeometry(antCurve, 12, 0.007, 6, false);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.95, roughness: 0.15 });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.name = "seal_lora_antenna";
    antenna.userData.partId = "seal_lora";
    tagGroup.add(antenna);

    // Telemetry Uplink Strobe LED
    const tagLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const tagLed = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), tagLedMat);
    tagLed.position.set(0, 0.08, -0.06);
    tagLed.name = "seal_tag_led";
    tagLed.userData.partId = "seal_lora";
    tagGroup.add(tagLed);

    sealRoot.add(tagGroup);

    // ── 3. 3D VOLUMETRIC ACOUSTIC SONAR WAVE PULSES ──
    const sonarRingsGroup = new THREE.Group();
    const sonarRings = [];
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(0.5 + r * 0.7, 0.012, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      sonarRingsGroup.add(ring);
      sonarRings.push(ring);
    }
    sonarRingsGroup.position.set(0, 0.45, 0.25);
    sealRoot.add(sonarRingsGroup);

    podGroup.add(sealRoot);

    return {
      cfg,
      sealRoot,
      headGroup,
      lumbarGroup,
      caudalGroup,
      leftFlipper,
      rightFlipper,
      leftFluke,
      rightFluke,
      tagMesh,
      tagLedMat,
      sonarRings,
      wasBreaching: false,
      lastPingTime: 0
    };
  }

  const seals = POD_MEMBERS.map(createSealMember);

  // Opportunistic High-Frequency Telemetry Uplink Beam (Active when breaching or pinging)
  const beamGeo = new THREE.CylinderGeometry(0.03, 0.45, 24, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const signalBeam = new THREE.Mesh(beamGeo, beamMat);
  podGroup.add(signalBeam);

  // Nostril Exhalation Micro-Bubble Particle System (Biological Realism)
  const bubbleGroup = new THREE.Group();
  bubbleGroup.name = "sealExhalationBubbles";
  podGroup.add(bubbleGroup);

  const bubbleGeo = new THREE.SphereGeometry(0.038, 8, 8);
  const bubbleMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    transmission: 0.92,
    opacity: 0.70,
    transparent: true,
    roughness: 0.05,
    ior: 1.12,
    clearcoat: 1.0,
    depthWrite: false
  });

  const BUBBLE_COUNT = 36;
  const bubblePool = [];
  for (let bi = 0; bi < BUBBLE_COUNT; bi++) {
    const bMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
    bMesh.visible = false;
    bubbleGroup.add(bMesh);
    bubblePool.push({
      mesh: bMesh,
      active: false,
      age: 0,
      maxAge: 3.5,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      scaleBase: 0.5 + Math.random() * 0.7
    });
  }

  let nextBubbleIndex = 0;
  let lastExhaleTime = 0;

  const primarySeal = seals[0];

  return {
    sealRoot: primarySeal.sealRoot,
    podGroup,
    seals,
    bubbleGroup,
    tagMesh: primarySeal.tagMesh,
    signalBeam,
    update: (time, buoyWorldPos) => {
      let closestDist = Infinity;
      let activeOpportunisticSeal = null;
      let anyBreachingInProximity = false;

      seals.forEach((s) => {
        const {
          cfg,
          sealRoot,
          headGroup,
          lumbarGroup,
          caudalGroup,
          leftFlipper,
          rightFlipper,
          leftFluke,
          rightFluke,
          tagLedMat,
          sonarRings
        } = s;

        // Trajectory Path
        const pathAngle = time * cfg.orbitSpeed + cfg.orbitOffset;
        const pathRadius = cfg.baseRadius + Math.sin(time * 0.15 + cfg.orbitOffset) * cfg.radiusVar;

        const sx = Math.cos(pathAngle) * pathRadius;
        const sz = Math.sin(pathAngle) * pathRadius;

        // Natural vertical dive trajectory
        const divePhase = Math.sin(time * cfg.depthFreq + cfg.orbitOffset);
        let sy = cfg.depthMin + (divePhase + 1.0) * 0.5 * (cfg.depthMax - cfg.depthMin);

        // Surfacing behavior
        const isBreaching = cfg.depthMax >= 0 && sy > -1.2;
        if (isBreaching) {
          sy = 0.22 + Math.sin(time * 2.2) * 0.14;
        }

        sealRoot.position.set(sx, sy, sz);

        // Orient along tangent of swimming path
        sealRoot.rotation.y = -pathAngle - Math.PI / 2;

        // Natural dive pitch and banking roll
        const swimPitch = isBreaching ? -0.12 : Math.cos(time * cfg.depthFreq + cfg.orbitOffset) * 0.22;
        sealRoot.rotation.x = swimPitch;
        sealRoot.rotation.z = Math.sin(time * 2.5 + cfg.orbitOffset) * 0.10;

        // ── KINEMATIC SINUSOIDAL SPINE WAVE UNDULATION ──
        const swimCycle = time * 4.2 + cfg.orbitOffset;
        const spineWave1 = Math.sin(swimCycle) * 0.22;
        const spineWave2 = Math.sin(swimCycle - 0.75) * 0.38;
        const flukePitch = Math.cos(swimCycle - 1.2) * 0.45;

        // Lumbar flexion
        lumbarGroup.rotation.y = spineWave1;
        // Caudal peduncle undulation
        caudalGroup.rotation.y = spineWave2;
        // Tail fluke hydrofoil oscillation
        leftFluke.rotation.y = 0.35 + flukePitch;
        rightFluke.rotation.y = -0.35 + flukePitch;

        // Head tracking & gentle lateral scan
        headGroup.rotation.y = Math.sin(time * 1.5 + cfg.orbitOffset) * 0.08;
        headGroup.rotation.x = isBreaching ? 0.25 : -swimPitch * 0.45;

        // Pectoral flipper banking & feathering
        const flipperRoll = Math.sin(swimCycle * 0.6) * 0.18;
        leftFlipper.rotation.z = -0.30 + flipperRoll;
        leftFlipper.rotation.y = 0.45 + spineWave1 * 0.5;
        rightFlipper.rotation.z = 0.30 - flipperRoll;
        rightFlipper.rotation.y = -0.45 + spineWave1 * 0.5;

        // Splash trigger on surface breach
        if (splashSystem) {
          if (isBreaching && !s.wasBreaching) {
            splashSystem.triggerSplash(sx, sz);
          }
          if (!isBreaching && Math.random() < 0.20) {
            splashSystem.emitBubble(sx, sy, sz);
          }
        }
        s.wasBreaching = isBreaching;

        // Proximity to Autonomous Buoy
        const distToBuoy = Math.hypot(sx - buoyWorldPos.x, sz - buoyWorldPos.z);
        const inAcousticRange = distToBuoy < 28.0;

        if (distToBuoy < closestDist) {
          closestDist = distToBuoy;
          activeOpportunisticSeal = s;
        }

        if (inAcousticRange && isBreaching) {
          anyBreachingInProximity = true;
        }

        // ── 3D VOLUMETRIC ACOUSTIC SONAR EXPANSION ──
        const pingInterval = 3.5;
        const pingAge = (time + cfg.orbitOffset * 2.0) % pingInterval;
        const isPinging = pingAge < 1.4;

        sonarRings.forEach((ring, idx) => {
          if (isPinging && !isBreaching) {
            const waveProgress = (pingAge / 1.4 + idx * 0.25) % 1.0;
            ring.scale.setScalar(1.0 + waveProgress * 3.8);
            ring.material.opacity = Math.max(0.0, (1.0 - waveProgress) * 0.32);
            ring.visible = true;
          } else {
            ring.material.opacity = 0.0;
            ring.visible = false;
          }
        });

        // Tag LED indicator
        if (isBreaching && inAcousticRange) {
          tagLedMat.color.setHex(0x10b981); // Solid Emerald LoRa uplink
        } else if (isPinging) {
          tagLedMat.color.setHex(0x38bdf8); // Cyan Acoustic ping pulse
        } else {
          tagLedMat.color.setHex(0x064e3b); // Standby dark green
        }
      });

      // Update Opportunistic Telemetry Beam
      if (anyBreachingInProximity && activeOpportunisticSeal) {
        const sealPos = activeOpportunisticSeal.sealRoot.position;
        signalBeam.position.set(
          (sealPos.x + buoyWorldPos.x) * 0.5,
          (sealPos.y + buoyWorldPos.y + 1.2) * 0.5 + 1.2,
          (sealPos.z + buoyWorldPos.z) * 0.5
        );
        signalBeam.lookAt(buoyWorldPos.x, buoyWorldPos.y + 1.5, buoyWorldPos.z);
        signalBeam.rotateX(Math.PI / 2);

        const beamDist = sealPos.distanceTo(buoyWorldPos);
        signalBeam.scale.set(1.0, beamDist / 24.0, 1.0);
        beamMat.opacity = 0.65 + Math.sin(time * 18.0) * 0.25;
      } else {
        beamMat.opacity = 0.0;
      }

      // ── NOSTRIL EXHALATION BUBBLE STREAM UPDATE ──
      // Periodically exhale bubbles when swimming underwater
      if (primarySeal && primarySeal.sealRoot.position.y < -1.5 && (time - lastExhaleTime > 4.2)) {
        lastExhaleTime = time;
        const snoutWorldPos = new THREE.Vector3(0, -0.05, 1.6);
        snoutWorldPos.applyMatrix4(primarySeal.sealRoot.matrixWorld);

        // Vent 3-5 bubbles in quick succession
        for (let b = 0; b < 4; b++) {
          const pb = bubblePool[nextBubbleIndex];
          nextBubbleIndex = (nextBubbleIndex + 1) % BUBBLE_COUNT;
          pb.active = true;
          pb.age = -b * 0.12; // staggered release
          pb.maxAge = 3.2 + Math.random() * 1.5;
          pb.pos.copy(snoutWorldPos).add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.08,
            (Math.random() - 0.5) * 0.15
          ));
          pb.vel.set(
            (Math.random() - 0.5) * 0.18,
            0.65 + Math.random() * 0.45, // Buoyant upward ascent
            (Math.random() - 0.5) * 0.18
          );
          pb.mesh.position.copy(pb.pos);
          pb.mesh.visible = false;
        }
      }

      // Animate active rising bubbles
      const dt = 0.016;
      bubblePool.forEach(pb => {
        if (!pb.active) return;
        pb.age += dt;
        if (pb.age < 0) return; // Staggered delay

        pb.mesh.visible = true;
        pb.pos.y += pb.vel.y * dt;
        pb.pos.x += Math.sin(time * 5.0 + pb.age * 3.0) * 0.015;
        pb.pos.z += Math.cos(time * 4.5 + pb.age * 3.0) * 0.015;

        // Expanding bubble volume as hydrostatic pressure drops
        const scale = pb.scaleBase * (1.0 + (pb.age / pb.maxAge) * 1.4);
        pb.mesh.scale.setScalar(scale);
        pb.mesh.position.copy(pb.pos);

        // Pop bubble when reaching ocean surface
        if (pb.pos.y >= -0.12 || pb.age >= pb.maxAge) {
          pb.active = false;
          pb.mesh.visible = false;
        }
      });

      return {
        closestDistance: closestDist,
        activeSealId: activeOpportunisticSeal ? activeOpportunisticSeal.cfg.id : null,
        isBreaching: anyBreachingInProximity,
        sealDepth: primarySeal ? Math.abs(primarySeal.sealRoot.position.y) : 0
      };
    }
  };
}
