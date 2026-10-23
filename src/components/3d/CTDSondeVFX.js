import * as THREE from 'three';
import { CONFIG } from '../../constants/config';
import { generateBrushedMetalMap } from './ProceduralTextures';

/**
 * Subsea CTD Profiler Sonde (SBE-49 FastCAT & TI MSP430 Ultra-Low-Power Architecture)
 * Complete visual overhaul:
 * 1. High-fidelity titanium CTD rosette cage with platinized conductivity flow tube & Pt1000 RTD
 * 2. Real-time floating 3D billboard HUD label showing instrument identity & live depth readout
 * 3. Continuous vertical sounding line down to the benthic floor (-48m abyss) with depth gauge marker rings
 */
export function createCTDSonde() {
  const sondeGroup = new THREE.Group();
  sondeGroup.name = "ctdSondeGroup";
  sondeGroup.position.set(0, -3.95, 0);

  const brushedMetal = generateBrushedMetalMap();

  // 1. Titanium Cylindrical Pressure Housing
  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.15, 32);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Brushed titanium
    roughness: 0.22,
    metalness: 0.92,
    bumpMap: brushedMetal,
    bumpScale: 0.008
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.name = "ctd_body";
  bodyMesh.userData.partId = "ctd_sonde";
  bodyMesh.castShadow = true;
  sondeGroup.add(bodyMesh);

  // 1B. Upper Conical Docking Collar (Nests seamlessly inside Keel Moonpool Receiver)
  const dockingCollarGeo = new THREE.CylinderGeometry(0.08, 0.22, 0.32, 32);
  const dockingCollarMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Hard-anodized marine titanium
    metalness: 0.92,
    roughness: 0.2
  });
  const dockingCollar = new THREE.Mesh(dockingCollarGeo, dockingCollarMat);
  dockingCollar.position.y = 0.72;
  dockingCollar.name = "ctd_docking_collar";
  dockingCollar.userData.partId = "ctd_sonde";
  sondeGroup.add(dockingCollar);

  // Inductive Contact & Latching Ring (Gold band that seals into guide tube)
  const latchRingGeo = new THREE.TorusGeometry(0.18, 0.016, 12, 32);
  const latchRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 });
  const latchRing = new THREE.Mesh(latchRingGeo, latchRingMat);
  latchRing.rotation.x = Math.PI / 2;
  latchRing.position.y = 0.62;
  latchRing.name = "ctd_latch_ring";
  latchRing.userData.partId = "ctd_sonde";
  sondeGroup.add(latchRing);

  // Flexible Neoprene Strain-Relief Cable Boot
  const bootGeo = new THREE.CylinderGeometry(0.035, 0.075, 0.22, 16);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.1 });
  const bootMesh = new THREE.Mesh(bootGeo, bootMat);
  bootMesh.position.y = 0.98;
  bootMesh.name = "ctd_boot";
  bootMesh.userData.partId = "ctd_sonde";
  sondeGroup.add(bootMesh);

  // SBE-49 Yellow/Orange High-Visibility Band
  const stripeGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.22, 32);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.35,
    metalness: 0.2
  });
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.y = 0.25;
  stripeMesh.name = "ctd_stripe";
  stripeMesh.userData.partId = "ctd_sonde";
  sondeGroup.add(stripeMesh);

  // Protective Titanium Rosette Cage Bars around lower sensor array
  const cageGroup = new THREE.Group();
  cageGroup.name = "ctd_cage";
  cageGroup.userData.partId = "ctd_sonde";
  const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 });

  for (let bi = 0; bi < 6; bi++) {
    const barAngle = (bi / 6) * Math.PI * 2;
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(Math.cos(barAngle) * 0.26, -0.72, Math.sin(barAngle) * 0.26);
    bar.userData.partId = "ctd_sonde";
    cageGroup.add(bar);
  }

  // Cage guard bumper rings (top and bottom)
  const cageRingGeo = new THREE.TorusGeometry(0.26, 0.016, 8, 24);
  const ring1 = new THREE.Mesh(cageRingGeo, barMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = -0.48;
  ring1.userData.partId = "ctd_sonde";
  cageGroup.add(ring1);

  const ring2 = new THREE.Mesh(cageRingGeo, barMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = -0.98;
  ring2.userData.partId = "ctd_sonde";
  cageGroup.add(ring2);

  sondeGroup.add(cageGroup);

  // Platinized Conductivity Flow Cell (Illuminated quartz tube)
  const cellGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.38, 16);
  const cellMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Glowing electric cyan
    emissive: 0x0891b2,
    emissiveIntensity: 0.75,
    roughness: 0.12,
    metalness: 0.85
  });
  const cellMesh = new THREE.Mesh(cellGeo, cellMat);
  cellMesh.position.set(0.07, -0.72, 0);
  cellMesh.name = "ctd_conductivity_cell";
  cellMesh.userData.partId = "ctd_sensors";
  sondeGroup.add(cellMesh);

  // Pt1000 RTD Temperature Needle Probe (Gold-plated micro-needle)
  const rtdGeo = new THREE.CylinderGeometry(0.014, 0.005, 0.38, 8);
  const rtdMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.95,
    roughness: 0.1
  });
  const rtdMesh = new THREE.Mesh(rtdGeo, rtdMat);
  rtdMesh.position.set(-0.07, -0.72, 0);
  rtdMesh.name = "ctd_rtd_probe";
  rtdMesh.userData.partId = "ctd_sensors";
  sondeGroup.add(rtdMesh);

  // Pulsing Telemetry LED Beacon (Pulsing emerald green)
  const ledGeo = new THREE.SphereGeometry(0.045, 12, 12);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const ledMesh = new THREE.Mesh(ledGeo, ledMat);
  ledMesh.position.set(0, 0.62, 0);
  ledMesh.name = "ctd_led_beacon";
  ledMesh.userData.partId = "ctd_sensors";
  sondeGroup.add(ledMesh);

  // Sonar / Acoustic Doppler Profiler Ripple Ring
  const pingGeo = new THREE.RingGeometry(0.12, 0.85, 32);
  pingGeo.rotateX(Math.PI / 2);
  const pingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const pingMesh = new THREE.Mesh(pingGeo, pingMat);
  pingMesh.position.y = -1.02;
  sondeGroup.add(pingMesh);

  // 1C. Conductivity Cell Active Centrifugal Pump Exhaust Micro-Cavitation Bubbles
  const pumpBubbleGroup = new THREE.Group();
  pumpBubbleGroup.position.set(0.07, -0.42, 0); // Directly above conductivity cell flow discharge
  const pBubbleGeo = new THREE.SphereGeometry(0.016, 6, 6);
  const pBubbleMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  const pumpBubbles = [];
  for (let pbi = 0; pbi < 16; pbi++) {
    const pbMesh = new THREE.Mesh(pBubbleGeo, pBubbleMat);
    pbMesh.position.set(
      (Math.random() - 0.5) * 0.04,
      Math.random() * 0.45,
      (Math.random() - 0.5) * 0.04
    );
    const pbScale = 0.5 + Math.random() * 0.9;
    pbMesh.scale.setScalar(pbScale);
    pumpBubbleGroup.add(pbMesh);
    pumpBubbles.push({
      mesh: pbMesh,
      baseSpeed: 0.35 + Math.random() * 0.45,
      offset: Math.random() * Math.PI * 2
    });
  }
  sondeGroup.add(pumpBubbleGroup);

  // 1D. Subsea LED Survey Cluster & Volumetric Deep-Water Floodlight
  const subseaSpot = new THREE.SpotLight(0xdbeafe, 3.5, 30, Math.PI / 3.2, 0.45, 1.2);
  subseaSpot.position.set(0, -0.65, 0);
  subseaSpot.target.position.set(0, -12.0, 0);
  sondeGroup.add(subseaSpot);
  sondeGroup.add(subseaSpot.target);

  const subseaPoint = new THREE.PointLight(0x38bdf8, 1.0, 6.0, 1.5);
  subseaPoint.position.set(0, -0.75, 0);
  sondeGroup.add(subseaPoint);

  // Subtle downward volumetric cone mesh (water turbidity scattering)
  const coneGeo = new THREE.ConeGeometry(2.0, 5.0, 16, 1, true);
  coneGeo.translate(0, -2.5, 0);
  coneGeo.rotateX(Math.PI);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);
  coneMesh.position.set(0, -0.65, 0);
  sondeGroup.add(coneMesh);

  // 2. High-Precision SCADA Micro-Callout Tag with Optical Leader Line
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 160;
  const labelCtx = labelCanvas.getContext('2d');

  function renderLabel(depthMeters) {
    labelCtx.clearRect(0, 0, 512, 160);

    // Glowing dark translucent background card
    labelCtx.fillStyle = 'rgba(6, 15, 30, 0.92)';
    labelCtx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    labelCtx.lineWidth = 3;
    labelCtx.beginPath();
    labelCtx.roundRect(6, 6, 500, 148, 12);
    labelCtx.fill();
    labelCtx.stroke();

    // Indicator dot
    labelCtx.fillStyle = '#10b981';
    labelCtx.beginPath();
    labelCtx.arc(32, 44, 10, 0, Math.PI * 2);
    labelCtx.fill();

    // Instrument Title
    labelCtx.fillStyle = '#ffffff';
    labelCtx.font = '600 24px "JetBrains Mono", monospace';
    labelCtx.fillText('SBE-49 FASTCAT CTD', 54, 50);

    // Live Depth Metric
    labelCtx.fillStyle = '#38bdf8';
    labelCtx.font = '700 32px "JetBrains Mono", monospace';
    labelCtx.fillText(`Z: -${depthMeters.toFixed(1)}m | TI MSP430`, 28, 114);
  }

  renderLabel(0.0);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.minFilter = THREE.LinearFilter;

  // Sleek, compact plane geometry positioned comfortably without screen-edge clipping
  const labelGeo = new THREE.PlaneGeometry(1.25, 0.39);
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(1.05, 0.32, 0);
  sondeGroup.add(labelMesh);

  // Optical leader line connecting callout tag to titanium sonde collar
  const leaderGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0.24, 0.22, 0),
    new THREE.Vector3(0.42, 0.32, 0),
    new THREE.Vector3(0.58, 0.32, 0)
  ]);
  const leaderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
  const leaderLine = new THREE.Line(leaderGeo, leaderMat);
  sondeGroup.add(leaderLine);

  // 3. Flexible Multi-Segment Winch Cable (Hydrodynamic Catenary under tension & current drag)
  const cableSegments = 16;
  const cablePoints = [];
  for (let ci = 0; ci <= cableSegments; ci++) {
    cablePoints.push(new THREE.Vector3(0, -ci * 0.25, 0));
  }
  const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
  const cableMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: 0.85
  });
  const cableMesh = new THREE.Line(cableGeo, cableMat);

  // 4. Abyss Follow-Up Sounding Line & Depth Milestones (down to -48m benthic seabed)
  const abyssGroup = new THREE.Group();
  abyssGroup.name = "abyssSoundingGroup";

  // Vertical illuminated sounding guide cable into the abyss
  const abyssPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -48, 0)];
  const abyssLineGeo = new THREE.BufferGeometry().setFromPoints(abyssPoints);
  const abyssLineMat = new THREE.LineDashedMaterial({
    color: 0x0284c7,
    dashSize: 0.8,
    gapSize: 0.4,
    transparent: true,
    opacity: 0.55
  });
  const abyssLine = new THREE.Line(abyssLineGeo, abyssLineMat);
  abyssLine.computeLineDistances();
  abyssGroup.add(abyssLine);

  // Depth marker rings every 10 meters into the abyss
  const milestoneDepths = [
    { depth: -10, label: "10m - MIXED LAYER" },
    { depth: -20, label: "20m - PYCNOCLINE" },
    { depth: -30, label: "30m - THERMOCLINE" },
    { depth: -40, label: "40m - HALOCLINE" },
    { depth: -48, label: "48m - BENTHIC FLOOR (ABYSS)" }
  ];

  milestoneDepths.forEach(m => {
    // Glowing ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.28, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: m.depth === -48 ? 0xf59e0b : 0x0ea5e9,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const rMesh = new THREE.Mesh(ringGeo, ringMat);
    rMesh.position.set(0, m.depth, 0);
    abyssGroup.add(rMesh);

    // Milestone text badge
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const bCtx = badgeCanvas.getContext('2d');
    bCtx.fillStyle = 'rgba(4, 9, 20, 0.85)';
    bCtx.strokeStyle = m.depth === -48 ? '#f59e0b' : '#38bdf8';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.roundRect(4, 4, 248, 56, 8);
    bCtx.fill();
    bCtx.stroke();

    bCtx.fillStyle = m.depth === -48 ? '#fbbf24' : '#e0f2fe';
    bCtx.font = 'bold 22px "Bebas Neue", sans-serif';
    bCtx.fillText(m.label, 14, 40);

    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeGeo = new THREE.PlaneGeometry(1.8, 0.45);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(1.8, m.depth, 0);
    abyssGroup.add(badgeMesh);
  });

  // 4B. Authentic Antarctic Benthic Abyssal Seafloor (-48.2m Abyss)
  const seabedGeo = new THREE.CircleGeometry(32, 32);
  seabedGeo.rotateX(-Math.PI / 2);
  const seabedMat = new THREE.MeshStandardMaterial({
    color: 0x040c16, // Dark polar marine basaltic silt & diatomaceous ooze
    roughness: 0.96,
    metalness: 0.08
  });
  const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
  seabedMesh.position.set(0, -48.2, 0);
  seabedMesh.receiveShadow = true;
  abyssGroup.add(seabedMesh);

  // Glacial Erratic Dropstones (Boulders ice-rafted by ancient calved glaciers)
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.92,
    metalness: 0.12,
    flatShading: true
  });
  const stoneGeo = new THREE.DodecahedronGeometry(1.0, 1);
  for (let si = 0; si < 14; si++) {
    const sAng = (si / 14) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const sDist = 3.5 + Math.random() * 22.0;
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    const sScaleX = 0.6 + Math.random() * 1.4;
    const sScaleY = 0.4 + Math.random() * 0.8;
    const sScaleZ = 0.6 + Math.random() * 1.4;
    stone.scale.set(sScaleX, sScaleY, sScaleZ);
    stone.position.set(Math.cos(sAng) * sDist, -48.2 + sScaleY * 0.45, Math.sin(sAng) * sDist);
    stone.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    abyssGroup.add(stone);
  }

  // Mooring Clump Anchor & Benthos Acoustic Release Transponder
  const anchorMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85, metalness: 0.75 });
  const anchorWeight = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.42, 20), anchorMat);
  anchorWeight.position.set(0, -48.0, 0);
  abyssGroup.add(anchorWeight);

  // Cast iron anchor chain bridle
  const chainMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.3 });
  const chainGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  const chainBridle = new THREE.Mesh(chainGeo, chainMat);
  chainBridle.position.set(0, -47.4, 0);
  abyssGroup.add(chainBridle);

  // Acoustic Release Transponder Canister (Safety Yellow with Hydrophone Transducers)
  const transponderMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 });
  const transponderCan = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 16), transponderMat);
  transponderCan.position.set(0.35, -47.2, 0);
  abyssGroup.add(transponderCan);

  // Acoustic transducer transducer head (black ceramic)
  const xducerMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.10, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 })
  );
  xducerMesh.position.set(0.35, -46.75, 0);
  abyssGroup.add(xducerMesh);

  // 5. CTD Depth Trail (Spheres representing historical CTD profile points)
  const trailGroup = new THREE.Group();
  const maxTrailPoints = 40;
  const trailItems = [];
  const sphereGeo = new THREE.SphereGeometry(0.12, 14, 14);

  for (let i = 0; i < maxTrailPoints; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75
    });
    const s = new THREE.Mesh(sphereGeo, mat);
    s.visible = false;
    trailGroup.add(s);
    trailItems.push({ mesh: s, mat, y: 0 });
  }

  let trailIdx = 0;
  let lastTrailY = 0;
  let lastRenderedDepth = -999;

  const _tempExit = new THREE.Vector3();
  const _tempDocked = new THREE.Vector3();
  const _tempEyelet = new THREE.Vector3();
  let sondeVelX = 0;
  let sondeVelZ = 0;

  return {
    sondeGroup,
    cableMesh,
    trailGroup,
    abyssGroup,
    update: (time, targetDepthMeters, buoyObj, currentFlow = { x: 0.45, z: 0.25 }, delta = 0.016) => {
      // 1. One Source of Truth: derive position from the buoy's winch exit port
      let exitPos = _tempExit;
      let dockedPos = _tempDocked;
      let buoyQuat = null;

      if (buoyObj && typeof buoyObj.getWinchExitWorldPosition === 'function') {
        buoyObj.getWinchExitWorldPosition(exitPos);
        buoyObj.getDockedWorldPosition(dockedPos);
        buoyQuat = buoyObj.buoyRoot.quaternion;
      } else if (buoyObj && typeof buoyObj === 'object' && buoyObj.x !== undefined) {
        exitPos.set(buoyObj.x, buoyObj.y - CONFIG.BUOY_RADIUS_3D - 1.95, buoyObj.z);
        dockedPos.set(buoyObj.x, buoyObj.y - CONFIG.BUOY_RADIUS_3D - 2.70, buoyObj.z);
      } else {
        exitPos.set(0, -CONFIG.BUOY_RADIUS_3D - 1.95, 0);
        dockedPos.set(0, -CONFIG.BUOY_RADIUS_3D - 2.70, 0);
      }

      // 2. Docked state (0 m): sonde is seated in its cradle and moves rigidly with the buoy
      if (targetDepthMeters <= 0.05) {
        sondeGroup.position.copy(dockedPos);
        if (buoyQuat) {
          sondeGroup.quaternion.copy(buoyQuat);
        } else {
          sondeGroup.rotation.set(0, 0, 0);
        }
        sondeVelX = 0;
        sondeVelZ = 0;
      } else {
        // 3. Deployed state (>0 m):
        // Depth (y) comes from the winch state
        const profilingDrop = (targetDepthMeters / CONFIG.MAX_DEPTH_METERS) * 38.0;
        const targetWorldY = dockedPos.y - profilingDrop;
        sondeGroup.position.y += (targetWorldY - sondeGroup.position.y) * 0.14;

        // Hydrodynamic downstream lag bounded by tether length
        const flow = currentFlow || { x: 0.45, z: 0.25 };
        const cSpeed = Math.hypot(flow.x, flow.z);
        const dirX = cSpeed > 1e-4 ? flow.x / cSpeed : 0;
        const dirZ = cSpeed > 1e-4 ? flow.z / cSpeed : 0;

        const tetherDeployed = Math.max(0.5, profilingDrop + 0.75);
        const maxAllowedLag = tetherDeployed * 0.35;
        // Bounded lag: proportional to depth and current speed
        const trailOffset = Math.min(maxAllowedLag, targetDepthMeters * 0.025 * cSpeed);

        const targetX = exitPos.x + dirX * trailOffset;
        const targetZ = exitPos.z + dirZ * trailOffset;

        // Critically damped smoothing (zeta = 1.0, no overshoot)
        const dt = Math.min(Math.max(delta, 0.001), 0.05);
        const omega = 4.5;
        const fX = -omega * omega * (sondeGroup.position.x - targetX) - 2 * omega * sondeVelX;
        const fZ = -omega * omega * (sondeGroup.position.z - targetZ) - 2 * omega * sondeVelZ;
        sondeVelX += fX * dt;
        sondeVelZ += fZ * dt;
        sondeGroup.position.x += sondeVelX * dt;
        sondeGroup.position.z += sondeVelZ * dt;

        // Strict clamp: never detach or exceed max tether lag
        const dx = sondeGroup.position.x - exitPos.x;
        const dz = sondeGroup.position.z - exitPos.z;
        const hDist = Math.hypot(dx, dz);
        if (hDist > maxAllowedLag) {
          const ratio = maxAllowedLag / hDist;
          sondeGroup.position.x = exitPos.x + dx * ratio;
          sondeGroup.position.z = exitPos.z + dz * ratio;
          sondeVelX *= 0.5;
          sondeVelZ *= 0.5;
        }

        // Sonde orientation follows tether drag angle
        const tilt = Math.min(0.22, (trailOffset / tetherDeployed) * 0.5);
        sondeGroup.rotation.x = dirZ * tilt;
        sondeGroup.rotation.z = -dirX * tilt;
        sondeGroup.rotation.y = Math.atan2(dirX, dirZ);
      }

      // 4. Tether: top end at the winch port, bottom end at the sonde eyelet, existing catenary between them
      sondeGroup.updateMatrixWorld(true);
      _tempEyelet.set(0, 0.98, 0).applyMatrix4(sondeGroup.matrixWorld);

      const cablePositions = cableGeo.attributes.position.array;
      const startX = exitPos.x;
      const startY = exitPos.y;
      const startZ = exitPos.z;
      const endX = _tempEyelet.x;
      const endY = _tempEyelet.y;
      const endZ = _tempEyelet.z;

      const flow = currentFlow || { x: 0.45, z: 0.25 };
      const cSpeed = Math.hypot(flow.x, flow.z);
      const dirX = cSpeed > 1e-4 ? flow.x / cSpeed : 0;
      const dirZ = cSpeed > 1e-4 ? flow.z / cSpeed : 0;
      const spanY = Math.abs(startY - endY);

      for (let ci = 0; ci <= cableSegments; ci++) {
        const t = ci / cableSegments;
        const sag = Math.sin(t * Math.PI) * 0.18 * Math.min(1.0, spanY / 6.0);
        const dragX = dirX * Math.sin(t * Math.PI) * 0.12 * Math.min(1.0, spanY / 6.0);
        const dragZ = dirZ * Math.sin(t * Math.PI) * 0.12 * Math.min(1.0, spanY / 6.0);

        cablePositions[ci * 3] = startX + (endX - startX) * t + dragX;
        cablePositions[ci * 3 + 1] = startY + (endY - startY) * t - sag;
        cablePositions[ci * 3 + 2] = startZ + (endZ - startZ) * t + dragZ;
      }
      cableGeo.attributes.position.needsUpdate = true;

      // Real-time Depth HUD Billboard texture refresh
      if (Math.abs(targetDepthMeters - lastRenderedDepth) > 0.4) {
        lastRenderedDepth = targetDepthMeters;
        renderLabel(targetDepthMeters);
        labelTexture.needsUpdate = true;
      }

      // Keep label facing viewer's general direction
      labelMesh.rotation.y = Math.sin(time * 0.3) * 0.15;

      // Dynamic Deep-Water Subsea LED Floodlight Scaling (intensifies as sunlight fades)
      const depthFactor = Math.min(1.0, targetDepthMeters / 30.0);
      subseaSpot.intensity = 2.0 + depthFactor * 4.5;
      subseaPoint.intensity = 0.8 + depthFactor * 1.8;
      coneMat.opacity = 0.04 + depthFactor * 0.12;

      // Sonar active acoustic ping
      const pingScale = ((time * 2.2) % 2.0) * 2.4 + 0.5;
      pingMesh.scale.set(pingScale, pingScale, pingScale);
      pingMat.opacity = Math.max(0, 0.9 - (pingScale / 5.0));

      // Telemetry beacon LED blinking pulse
      ledMat.color.setHex((Math.sin(time * 6.0) > 0.3) ? 0x10b981 : 0x047857);

      // Record trail points
      if (Math.abs(sondeGroup.position.y - lastTrailY) > 0.65) {
        lastTrailY = sondeGroup.position.y;
        const item = trailItems[trailIdx];
        item.mesh.position.set(sondeGroup.position.x, sondeGroup.position.y, sondeGroup.position.z);
        item.mesh.visible = true;

        const depthRatio = Math.min(1.0, Math.max(0, -sondeGroup.position.y / 40.0));
        item.mat.color.setHSL(0.55 - depthRatio * 0.45, 0.95, 0.55);

        trailIdx = (trailIdx + 1) % maxTrailPoints;
      }

      // Animate Conductivity Cell Centrifugal Pump Micro-Cavitation Effluent
      const isProfiling = targetDepthMeters > 0.4;
      pumpBubbles.forEach((pb, idx) => {
        if (!isProfiling) {
          pb.mesh.visible = false;
          return;
        }
        pb.mesh.visible = true;
        // Rising upwards from exhaust port
        const cycle = (time * pb.baseSpeed + pb.offset) % 1.0;
        pb.mesh.position.y = cycle * 0.85; // Rise up to 0.85m above exhaust port
        pb.mesh.position.x = Math.sin(time * 4.0 + idx) * 0.025;
        pb.mesh.position.z = Math.cos(time * 3.5 + idx) * 0.025;
        // Fade out and expand as bubble rises
        const bScale = (0.5 + cycle * 0.9);
        pb.mesh.scale.setScalar(bScale);
      });
    }
  };
}
