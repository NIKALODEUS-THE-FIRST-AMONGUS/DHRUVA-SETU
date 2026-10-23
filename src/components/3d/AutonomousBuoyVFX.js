import * as THREE from 'three';
import { CONFIG } from '../../constants/config';
import { generateHDPEBumpMap, generateSolarCellTexture, generateBrushedMetalMap, generatePCBTexture, generateBenthicBiofoulingMap, generateHeatingPadTexture, generateRimeIceTexture } from './ProceduralTextures';

/**
 * Photorealistic Autonomous Polar Ocean Buoy (Layer 1) & Nodal Centre Hardware Bay
 * Features:
 * 1. Damped 6-DOF Inertial Spar Buoy Hydrodynamics (realistic mass-spring-damper heave & roll)
 * 2. IP68 Optical Acrylic Inspection Cutaway into the Electronics Payload Bay
 * 3. Custom FR4 Navy PCB Motherboard with Gold ENIG Traces & Silkscreen (SIH 26065)
 * 4. ESP32-S3 SoC with Metal RF Can & Animated Telemetry Status LEDs (SYS_OK, LORA_TX, CTD_RX)
 * 5. LoRa SX1278 (433MHz) Transceiver with Gold SMA Connector & Copper Helical Antenna
 * 6. 4S2P LiFePO4 Battery Bank with BMS Harness & MPPT Solar Charger with Toroidal Inductor
 * 7. NEMA-17 Winch Stepper Motor with Planetary Gearbox & Optical Slip Ring
 */
export function createAutonomousBuoy() {
  const buoyRoot = new THREE.Group();
  buoyRoot.name = "autonomousBuoyRoot";

  const hullGroup = new THREE.Group();
  const solarGroup = new THREE.Group();
  const mastGroup = new THREE.Group();
  const electronicsBayGroup = new THREE.Group();
  const winchGroup = new THREE.Group();
  const keelGroup = new THREE.Group();

  // Procedural PBR Textures
  const hdpeBump = generateHDPEBumpMap();
  const solarTex = generateSolarCellTexture();
  const brushedMetal = generateBrushedMetalMap();
  const pcbTex = generatePCBTexture();
  const heatingPadTex = generateHeatingPadTexture();

  // ════════════════════════════════════════════════════════════════════════
  // 1. SPHERICAL HDPE HULL WITH IP68 ACRYLIC INSPECTION CUTAWAY
  // ════════════════════════════════════════════════════════════════════════
  const hullMat = new THREE.MeshPhysicalMaterial({
    color: 0xea580c, // Safety marine orange
    roughness: 0.32,
    metalness: 0.04,
    bumpMap: hdpeBump,
    bumpScale: 0.015,
    clearcoat: 0.55,
    clearcoatRoughness: 0.20
  });

  // Main hull hemisphere (Rear & sides, leaving front +Z open for inspection window)
  const hullBackGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D, 48, 32, 0.80 * Math.PI, 1.40 * Math.PI, Math.PI * 0.32, Math.PI * 0.26);
  const hullBackMesh = new THREE.Mesh(hullBackGeo, hullMat);
  hullBackMesh.name = "hull_back";
  hullBackMesh.userData.partId = "hull";
  hullBackMesh.castShadow = true;
  hullBackMesh.receiveShadow = true;
  hullGroup.add(hullBackMesh);

  // Bottom hull cap
  const hullBottomGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D, 48, 16, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42);
  const hullBottomMesh = new THREE.Mesh(hullBottomGeo, hullMat);
  hullBottomMesh.name = "hull_bottom";
  hullBottomMesh.userData.partId = "hull";
  hullGroup.add(hullBottomMesh);

  // Top collar rim
  const hullTopGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D, 48, 16, 0, Math.PI * 2, 0, Math.PI * 0.32);
  const hullTopMesh = new THREE.Mesh(hullTopGeo, hullMat);
  hullTopMesh.name = "hull_top";
  hullTopMesh.userData.partId = "hull";
  hullGroup.add(hullTopMesh);

  // IP68 Clear Optical Acrylic Inspection Window (Centered symmetrically on front +Z face)
  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.96,
    opacity: 0.22,
    transparent: true,
    roughness: 0.04,
    metalness: 0.0,
    ior: 1.49, // Acrylic optical index
    thickness: 0.12,
    specularIntensity: 0.95,
    clearcoat: 0.95,
    clearcoatRoughness: 0.04,
    side: THREE.DoubleSide
  });

  // Centered exactly on +Z (from 0.20*PI to 0.80*PI, width 0.60*PI = 108 degrees)
  const acrylicWindowGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D * 1.002, 32, 24, 0.20 * Math.PI, 0.60 * Math.PI, Math.PI * 0.32, Math.PI * 0.26);
  const acrylicWindow = new THREE.Mesh(acrylicWindowGeo, acrylicMat);
  acrylicWindow.name = "acrylicInspectionWindow";
  acrylicWindow.userData.partId = "hull";
  hullGroup.add(acrylicWindow);

  // SOLAS Waterline Reflective Equator Band (with opening for front cutaway window)
  const bandGeo = new THREE.CylinderGeometry(CONFIG.BUOY_RADIUS_3D * 1.008, CONFIG.BUOY_RADIUS_3D * 1.008, 0.16, 48, 1, true, 0.30 * Math.PI, 1.40 * Math.PI);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.35 });
  const bandMesh = new THREE.Mesh(bandGeo, bandMat);
  hullGroup.add(bandMesh);

  // 1B-2. Polar Waterline Rime Ice & Frozen Salt Crust Encrustation (Micro-Hardware Detail)
  const rimeIceTex = generateRimeIceTexture();
  const rimeIceMat = new THREE.MeshStandardMaterial({
    map: rimeIceTex,
    color: 0xf0fdf4,
    roughness: 0.88,
    metalness: 0.05,
    transparent: true,
    opacity: 0.90,
    depthWrite: false
  });
  const rimeRingGeo = new THREE.CylinderGeometry(CONFIG.BUOY_RADIUS_3D * 1.014, CONFIG.BUOY_RADIUS_3D * 1.014, 0.28, 48, 1, true, 0.28 * Math.PI, 1.44 * Math.PI);
  const rimeRing = new THREE.Mesh(rimeRingGeo, rimeIceMat);
  rimeRing.position.y = -0.02;
  hullGroup.add(rimeRing);

  // Micro-nodules of crystalline hoarfrost on the upper hull rim
  const rimeNoduleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.05 });
  const rimeNoduleGeo = new THREE.DodecahedronGeometry(0.025, 1);
  for (let rn = 0; rn < 14; rn++) {
    const rAng = (0.35 + (rn / 13) * 1.30) * Math.PI;
    const nodule = new THREE.Mesh(rimeNoduleGeo, rimeNoduleMat);
    const rad = CONFIG.BUOY_RADIUS_3D * 1.012;
    nodule.position.set(Math.cos(rAng) * rad, 0.04 + (Math.random() - 0.5) * 0.06, Math.sin(rAng) * rad);
    nodule.scale.set(0.8 + Math.random() * 0.6, 0.5 + Math.random() * 0.8, 0.8 + Math.random() * 0.6);
    hullGroup.add(nodule);
  }

  // 1B-3. Waterline Contact Wake Foam Ring (Lapping polar sea froth clinging to spar hull)
  const foamRingGeo = new THREE.RingGeometry(CONFIG.BUOY_RADIUS_3D * 0.98, CONFIG.BUOY_RADIUS_3D * 1.32, 36);
  foamRingGeo.rotateX(-Math.PI / 2);
  const foamRingMat = new THREE.MeshBasicMaterial({
    color: 0xf1f5f9,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const foamRingMesh = new THREE.Mesh(foamRingGeo, foamRingMat);
  foamRingMesh.position.y = -0.01;
  hullGroup.add(foamRingMesh);

  // 1C. CNC-Machined Anodized Bezel Frame with Stainless Hex Bolts around Acrylic Window
  const boltMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
  const boltGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.024, 6);
  boltGeo.rotateX(Math.PI / 2);

  // 16 Hex-head bolts distributed along the arch perimeter of the inspection window
  for (let b = 0; b < 16; b++) {
    const t = b / 15;
    // Window arc from phi 0.20*PI to 0.80*PI, theta 0.32 to 0.58
    let bPhi, bTheta;
    if (b < 6) {
      // Top arch
      bPhi = (0.22 + (b / 5) * 0.56) * Math.PI;
      bTheta = 0.32 * Math.PI;
    } else if (b < 11) {
      // Bottom arch
      bPhi = (0.22 + ((b - 6) / 4) * 0.56) * Math.PI;
      bTheta = 0.58 * Math.PI;
    } else if (b < 13) {
      // Left vertical post
      bPhi = 0.21 * Math.PI;
      bTheta = (0.36 + (b - 11) * 0.12) * Math.PI;
    } else {
      // Right vertical post
      bPhi = 0.79 * Math.PI;
      bTheta = (0.36 + (b - 13) * 0.12) * Math.PI;
    }

    const r = CONFIG.BUOY_RADIUS_3D * 1.008;
    const bx = -r * Math.sin(bTheta) * Math.cos(bPhi);
    const by = r * Math.cos(bTheta);
    const bz = r * Math.sin(bTheta) * Math.sin(bPhi);

    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(bx, by, bz);
    bolt.lookAt(0, 0, 0);
    hullGroup.add(bolt);
  }

  // 1D. Heavy-Duty Forged 316L Stainless Steel Deck Lifting Pad-Eyes (4x Cardinal Perimeter)
  const padEyeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.2 });
  const eyeTorusGeo = new THREE.TorusGeometry(0.055, 0.016, 8, 24);
  const eyeBaseGeo = new THREE.BoxGeometry(0.08, 0.025, 0.06);

  const padEyeAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  padEyeAngles.forEach((ang) => {
    const pr = CONFIG.BUOY_RADIUS_3D * 0.82;
    const py = CONFIG.BUOY_RADIUS_3D * 0.58;
    const px = Math.cos(ang) * pr;
    const pz = Math.sin(ang) * pr;

    const base = new THREE.Mesh(eyeBaseGeo, padEyeMat);
    base.position.set(px, py, pz);
    base.rotation.y = -ang;
    hullGroup.add(base);

    const loop = new THREE.Mesh(eyeTorusGeo, padEyeMat);
    loop.position.set(px, py + 0.05, pz);
    loop.rotation.y = -ang;
    hullGroup.add(loop);
  });

  // 1E. Sacrificial Zinc Galvanic Anode Blocks on Keel (Anti-electrolysis protection)
  const zincMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65, metalness: 0.75 });
  const zincGeo = new THREE.BoxGeometry(0.06, 0.16, 0.04);
  for (let z = 0; z < 4; z++) {
    const zAng = (z / 4) * Math.PI * 2;
    const zx = Math.cos(zAng) * (CONFIG.BUOY_RADIUS_3D * 0.52);
    const zz = Math.sin(zAng) * (CONFIG.BUOY_RADIUS_3D * 0.52);
    const anode = new THREE.Mesh(zincGeo, zincMat);
    anode.position.set(zx, -CONFIG.BUOY_RADIUS_3D * 0.88, zz);
    anode.rotation.y = -zAng;
    hullGroup.add(anode);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. CONFORMAL MONOCRYSTALLINE SILICON SOLAR CELL COLLAR
  // ════════════════════════════════════════════════════════════════════════
  const solarMat = new THREE.MeshPhysicalMaterial({
    map: solarTex,
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.85,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08
  });

  // 3 Solar Sectors (Right, Back, Left) - Front (+Z) is clear for the acrylic cutaway
  const solarPatches = [];
  const solarSectors = [
    { phiStart: 0.85 * Math.PI, phiLength: 0.30 * Math.PI },
    { phiStart: 1.35 * Math.PI, phiLength: 0.30 * Math.PI },
    { phiStart: 1.85 * Math.PI, phiLength: 0.30 * Math.PI }
  ];
  for (let i = 0; i < solarSectors.length; i++) {
    const { phiStart, phiLength } = solarSectors[i];
    const patchGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D * 1.012, 24, 16, phiStart, phiLength, 0.34, 0.24);
    const patch = new THREE.Mesh(patchGeo, solarMat);
    patch.name = `solar_patch_${i}`;
    patch.userData = { subsystemId: 'solar', partId: 'pv_strips', name: 'Conformal Solar Photovoltaic Shell' };
    solarGroup.add(patch);
    solarPatches.push(patch);
  }

  // Flexible Solar PV Conduit Wiring (Part A: 3x Solar Sector Gland Boxes & Marine Wiring)
  const jBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.8 });
  const glandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.95 }); // Brass cable gland

  for (let i = 0; i < solarSectors.length; i++) {
    const { phiStart, phiLength } = solarSectors[i];
    const midPhi = phiStart + phiLength / 2;
    // Position at top edge of solar panel (theta = 0.34, r = BUOY_RADIUS_3D * 1.015)
    const jbX = -CONFIG.BUOY_RADIUS_3D * 1.015 * Math.sin(0.34) * Math.cos(midPhi);
    const jbY = CONFIG.BUOY_RADIUS_3D * 1.015 * Math.cos(0.34);
    const jbZ = CONFIG.BUOY_RADIUS_3D * 1.015 * Math.sin(0.34) * Math.sin(midPhi);

    const jBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.04), jBoxMat);
    jBox.position.set(jbX, jbY, jbZ);
    jBox.lookAt(0, jbY, 0);
    solarGroup.add(jBox);

    const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), glandMat);
    gland.position.set(jbX, jbY + 0.03, jbZ);
    solarGroup.add(gland);

    // Flexible curved marine solar wiring conduit from gland to central mast collar
    const mastCollarY = CONFIG.BUOY_RADIUS_3D + 0.32;
    const wirePoints = [
      new THREE.Vector3(jbX, jbY + 0.04, jbZ),
      new THREE.Vector3(jbX * 0.6, jbY + 0.12, jbZ * 0.6),
      new THREE.Vector3(jbX * 0.2, mastCollarY + 0.05, jbZ * 0.2),
      new THREE.Vector3(0, mastCollarY, 0)
    ];
    const solarConduit = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePoints), 16, 0.008, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.2 })
    );
    solarGroup.add(solarConduit);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. NODAL CENTRE ELECTRONICS & PAYLOAD BAY (Visible via Cutaway)
  // ════════════════════════════════════════════════════════════════════════
  electronicsBayGroup.position.set(0, 0.08, 0.25);

  // Dedicated Anodized Instrument Bay Enclosure Bulkhead (Matte graphite rear chamber)
  // Generously envelopes the avionics deck to prevent any background void or external objects showing
  const chamberGeo = new THREE.CylinderGeometry(1.15, 1.15, 1.50, 48, 1, true, 0.65 * Math.PI, 1.70 * Math.PI);
  const chamberMat = new THREE.MeshStandardMaterial({
    color: 0x0b1120, // Matte aerospace deep graphite
    roughness: 0.92,
    metalness: 0.20,
    side: THREE.BackSide,
    bumpMap: brushedMetal,
    bumpScale: 0.005
  });
  const chamberBacking = new THREE.Mesh(chamberGeo, chamberMat);
  chamberBacking.position.set(0, 0.04, 0.05);
  electronicsBayGroup.add(chamberBacking);

  // Top and bottom sealed bulkhead pressure caps (Matte non-reflective finish)
  const bulkheadMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.95,
    metalness: 0.15
  });
  const topBulkhead = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.04, 48), bulkheadMat);
  topBulkhead.position.set(0, 0.72, 0.05);
  electronicsBayGroup.add(topBulkhead);

  const bottomBulkhead = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.04, 48), bulkheadMat);
  bottomBulkhead.position.set(0, -0.68, 0.05);
  electronicsBayGroup.add(bottomBulkhead);

  // Internal Payload Bay Illumination (Studio diffuse fill positioned to evenly illuminate PCB and components without ceiling burn)
  const bayOverheadLight = new THREE.PointLight(0xf8fafc, 0.26, 1.6, 2.0);
  bayOverheadLight.position.set(0, 0.45, 0.28);
  electronicsBayGroup.add(bayOverheadLight);

  const bayCyanLight = new THREE.PointLight(0x38bdf8, 0.18, 1.2, 2.0);
  bayCyanLight.position.set(0.24, 0.24, 0.28);
  electronicsBayGroup.add(bayCyanLight);

  const bayAmberLight = new THREE.PointLight(0xf59e0b, 0.16, 1.2, 2.0);
  bayAmberLight.position.set(-0.24, 0.22, 0.28);
  electronicsBayGroup.add(bayAmberLight);

  // Internal Aluminum Payload Mounting Standoff Chassis
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
    bumpMap: brushedMetal,
    bumpScale: 0.008
  });
  const chassisDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.04, 32), chassisMat);
  chassisDeck.position.y = -0.35;
  electronicsBayGroup.add(chassisDeck);

  // 4x Brass Hex Standoffs supporting the Motherboard
  const standoffMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
  const standoffGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.065, 6);
  [[-0.32, -0.31], [0.32, -0.31], [-0.32, 0.31], [0.32, 0.31]].forEach(([sx, sz]) => {
    const post = new THREE.Mesh(standoffGeo, standoffMat);
    post.position.set(sx, 0.045, sz + 0.05);
    electronicsBayGroup.add(post);
  });

  // A. Custom FR4 PCB Motherboard with Gold ENIG Traces & Silkscreen
  const pcbBoardGeo = new THREE.BoxGeometry(0.72, 0.025, 0.72);
  const pcbBoardMat = new THREE.MeshStandardMaterial({
    map: pcbTex,
    roughness: 0.32,
    metalness: 0.45
  });
  const pcbBoard = new THREE.Mesh(pcbBoardGeo, pcbBoardMat);
  pcbBoard.position.set(0, 0.08, 0.05);
  pcbBoard.userData = { subsystemId: 'pcb', name: 'Avionics Motherboard & Dual-Core Gateway' };
  electronicsBayGroup.add(pcbBoard);

  // B. ESP32-S3 Dual-Core SoC Module with Heat-spreader Shield
  const esp32CanGeo = new THREE.BoxGeometry(0.24, 0.035, 0.24);
  const esp32CanMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db, // Nickel RF shield can
    metalness: 0.95,
    roughness: 0.2
  });
  const esp32Can = new THREE.Mesh(esp32CanGeo, esp32CanMat);
  esp32Can.position.set(-0.16, 0.11, -0.06);
  esp32Can.name = "esp32_can";
  esp32Can.userData = { subsystemId: 'pcb', partId: 'esp32_s3', name: 'Avionics Motherboard & Dual-Core Gateway' };
  electronicsBayGroup.add(esp32Can);

  // ESP32 Chip Pins / Lead frame
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });
  const pinStripL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.22), pinMat);
  pinStripL.position.set(-0.29, 0.10, -0.06);
  pinStripL.userData.partId = "esp32_s3";
  electronicsBayGroup.add(pinStripL);
  const pinStripR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.22), pinMat);
  pinStripR.position.set(-0.03, 0.10, -0.06);
  pinStripR.userData.partId = "esp32_s3";
  electronicsBayGroup.add(pinStripR);

  // Animated Telemetry Status LEDs on Motherboard
  // 1. SYS_OK (Breathing Green LED)
  const ledSysOkMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const ledSysOk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledSysOkMat);
  ledSysOk.position.set(-0.24, 0.11, 0.10);
  ledSysOk.userData.partId = "esp32_s3";
  electronicsBayGroup.add(ledSysOk);

  // 2. LORA_TX (Flashing Amber Burst LED)
  const ledLoraTxMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const ledLoraTx = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledLoraTxMat);
  ledLoraTx.position.set(-0.20, 0.11, 0.10);
  ledLoraTx.userData.partId = "esp32_s3";
  electronicsBayGroup.add(ledLoraTx);

  // 3. CTD_RX (Blinking Cyan Sensor Bus LED)
  const ledCtdRxMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ledCtdRx = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledCtdRxMat);
  ledCtdRx.position.set(-0.16, 0.11, 0.10);
  ledCtdRx.userData.partId = "esp32_s3";
  electronicsBayGroup.add(ledCtdRx);

  // C. LoRa SX1278 (433MHz) RF Transceiver Module
  const loraCanMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
  const loraCan = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.18), loraCanMat);
  loraCan.position.set(0.18, 0.11, -0.06);
  loraCan.userData = { subsystemId: 'pcb', name: 'LoRa SX1278 433MHz Transceiver' };
  electronicsBayGroup.add(loraCan);

  // Brass Gold SMA 90-degree RF Connector
  const smaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.15 });
  const smaConnector = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.06, 12), smaMat);
  smaConnector.rotation.x = Math.PI / 2;
  smaConnector.position.set(0.24, 0.11, 0.06);
  electronicsBayGroup.add(smaConnector);

  const smaNut = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 6), smaMat);
  smaNut.rotation.x = Math.PI / 2;
  smaNut.position.set(0.24, 0.11, 0.08);
  electronicsBayGroup.add(smaNut);

  // D. Physical 3D SMD Components on PCB
  // Electrolytic Power Decoupling Capacitors (Metallic silver cylinders with satin finish)
  const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  const capTopMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.45 });
  for (let c = 0; c < 3; c++) {
    const capCan = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.055, 12), capMat);
    capCan.position.set(-0.28 + c * 0.06, 0.12, 0.20);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.005, 12), capTopMat);
    capTop.position.set(capCan.position.x, 0.15, capCan.position.z);
    electronicsBayGroup.add(capCan);
    electronicsBayGroup.add(capTop);
  }

  // Micro-SD Black Box Flash Memory Slot (Subsea CTD Mission Logging)
  const sdSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.008, 0.055),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 })
  );
  sdSlot.position.set(0.28, 0.098, -0.22);
  sdSlot.name = "sd_card_slot";
  sdSlot.userData.partId = "sd_module";
  electronicsBayGroup.add(sdSlot);

  // TCXO 26MHz Temperature-Compensated Crystal Oscillator (Gold can)
  const tcxo = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.012, 0.025),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.15 })
  );
  tcxo.position.set(-0.06, 0.10, -0.18);
  electronicsBayGroup.add(tcxo);

  // Multi-pin Nylon Terminal Blocks (Off-white Molex engineering nylon headers)
  const molexMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65, metalness: 0.1 });
  const molex1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), molexMat);
  molex1.position.set(0.05, 0.11, 0.26);
  electronicsBayGroup.add(molex1);

  const molex2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.14), molexMat);
  molex2.position.set(-0.32, 0.11, -0.15);
  electronicsBayGroup.add(molex2);

  // MPPT Solar Charge Controller with Toroidal Inductor
  const mpptHeatSink = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.04, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.25 })
  );
  mpptHeatSink.position.set(-0.16, 0.11, 0.20);
  mpptHeatSink.name = "mppt_heatsink";
  mpptHeatSink.userData.partId = "mppt_regulator";
  electronicsBayGroup.add(mpptHeatSink);

  const toroidGeo = new THREE.TorusGeometry(0.035, 0.015, 8, 20);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
  const toroidMesh = new THREE.Mesh(toroidGeo, coilMat);
  toroidMesh.rotation.x = Math.PI / 2;
  toroidMesh.position.set(-0.04, 0.11, 0.20);
  toroidMesh.name = "toroid_power_inductor";
  toroidMesh.userData.partId = "inductor";
  electronicsBayGroup.add(toroidMesh);

  // E. 4S2P LiFePO4 Subsea Battery Bank with CNC Anodized Enclosure Tray
  const batteryTrayMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark anodized marine aluminum
    metalness: 0.8,
    roughness: 0.3,
    bumpMap: brushedMetal,
    bumpScale: 0.006
  });

  const batteryTray = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.28), batteryTrayMat);
  batteryTray.position.set(0.05, -0.20, -0.10);
  batteryTray.name = "battery_tray";
  batteryTray.userData = { subsystemId: 'battery', partId: 'battery_pack', name: '4S2P LiFePO4 Marine Battery Enclosure' };
  electronicsBayGroup.add(batteryTray);

  // Front viewing cutaway exposing cell insulated array
  const batteryWindowMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.20, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  );
  batteryWindowMesh.position.set(0.05, -0.20, 0.035);
  batteryWindowMesh.userData.partId = "battery_pack";
  electronicsBayGroup.add(batteryWindowMesh);

  // Stainless steel tie-down retention brackets across battery tray
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  for (let s = -1; s <= 1; s += 2) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.25, 0.29), bracketMat);
    strap.position.set(0.05 + s * 0.16, -0.20, -0.10);
    strap.name = s === -1 ? "retention_strap_l" : "retention_strap_r";
    strap.userData.partId = "retention_straps";
    electronicsBayGroup.add(strap);

    const thumbScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), bracketMat);
    thumbScrew.position.set(0.05 + s * 0.16, -0.07, -0.10);
    thumbScrew.name = s === -1 ? "thumbscrew_l" : "thumbscrew_r";
    thumbScrew.userData.partId = "retention_straps";
    electronicsBayGroup.add(thumbScrew);
  }

  // Heavy-duty Marine Brass Terminal Studs (+12.8V and GND)
  const termPosStud = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 }));
  termPosStud.position.set(0.22, -0.065, 0.0);
  termPosStud.name = "term_pos_stud";
  termPosStud.userData.partId = "brass_terminals";
  electronicsBayGroup.add(termPosStud);
  const termPosCap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }));
  termPosCap.position.set(0.22, -0.05, 0.0);
  termPosCap.name = "term_pos_cap";
  termPosCap.userData.partId = "brass_terminals";
  electronicsBayGroup.add(termPosCap);

  const termNegStud = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 }));
  termNegStud.position.set(-0.12, -0.065, 0.0);
  termNegStud.name = "term_neg_stud";
  termNegStud.userData.partId = "brass_terminals";
  electronicsBayGroup.add(termNegStud);
  const termNegCap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 }));
  termNegCap.position.set(-0.12, -0.05, 0.0);
  termNegCap.name = "term_neg_cap";
  termNegCap.userData.partId = "brass_terminals";
  electronicsBayGroup.add(termNegCap);

  // Smart BMS Balancing Controller
  const bmsMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4, metalness: 0.3 });
  const bmsBoard = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.012), bmsMat);
  bmsBoard.position.set(0.05, -0.20, 0.045);
  bmsBoard.name = "bms_board";
  bmsBoard.userData = { subsystemId: 'battery', partId: 'battery_pack', name: '4S LiFePO4 Smart BMS Controller' };
  electronicsBayGroup.add(bmsBoard);

  const cellMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.25,
    metalness: 0.7,
    clearcoat: 0.6
  });
  const cellGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16);
  const batteryCells = [];

  for (let row = 0; row < 2; row++) {
    for (let col = -1; col <= 2; col++) {
      const cell = new THREE.Mesh(cellGeo, cellMat);
      cell.position.set(col * 0.10 - 0.05, -0.20, row * 0.10 - 0.15);
      cell.name = `battery_cell_${batteryCells.length}`;
      cell.userData = { subsystemId: 'battery', partId: 'battery_pack', name: '4S2P LiFePO4 Polar Battery Bank' };
      electronicsBayGroup.add(cell);
      batteryCells.push(cell);
    }
  }

  // Inter-cell Copper Busbars
  const busbarMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.92, roughness: 0.15 });
  for (let b = 0; b < 3; b++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.006, 0.02), busbarMat);
    bar.position.set(-0.10 + b * 0.10, -0.085, -0.15);
    bar.name = `busbar_${b}`;
    bar.userData.partId = "battery_pack";
    electronicsBayGroup.add(bar);
  }

  // F. Flexible Polyimide Kapton Heating Pads & Sub-Zero Thermal Anti-Freeze Core
  const heaterGroup = new THREE.Group();
  heaterGroup.name = "subZeroPTCHeater";

  // Flexible Kapton Heating Pad Material with etched copper serpentine traces
  const heatingPadMat = new THREE.MeshStandardMaterial({
    map: heatingPadTex,
    roughness: 0.32,
    metalness: 0.35,
    transparent: true,
    opacity: 0.95
  });

  // 1. Battery Pack Flexible Heating Pad Jacket (Surrounds the 4S2P LiFePO4 cells to prevent cold charging lockout)
  const batteryHeaterPad = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.26), heatingPadMat);
  batteryHeaterPad.position.set(0.05, -0.20, -0.10);
  batteryHeaterPad.name = "battery_heater_pad";
  batteryHeaterPad.userData = { subsystemId: 'heater', partId: 'kapton_pads', name: 'Flexible Polyimide Kapton Battery Heating Pad (-40°C)' };
  heaterGroup.add(batteryHeaterPad);

  // 2. Chassis Under-Deck Heating Pad (Thermal bed for avionics chamber)
  const chassisHeaterPad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 0.55), heatingPadMat);
  chassisHeaterPad.position.set(0, -0.345, 0.05);
  chassisHeaterPad.name = "chassis_heater_pad";
  chassisHeaterPad.userData = { subsystemId: 'heater', partId: 'kapton_pads', name: 'Avionics Deck Thermal Anti-Freeze Heating Pad' };
  heaterGroup.add(chassisHeaterPad);

  // 3. Copper heat-pipe running along the battery tray
  const heaterBlockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
  const heatPipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 12);
  const heatPipe = new THREE.Mesh(heatPipeGeo, heaterBlockMat);
  heatPipe.rotation.z = Math.PI / 2.5;
  heatPipe.position.set(0.08, -0.18, 0.02);
  heatPipe.name = "copper_heat_pipe";
  heatPipe.userData = { subsystemId: 'heater', partId: 'kapton_pads', name: 'Sub-Zero PTC Thermal Anti-Freeze Core' };
  heaterGroup.add(heatPipe);

  // 4. Polar Thermal Active Status LED (Warm amber glow on PCB)
  const ledHeaterMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const ledHeater = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8), ledHeaterMat);
  ledHeater.position.set(-0.12, 0.11, 0.10);
  ledHeater.name = "led_heater";
  ledHeater.userData = { subsystemId: 'heater', partId: 'kapton_pads', name: 'Polar Thermal Control Active Indicator' };
  heaterGroup.add(ledHeater);

  // 5. Heat Shimmer above Kapton Battery Pad (Phase 6B Thermal Visuals)
  const heatShimmerMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uIntensity;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.y += sin(pos.x * 24.0 + uTime * 7.0) * 0.008 * uIntensity;
        pos.x += cos(pos.z * 20.0 + uTime * 6.0) * 0.005 * uIntensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uIntensity;
      void main() {
        if (uIntensity <= 0.01) discard;
        float ripple = sin(vUv.x * 35.0 + uTime * 9.0) * cos(vUv.y * 30.0 - uTime * 7.0);
        float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x)
                       * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        float alpha = edgeFade * (0.20 + 0.35 * ripple) * uIntensity;
        vec3 shimmerCol = mix(vec3(1.0, 0.60, 0.15), vec3(1.0, 0.95, 0.85), uIntensity * 0.6);
        gl_FragColor = vec4(shimmerCol, alpha);
      }
    `
  });
  const heatShimmerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.28), heatShimmerMat);
  heatShimmerMesh.rotation.x = -Math.PI / 2;
  heatShimmerMesh.position.set(0.05, -0.075, -0.10);
  heatShimmerMesh.name = "heat_shimmer_mesh";
  heaterGroup.add(heatShimmerMesh);

  electronicsBayGroup.add(heaterGroup);

  // ════════════════════════════════════════════════════════════════════════
  // 3B. REALISTIC 3D ORGANIC WIRING HARNESSES (Spline Tubes)
  // ════════════════════════════════════════════════════════════════════════
  function createCurvedWire(points, radius, colorHex) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const wireGeo = new THREE.TubeGeometry(curve, 28, radius, 8, false);
    const wireMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.2
    });
    return new THREE.Mesh(wireGeo, wireMat);
  }

  // 1. High-Current Battery to MPPT / Gateway Power Harness (Red +12.8V, Black GND)
  const wireBatPos = createCurvedWire([
    [0.15, -0.08, -0.15],
    [0.22, -0.05, -0.08],
    [0.22, 0.04, 0.06],
    [0.12, 0.09, 0.16],
    [-0.05, 0.09, 0.22]
  ], 0.009, 0xef4444); // Silicone Red
  wireBatPos.name = "wire_bat_pos";
  wireBatPos.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireBatPos);

  const wireBatNeg = createCurvedWire([
    [-0.15, -0.08, -0.15],
    [-0.22, -0.04, -0.08],
    [-0.22, 0.04, 0.06],
    [-0.18, 0.09, 0.16],
    [-0.08, 0.09, 0.22]
  ], 0.009, 0x09090b); // Silicone Black
  wireBatNeg.name = "wire_bat_neg";
  wireBatNeg.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireBatNeg);

  // 2. Solar PV Infeed Wire Pair (Curving from Upper Dome through hull gland to MPPT)
  const wireSolar1 = createCurvedWire([
    [-0.20, 0.35, -0.10],
    [-0.22, 0.26, 0.05],
    [-0.18, 0.16, 0.18],
    [-0.12, 0.10, 0.24]
  ], 0.007, 0x475569); // Industrial Slate Silicone (avoids bloom specular blowout)
  wireSolar1.name = "wire_solar_1";
  wireSolar1.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireSolar1);

  const wireSolar2 = createCurvedWire([
    [-0.18, 0.35, -0.12],
    [-0.20, 0.26, 0.03],
    [-0.16, 0.16, 0.16],
    [-0.10, 0.10, 0.22]
  ], 0.007, 0x0284c7); // Solar Blue
  wireSolar2.name = "wire_solar_2";
  wireSolar2.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireSolar2);

  // 3. Winch Stepper Motor 4-Wire Loom (Routing from TMC2209 driver to bottom pass-through)
  const wireWinch1 = createCurvedWire([
    [-0.28, 0.09, -0.14],
    [-0.30, 0.02, -0.16],
    [-0.28, -0.15, -0.16],
    [-0.24, -0.32, -0.10]
  ], 0.006, 0xef4444); // Stepper Coil A+ (Red)
  wireWinch1.name = "wire_winch_1";
  wireWinch1.userData.partId = "wiring_harness";
  const wireWinch2 = createCurvedWire([
    [-0.26, 0.09, -0.14],
    [-0.28, 0.02, -0.16],
    [-0.26, -0.15, -0.16],
    [-0.22, -0.32, -0.10]
  ], 0.006, 0x10b981); // Stepper Coil A- (Green)
  wireWinch2.name = "wire_winch_2";
  wireWinch2.userData.partId = "wiring_harness";
  const wireWinch3 = createCurvedWire([
    [-0.24, 0.09, -0.14],
    [-0.26, 0.02, -0.16],
    [-0.24, -0.15, -0.16],
    [-0.20, -0.32, -0.10]
  ], 0.006, 0x38bdf8); // Stepper Coil B+ (Cyan)
  wireWinch3.name = "wire_winch_3";
  wireWinch3.userData.partId = "wiring_harness";
  const wireWinch4 = createCurvedWire([
    [-0.22, 0.09, -0.14],
    [-0.24, 0.02, -0.16],
    [-0.22, -0.15, -0.16],
    [-0.18, -0.32, -0.10]
  ], 0.006, 0xfbbf24); // Stepper Coil B- (Yellow)
  wireWinch4.name = "wire_winch_4";
  wireWinch4.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireWinch1);
  electronicsBayGroup.add(wireWinch2);
  electronicsBayGroup.add(wireWinch3);
  electronicsBayGroup.add(wireWinch4);

  // 4. RG-316 RF Coaxial Cable (Curving with 90° brass SMA bend up into mast feed)
  const wireCoax = createCurvedWire([
    [0.24, 0.11, 0.08],
    [0.26, 0.16, 0.04],
    [0.24, 0.28, -0.04],
    [0.15, 0.42, -0.08],
    [0.08, 0.55, -0.02]
  ], 0.006, 0x78716c); // Braided Gold/Brown Sheath
  wireCoax.name = "wire_coax";
  wireCoax.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireCoax);

  // 5. Sensor Bus Twisted Pair to Slip Ring (Green/Yellow I2C telemetry)
  const wireI2C_A = createCurvedWire([
    [0.08, 0.09, 0.24],
    [0.14, 0.02, 0.22],
    [0.18, -0.14, 0.16],
    [0.18, -0.32, 0.08]
  ], 0.005, 0x10b981);
  wireI2C_A.name = "wire_i2c_a";
  wireI2C_A.userData.partId = "wiring_harness";
  const wireI2C_B = createCurvedWire([
    [0.10, 0.09, 0.24],
    [0.16, 0.02, 0.22],
    [0.20, -0.14, 0.16],
    [0.20, -0.32, 0.08]
  ], 0.005, 0xf59e0b);
  wireI2C_B.name = "wire_i2c_b";
  wireI2C_B.userData.partId = "wiring_harness";
  electronicsBayGroup.add(wireI2C_A);
  electronicsBayGroup.add(wireI2C_B);

  // ════════════════════════════════════════════════════════════════════════
  // 4. GATEWAY MAST & ANTENNAS
  // ════════════════════════════════════════════════════════════════════════
  const mastPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 1.45, 16),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.88, roughness: 0.25 })
  );
  mastPillar.position.y = CONFIG.BUOY_RADIUS_3D + 0.70;
  mastGroup.add(mastPillar);

  // LoRa 433MHz Monopole Whip Antenna
  const antMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.014, 1.05, 8),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
  );
  antMesh.position.set(0.08, CONFIG.BUOY_RADIUS_3D + 1.60, 0);
  antMesh.name = "lora_whip_antenna";
  antMesh.userData = { subsystemId: 'antenna', partId: 'antenna', name: 'LoRa SX1278 433MHz High-Gain Whip Antenna' };
  mastGroup.add(antMesh);

  // Copper loading coil at base of whip antenna
  const coilGeo = new THREE.TorusGeometry(0.02, 0.006, 8, 20);
  const coilMesh = new THREE.Mesh(coilGeo, new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.15 }));
  coilMesh.rotation.x = Math.PI / 2;
  coilMesh.position.set(0.08, CONFIG.BUOY_RADIUS_3D + 1.15, 0);
  coilMesh.name = "copper_loading_coil";
  coilMesh.userData.partId = "antenna";
  mastGroup.add(coilMesh);

  // NavIC / GPS L1 Ceramic Patch Antenna on cross-arm
  const gpsCrossArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.02, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.25 })
  );
  gpsCrossArm.position.set(-0.10, CONFIG.BUOY_RADIUS_3D + 1.25, 0);
  mastGroup.add(gpsCrossArm);

  const gpsPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.018, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.9 })
  );
  gpsPatch.position.set(-0.18, CONFIG.BUOY_RADIUS_3D + 1.27, 0);
  gpsPatch.name = "navic_gps_patch";
  gpsPatch.userData = { subsystemId: 'antenna', partId: 'antenna', name: 'NavIC / GPS L1 Polar Positioning Patch' };
  mastGroup.add(gpsPatch);

  // 4B. Ultrasonic Anemometer & Met Sensor Suite (Real MoES/NIOT Polar Specification)
  const metSuiteGroup = new THREE.Group();
  metSuiteGroup.position.set(0.14, CONFIG.BUOY_RADIUS_3D + 1.25, 0.08);

  // Stalk mounting bracket
  const metStalk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.014, 0.35, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 })
  );
  metStalk.position.y = 0.175;
  metSuiteGroup.add(metStalk);

  // Ultrasonic 3-prong acoustic wind sensor head
  const usHeadGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.018, 12);
  const usHeadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const usHead = new THREE.Mesh(usHeadGeo, usHeadMat);
  usHead.position.y = 0.35;
  metSuiteGroup.add(usHead);

  const prongGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.065, 8);
  const prongMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.15 }); // Gold-plated transducers
  for (let pi = 0; pi < 3; pi++) {
    const pAng = (pi / 3) * Math.PI * 2;
    const prong = new THREE.Mesh(prongGeo, prongMat);
    prong.position.set(Math.cos(pAng) * 0.026, 0.38, Math.sin(pAng) * 0.026);
    metSuiteGroup.add(prong);
  }

  // Gill Multi-Plate Temperature & Relative Humidity Radiation Shield (Stack of 5 conical louvers)
  const louverMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.05 });
  for (let li = 0; li < 5; li++) {
    const louverGeo = new THREE.ConeGeometry(0.045, 0.012, 16, 1, true);
    const louver = new THREE.Mesh(louverGeo, louverMat);
    louver.position.y = 0.10 + li * 0.022;
    metSuiteGroup.add(louver);
  }

  // Static Barometric Pressure Port (Perforated Disc Baffle)
  const baroBaffle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.008, 16),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
  );
  baroBaffle.position.y = 0.04;
  metSuiteGroup.add(baroBaffle);

  metSuiteGroup.userData = { subsystemId: 'antenna', name: 'Ultrasonic Anemometer & Met Sensor Suite (Wind, Temp, Baro)' };
  mastGroup.add(metSuiteGroup);

  // 4C. IALA-Spec Maritime Navigation LED Strobe Beacon with Fresnel Cylindrical Lens
  const strobeGroup = new THREE.Group();
  strobeGroup.position.set(0, CONFIG.BUOY_RADIUS_3D + 1.48, 0);

  // Aluminum mounting base
  const strobeBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.04, 16),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
  );
  strobeGroup.add(strobeBase);

  // Clear polycarbonate cylindrical Fresnel lens
  const fresnelGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.11, 24);
  const fresnelMat = new THREE.MeshPhysicalMaterial({
    color: 0xffedd5,
    transmission: 0.92,
    opacity: 0.35,
    transparent: true,
    roughness: 0.08,
    ior: 1.58,
    clearcoat: 1.0
  });
  const fresnelLens = new THREE.Mesh(fresnelGeo, fresnelMat);
  fresnelLens.position.y = 0.075;
  strobeGroup.add(fresnelLens);

  // Internal High-Intensity Amber Xenon / LED Emitter
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf59e0b,
    emissiveIntensity: 3.5,
    roughness: 0.1
  });
  const strobeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12), strobeMat);
  strobeMesh.position.y = 0.075;
  strobeGroup.add(strobeMesh);

  // Dynamic PointLight burst for IALA flash
  const strobeLight = new THREE.PointLight(0xf59e0b, 0.0, 16.0);
  strobeLight.position.y = 0.075;
  strobeGroup.add(strobeLight);

  // Stainless Protective Lens Guard Cage (3 vertical bars)
  const cageBarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.92, roughness: 0.2 });
  const cageBarGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.13, 8);
  for (let cbi = 0; cbi < 3; cbi++) {
    const cAng = (cbi / 3) * Math.PI * 2;
    const cBar = new THREE.Mesh(cageBarGeo, cageBarMat);
    cBar.position.set(Math.cos(cAng) * 0.062, 0.075, Math.sin(cAng) * 0.062);
    strobeGroup.add(cBar);
  }

  strobeGroup.userData = { subsystemId: 'antenna', name: 'IALA Spec High-Intensity Polar Navigation Strobe' };
  mastGroup.add(strobeGroup);

  // ════════════════════════════════════════════════════════════════════════
  // 5. SUBSEA WINCH & SLIP RING ASSEMBLY
  // ════════════════════════════════════════════════════════════════════════
  const drumGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.42, 32);
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.8 });
  const drumMesh = new THREE.Mesh(drumGeo, drumMat);
  drumMesh.rotation.z = Math.PI / 2;
  drumMesh.position.set(0, -CONFIG.BUOY_RADIUS_3D - 0.55, 0);
  drumMesh.name = "winch_drum";
  drumMesh.userData = { subsystemId: 'motor', partId: 'winch_drum', name: 'Winch Spool & CTD Cable Reel' };
  winchGroup.add(drumMesh);

  const cableCoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.32, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55, metalness: 0.15 })
  );
  cableCoil.rotation.z = Math.PI / 2;
  cableCoil.position.copy(drumMesh.position);
  cableCoil.name = "cable_coil";
  cableCoil.userData = { subsystemId: 'motor', partId: 'winch_drum', name: 'Winch Spool & CTD Cable Reel' };
  winchGroup.add(cableCoil);

  // Winch Stepper Motor & Planetary Gearbox
  const motorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.28, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
  );
  motorMesh.rotation.z = Math.PI / 2;
  motorMesh.position.set(-0.35, drumMesh.position.y, 0);
  motorMesh.name = "winch_motor";
  motorMesh.userData = { subsystemId: 'motor', partId: 'winch_drum', name: 'NEMA-17 Winch Stepper Motor & Planetary Gearbox' };
  winchGroup.add(motorMesh);

  // Planetary Gearbox Reduction Flange
  const gearboxFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.20, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
  );
  gearboxFlange.rotation.z = Math.PI / 2;
  gearboxFlange.position.set(-0.20, drumMesh.position.y, 0);
  gearboxFlange.name = "gearbox_flange";
  gearboxFlange.userData.partId = "winch_drum";
  winchGroup.add(gearboxFlange);

  // High-Precision 12-Channel Gold-Alloy Sealed Rotary Slip Ring Capsule
  const slipRingCapsuleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.18, metalness: 0.92 });
  const slipRingCapsule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.20, 24),
    slipRingCapsuleMat
  );
  slipRingCapsule.rotation.z = Math.PI / 2;
  slipRingCapsule.position.set(0.30, drumMesh.position.y, 0);
  slipRingCapsule.name = "slip_ring_capsule";
  slipRingCapsule.userData = { subsystemId: 'motor', partId: 'winch_drum', name: '12-Channel Gold Rotary Slip Ring Capsule' };
  winchGroup.add(slipRingCapsule);

  // Gold Collector Track Rings on Slip Ring Rotor
  const goldRingMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.1, metalness: 0.96 });
  for (let gr = 0; gr < 6; gr++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.006, 8, 24), goldRingMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(0.23 + gr * 0.026, drumMesh.position.y, 0);
    winchGroup.add(ring);
  }

  // Slip Ring Stator Brush Wire Bundle (running toward hull feedthrough)
  const wireSlipBundle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.38, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 })
  );
  wireSlipBundle.position.set(0.38, drumMesh.position.y + 0.18, 0);
  winchGroup.add(wireSlipBundle);

  // ════════════════════════════════════════════════════════════════════════
  // 6. INTEGRATED SUBSEA CTD DOCKING MOONPOOL & SOLID HDPE KEEL TUBES
  // (Seamless Bottom View Integration: Keel Mast Tube & CTD Profiler Receiver)
  // ════════════════════════════════════════════════════════════════════════
  // Main Central Structural Moonpool Guide Tube (Solid Black HDPE Polyethylene)
  const guideTubeGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.45, 32, 1, true);
  const guideTubeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // High-Density Polyethylene (HDPE)
    metalness: 0.12,
    roughness: 0.38,
    bumpMap: hdpeBump,
    bumpScale: 0.015,
    side: THREE.DoubleSide
  });
  const guideTube = new THREE.Mesh(guideTubeGeo, guideTubeMat);
  guideTube.position.y = -CONFIG.BUOY_RADIUS_3D - 1.20;
  guideTube.userData = { subsystemId: 'keel', name: 'Structural HDPE Moonpool CTD Guide Tube' };
  keelGroup.add(guideTube);

  // HDPE White Depth Metric Graduation Mark Rings (0.5m, 1.0m, 1.5m)
  const gradMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  for (let g = 1; g <= 3; g++) {
    const gradRing = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.004, 6, 32), gradMat);
    gradRing.rotation.x = Math.PI / 2;
    gradRing.position.set(0, -CONFIG.BUOY_RADIUS_3D - 0.50 - g * 0.38, 0);
    keelGroup.add(gradRing);
  }

  // Secondary HDPE Umbilical Routing Tube (Runs parallel to main tube with P-clips)
  const umbilicalTubeGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.35, 16);
  const umbilicalTube = new THREE.Mesh(umbilicalTubeGeo, guideTubeMat);
  umbilicalTube.position.set(-0.32, -CONFIG.BUOY_RADIUS_3D - 1.20, 0.08);
  umbilicalTube.userData = { subsystemId: 'keel', name: 'HDPE Sensor Umbilical Conduit' };
  keelGroup.add(umbilicalTube);

  // Stainless Steel P-Clamp Brackets securing Umbilical to Flanges
  const clampMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  for (let cl = 0; cl < 3; cl++) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.03), clampMat);
    clamp.position.set(-0.29, -CONFIG.BUOY_RADIUS_3D - 0.70 - cl * 0.45, 0.05);
    keelGroup.add(clamp);
  }

  // Structural Reinforcement Rings along Guide Tube
  for (let r = 0; r < 3; r++) {
    const flange = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.02, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    flange.rotation.x = Math.PI / 2;
    flange.position.set(0, -CONFIG.BUOY_RADIUS_3D - 0.70 - r * 0.45, 0);
    keelGroup.add(flange);
  }

  // Bell-Mouth Docking Funnel / Receiver Collar at Bottom of Moonpool Tube
  // Conical funnel where the CTD sonde seats seamlessly upon recovery
  const funnelGeo = new THREE.CylinderGeometry(0.26, 0.38, 0.35, 32, 1, true);
  const funnelMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Marine high-visibility safety amber
    metalness: 0.75,
    roughness: 0.28,
    side: THREE.DoubleSide
  });
  const dockingFunnel = new THREE.Mesh(funnelGeo, funnelMat);
  dockingFunnel.position.y = -CONFIG.BUOY_RADIUS_3D - 1.95;
  dockingFunnel.userData = { subsystemId: 'keel', name: 'Subsea CTD Docking Receiver Funnel' };
  keelGroup.add(dockingFunnel);

  // Internal Guide Ribs inside the docking funnel (ensures zero misalignment when docking)
  const ribGeo = new THREE.BoxGeometry(0.02, 0.32, 0.08);
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
  for (let ri = 0; ri < 4; ri++) {
    const angle = (ri / 4) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.position.set(Math.cos(angle) * 0.30, -CONFIG.BUOY_RADIUS_3D - 1.95, Math.sin(angle) * 0.30);
    rib.rotation.y = -angle;
    keelGroup.add(rib);
  }

  // Heavy Hydrodynamic Ballast Counterweight Ring (Keeps spar vertical with positive GM)
  const weightMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.09, 16, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.92 })
  );
  weightMesh.rotation.x = Math.PI / 2;
  weightMesh.position.y = -CONFIG.BUOY_RADIUS_3D - 1.82;
  keelGroup.add(weightMesh);

  // Anti-Tangle Standoff Fairlead Bracket (45° offset for CTD profiling clearance)
  const standoffArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.65, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 })
  );
  standoffArm.rotation.z = Math.PI / 3.8;
  standoffArm.position.set(0.32, -CONFIG.BUOY_RADIUS_3D - 1.70, 0);
  standoffArm.name = "standoff_arm";
  standoffArm.userData.partId = "tether";
  keelGroup.add(standoffArm);

  // Duplex 2205 Subsea Mooring Swivel
  const swivelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.018, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
  );
  swivelRing.position.set(0.56, -CONFIG.BUOY_RADIUS_3D - 1.95, 0);
  swivelRing.name = "swivel_ring";
  swivelRing.userData = { subsystemId: 'mooring', partId: 'tether', name: 'Duplex 2205 Subsea Mooring Swivel' };
  keelGroup.add(swivelRing);

  // ════════════════════════════════════════════════════════════════════════
  // 7. KEVLAR MOORING TETHER & SEABED CLUMP ANCHOR BLOCK
  // ════════════════════════════════════════════════════════════════════════
  const mooringGroup = new THREE.Group();
  mooringGroup.name = "kevlarMooringAssembly";

  // Heavy 350 kg Cast-Iron Sinker Block at Seabed (y = -48m) with Antarctic Benthic Biofouling
  const anchorY = -48.0;
  const benthicBioMap = generateBenthicBiofoulingMap();

  const anchorMat = new THREE.MeshStandardMaterial({
    color: 0x22303c,
    map: benthicBioMap,
    bumpMap: benthicBioMap,
    bumpScale: 0.02,
    metalness: 0.35,
    roughness: 0.82
  });

  const anchorBlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), anchorMat);
  anchorBlock.position.set(0, anchorY, 0);
  anchorBlock.castShadow = true;
  anchorBlock.receiveShadow = true;
  anchorBlock.name = "anchor_block";
  anchorBlock.userData = { subsystemId: 'mooring', partId: 'tether', name: '350kg Cast-Iron Clump Anchor (Benthic Biofouling)' };
  mooringGroup.add(anchorBlock);

  // Anti-drag Seabed Mud Flukes (digging teeth)
  for (let i = 0; i < 4; i++) {
    const flukeAngle = (i / 4) * Math.PI * 2;
    const fluke = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.9, 4),
      anchorMat
    );
    fluke.rotation.z = Math.PI;
    fluke.position.set(Math.cos(flukeAngle) * 1.35, anchorY - 0.45, Math.sin(flukeAngle) * 1.35);
    mooringGroup.add(fluke);
  }

  // Antarctic Benthic Cold-Water Macro-Algae (Himantothallus grandifolius & Desmarestia holdfasts)
  const kelpMat = new THREE.MeshStandardMaterial({
    color: 0x2e4a1f, // Deep Antarctic olive-kelp
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  // Clustered algae fronds attached to anchor corners & bail
  for (let k = 0; k < 8; k++) {
    const kAngle = (k / 8) * Math.PI * 2;
    const kelpGeo = new THREE.PlaneGeometry(0.35, 1.6 + (k % 3) * 0.4, 3, 6);
    const frond = new THREE.Mesh(kelpGeo, kelpMat);
    frond.position.set(
      Math.cos(kAngle) * 1.2 + (Math.random() - 0.5) * 0.4,
      anchorY + 0.6 + Math.random() * 0.3,
      Math.sin(kAngle) * 1.2 + (Math.random() - 0.5) * 0.4
    );
    frond.rotation.set(0.2, kAngle + 0.5, (Math.random() - 0.5) * 0.4);
    mooringGroup.add(frond);
  }

  // Surrounding Antarctic Seabed Silt & Dropstone Terrain Disc (y = -48.6m)
  const seabedMat = new THREE.MeshStandardMaterial({
    color: 0x0f1c28,
    roughness: 0.95,
    metalness: 0.05
  });
  const seabedDisc = new THREE.Mesh(new THREE.CylinderGeometry(20.0, 20.0, 0.2, 32), seabedMat);
  seabedDisc.position.set(0, anchorY - 0.6, 0);
  seabedDisc.receiveShadow = true;
  mooringGroup.add(seabedDisc);

  // Glacial Dropstone Boulders on Seabed
  const dropstoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
  for (let b = 0; b < 6; b++) {
    const bAngle = (b / 6) * Math.PI * 2 + 0.4;
    const bDist = 3.5 + (b % 3) * 2.2;
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.45 + (b % 2) * 0.35, 1),
      dropstoneMat
    );
    boulder.position.set(Math.cos(bAngle) * bDist, anchorY - 0.45, Math.sin(bAngle) * bDist);
    boulder.rotation.set(Math.random(), Math.random(), Math.random());
    mooringGroup.add(boulder);
  }

  // Antarctic Benthic Red Sea Stars (Odontaster validus)
  const starMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
  for (let s = 0; s < 3; s++) {
    const sAngle = s * 2.1 + 0.5;
    const sDist = 1.9 + s * 1.2;
    const seaStar = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.08, 5), starMat);
    seaStar.position.set(Math.cos(sAngle) * sDist, anchorY - 0.48, Math.sin(sAngle) * sDist);
    seaStar.rotation.x = Math.PI / 2;
    mooringGroup.add(seaStar);
  }

  // Anchor recovery bail & acoustic release canister
  const releaseCanister = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.9, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 })
  );
  releaseCanister.position.set(0, anchorY + 1.1, 0);
  releaseCanister.name = "release_canister";
  releaseCanister.userData = { subsystemId: 'mooring', partId: 'tether', name: 'Acoustic Release Transponder' };
  mooringGroup.add(releaseCanister);

  // Golden-Yellow High-Visibility Kevlar-29 Braided Mooring Line
  const tetherSegments = 32;
  const tetherPoints = [];
  for (let i = 0; i <= tetherSegments; i++) {
    const t = i / tetherSegments;
    tetherPoints.push(new THREE.Vector3(0, anchorY + t * (-anchorY), 0));
  }
  const tetherGeo = new THREE.BufferGeometry().setFromPoints(tetherPoints);
  const tetherMat = new THREE.LineBasicMaterial({
    color: 0xeab308, // High-visibility Kevlar gold
    linewidth: 3
  });
  const tetherLine = new THREE.Line(tetherGeo, tetherMat);
  tetherLine.name = "tether_line";
  tetherLine.userData.partId = "tether";
  mooringGroup.add(tetherLine);

  buoyRoot.add(hullGroup);
  buoyRoot.add(solarGroup);
  buoyRoot.add(mastGroup);
  buoyRoot.add(electronicsBayGroup);
  buoyRoot.add(winchGroup);
  buoyRoot.add(keelGroup);

  // Damped Physical Spar Buoy 6-DOF Hydrodynamics & Watch-Circle Compliance
  let surgePos = 0.0;
  let surgeVel = 0.0;
  let swayPos = 0.0;
  let swayVel = 0.0;
  let heavePos = 0.0;
  let heaveVel = 0.0;
  let pitchAngle = 0.0;
  let pitchVel = 0.0;
  let rollAngle = 0.0;
  let rollVel = 0.0;
  let yawAngle = 0.0;

  // Collect all interactive subsea meshes for raycasting
  const interactiveMeshes = [
    pcbBoard,
    esp32Can,
    loraCan,
    batteryHeaterPad,
    chassisHeaterPad,
    motorMesh,
    drumMesh,
    cableCoil,
    slipRingCapsule,
    swivelRing,
    anchorBlock,
    releaseCanister,
    ...solarPatches,
    ...batteryCells
  ];

  return {
    buoyRoot,
    mooringGroup,
    hullGroup,
    solarGroup,
    mastGroup,
    electronicsBayGroup,
    winchGroup,
    keelGroup,
    strobeMat,
    drumMesh,
    acrylicWindow,
    interactiveMeshes,
    getWinchExitWorldPosition: (target = new THREE.Vector3()) => {
      buoyRoot.updateMatrixWorld(true);
      return target.set(0, -CONFIG.BUOY_RADIUS_3D - 1.95, 0).applyMatrix4(buoyRoot.matrixWorld);
    },
    getDockedWorldPosition: (target = new THREE.Vector3()) => {
      buoyRoot.updateMatrixWorld(true);
      return target.set(0, -CONFIG.BUOY_RADIUS_3D - 2.70, 0).applyMatrix4(buoyRoot.matrixWorld);
    },
    update: (time, waveElevation, waveSurgeX = 0, waveSurgeZ = 0, explodedFactor = 0, targetPitch = 0, targetRoll = 0, isBursting = false, delta = 0.016, currentFlow = { x: 0.45, z: 0.25 }, isInspecting = false, heaterState = null) => {
      // ════════════════════════════════════════════════════════════════════════
      // 1. HORIZONTAL WATCH CIRCLE & CURRENT FLOW HYDRODYNAMICS
      // ════════════════════════════════════════════════════════════════════════
      // Mean drag pulls buoy down-current + wave orbital surge oscillates buoy back & forth
      const targetSurge = currentFlow.x * 2.2 + waveSurgeX * 1.6;
      const targetSway = currentFlow.z * 2.2 + waveSurgeZ * 1.6;

      // 2nd-order compliant Kevlar tether restoring spring & fluid damping
      const tetherSpringK = 2.4;
      const fluidDampingC = 1.65;

      const surgeForce = (targetSurge - surgePos) * tetherSpringK;
      surgeVel += (surgeForce - surgeVel * fluidDampingC) * delta;
      surgePos += surgeVel * delta;
      buoyRoot.position.x = surgePos;

      const swayForce = (targetSway - swayPos) * tetherSpringK;
      swayVel += (swayForce - swayVel * fluidDampingC) * delta;
      swayPos += swayVel * delta;
      buoyRoot.position.z = swayPos;

      // ════════════════════════════════════════════════════════════════════════
      // 2. VERTICAL HEAVE DYNAMICS (Wave buoyant restoration)
      // ════════════════════════════════════════════════════════════════════════
      const heaveSpringK = 2.4;
      const heaveDampingC = 2.2;

      const heaveForce = (waveElevation - heavePos) * heaveSpringK;
      heaveVel += (heaveForce - heaveVel * heaveDampingC) * delta;
      heavePos += heaveVel * delta;
      buoyRoot.position.y = heavePos;

      // ════════════════════════════════════════════════════════════════════════
      // 3. PITCH, ROLL & YAW (Wave slopes + tether tension moment)
      // ════════════════════════════════════════════════════════════════════════
      const rightingK = 3.2;
      const rightingC = 2.2;

      // Current drag tilts the spar slightly down-current against tether tension
      const tetherPitchMoment = currentFlow.z * 0.12;
      const tetherRollMoment = -currentFlow.x * 0.12;

      const pForce = (targetPitch + tetherPitchMoment - pitchAngle) * rightingK;
      pitchVel += (pForce - pitchVel * rightingC) * delta;
      pitchAngle += pitchVel * delta;
      buoyRoot.rotation.x = pitchAngle;

      const rForce = (targetRoll + tetherRollMoment - rollAngle) * rightingK;
      rollVel += (rForce - rollVel * rightingC) * delta;
      rollAngle += rollVel * delta;
      buoyRoot.rotation.z = rollAngle;

      if (isInspecting) {
        // Zero-shake rock-solid inspection: smoothly damp buoy pitching and rolling
        pitchVel *= 0.15;
        rollVel *= 0.15;
        pitchAngle *= 0.80;
        rollAngle *= 0.80;
        buoyRoot.rotation.x = pitchAngle;
        buoyRoot.rotation.z = rollAngle;
      }

      // Hydrodynamic weathercocking: buoy yaw gently aligns with downstream ocean current
      const flowHeading = Math.atan2(currentFlow.x, currentFlow.z);
      yawAngle += (flowHeading - yawAngle) * Math.min(1.0, delta * 1.5);
      buoyRoot.rotation.y = yawAngle;

      // ════════════════════════════════════════════════════════════════════════
      // 4. KEVLAR TETHER CATENARY UPDATE
      // ════════════════════════════════════════════════════════════════════════
      const tetherPosAttr = tetherGeo.attributes.position;
      const tetherArr = tetherPosAttr.array;
      const buoyKeelX = buoyRoot.position.x;
      const buoyKeelY = buoyRoot.position.y - CONFIG.BUOY_RADIUS_3D - 1.95;
      const buoyKeelZ = buoyRoot.position.z;

      // Compute catenary sag bowed by current drag
      const currentSagX = currentFlow.x * 1.4;
      const currentSagZ = currentFlow.z * 1.4;

      for (let i = 0; i <= tetherSegments; i++) {
        const t = i / tetherSegments;
        const idx = i * 3;
        // Parabolic catenary sag function (zero at anchor and buoy, maximum in midwater column)
        const sag = Math.sin(t * Math.PI) * 1.2;

        tetherArr[idx] = t * buoyKeelX + sag * currentSagX;
        tetherArr[idx + 1] = anchorY + t * (buoyKeelY - anchorY);
        tetherArr[idx + 2] = t * buoyKeelZ + sag * currentSagZ;
      }
      tetherPosAttr.needsUpdate = true;

      // ════════════════════════════════════════════════════════════════════════
      // 5. TELEMETRY STATUS LEDS
      // ════════════════════════════════════════════════════════════════════════
      // SYS_OK: Smooth breathing pulse
      const sysPulse = (Math.sin(time * 3.5) * 0.5 + 0.5);
      ledSysOkMat.color.setRGB(0.06 * sysPulse, 0.72 * sysPulse, 0.50 * sysPulse);

      // LORA_TX: Burst pulse when communicating or beaconing
      const loraPulse = isBursting ? (Math.sin(time * 18.0) > 0 ? 1.0 : 0.1) : (Math.sin(time * 1.5) > 0.85 ? 1.0 : 0.05);
      ledLoraTxMat.color.setRGB(0.96 * loraPulse, 0.62 * loraPulse, 0.04 * loraPulse);

      // CTD_RX: Blinking sensor bus activity
      const ctdPulse = Math.sin(time * 6.0) > 0.4 ? 1.0 : 0.08;
      ledCtdRxMat.color.setRGB(0.22 * ctdPulse, 0.74 * ctdPulse, 0.97 * ctdPulse);

      // ════════════════════════════════════════════════════════════════════════
      // 5B. PHASE 6B: THERMAL & POWER-BUDGET DYNAMIC VISUALS
      // ════════════════════════════════════════════════════════════════════════
      if (heaterState) {
        const isTripped = !!heaterState.isTripped;
        const isOverheat = !!heaterState.isOverheat;
        const isOverWattage = !!heaterState.isOverWattage;
        const temp = heaterState.temperature !== undefined ? heaterState.temperature : 3.8;
        const power = heaterState.powerWatts || 0.0;
        const isPowerOn = power > 0.05 && !isTripped;

        // 1. OVER-WATTAGE VISUALS:
        // Total load > source limit => battery supply wires pulse rapidly, power chip/MPPT blinks alert color
        if (isOverWattage) {
          const wirePulse = (Math.sin(time * 20.0) * 0.5 + 0.5);
          if (wireBatPos && wireBatPos.material) {
            wireBatPos.material.emissive = wireBatPos.material.emissive || new THREE.Color();
            wireBatPos.material.emissive.setRGB(1.0 * wirePulse, 0.18 * wirePulse, 0.02 * wirePulse);
            wireBatPos.material.emissiveIntensity = 2.2;
          }
          if (wireBatNeg && wireBatNeg.material) {
            wireBatNeg.material.emissive = wireBatNeg.material.emissive || new THREE.Color();
            wireBatNeg.material.emissive.setRGB(0.85 * wirePulse, 0.15 * wirePulse, 0.02 * wirePulse);
            wireBatNeg.material.emissiveIntensity = 1.6;
          }

          // MPPT Heat Sink & BMS board alert blink (6 Hz square wave)
          const alertBlink = (Math.sin(time * 12.0) > 0.0 ? 1.0 : 0.0);
          if (mpptHeatSink && mpptHeatSink.material) {
            mpptHeatSink.material.emissive = mpptHeatSink.material.emissive || new THREE.Color();
            mpptHeatSink.material.emissive.setRGB(0.95 * alertBlink, 0.25 * alertBlink, 0.05 * alertBlink);
            mpptHeatSink.material.emissiveIntensity = 1.4;
          }
          if (bmsBoard && bmsBoard.material) {
            bmsBoard.material.emissive = bmsBoard.material.emissive || new THREE.Color();
            bmsBoard.material.emissive.setRGB(0.90 * alertBlink, 0.15 * alertBlink, 0.05 * alertBlink);
            bmsBoard.material.emissiveIntensity = 1.2;
          }
        } else {
          // Normal wiring & power chip
          if (wireBatPos && wireBatPos.material && wireBatPos.material.emissive) wireBatPos.material.emissive.setRGB(0, 0, 0);
          if (wireBatNeg && wireBatNeg.material && wireBatNeg.material.emissive) wireBatNeg.material.emissive.setRGB(0, 0, 0);
          if (mpptHeatSink && mpptHeatSink.material && mpptHeatSink.material.emissive) mpptHeatSink.material.emissive.setRGB(0, 0, 0);
          if (bmsBoard && bmsBoard.material && bmsBoard.material.emissive) bmsBoard.material.emissive.setRGB(0, 0, 0);
        }

        // 2. OVERHEAT & HEATER PAD VISUALS:
        // Overheat => pad gradient orange to white-hot, heat shimmer above pad, faint thermal glow on neighbors
        // Protection trip => pad goes dark, chip says CUTOFF
        if (isTripped) {
          // PROTECTION TRIP: Pad goes dark, heat shimmer disappears, LED cutoff alert
          heatingPadMat.emissive = heatingPadMat.emissive || new THREE.Color();
          heatingPadMat.emissive.setRGB(0.0, 0.0, 0.0);
          heatingPadMat.emissiveIntensity = 0.0;
          heatShimmerMat.uniforms.uIntensity.value = 0.0;

          // LED indicates bimetallic cutoff (solid red warning)
          ledHeaterMat.color.setRGB(0.95, 0.05, 0.05);

          // Neighbors return to cold dark
          if (batteryTrayMat.emissive) batteryTrayMat.emissive.setRGB(0, 0, 0);
          if (cellMat.emissive) cellMat.emissive.setRGB(0, 0, 0);
        } else if (temp > 35.0 || isOverheat) {
          // OVERHEAT: Severe thermal state (>35°C up to +65°C)
          // Pad gradient: from fiery orange (0xf97316) to incandescent white-hot (0xffffff)
          const overheatNorm = Math.min(1.0, Math.max(0.0, (temp - 35.0) / 25.0));
          const r = 1.0;
          const g = 0.45 + 0.55 * overheatNorm; // 0.45 -> 1.0
          const b = 0.08 + 0.92 * overheatNorm; // 0.08 -> 1.0
          heatingPadMat.emissive = heatingPadMat.emissive || new THREE.Color();
          heatingPadMat.emissive.setRGB(r, g, b);
          heatingPadMat.emissiveIntensity = 1.4 + 2.1 * overheatNorm; // Up to 3.5 intensity (incandescent white-hot)

          // Heat shimmer active and undulating above the battery pad
          heatShimmerMat.uniforms.uIntensity.value = 0.4 + 0.6 * overheatNorm;
          heatShimmerMat.uniforms.uTime.value = time;

          // Faint thermal glow on neighboring battery enclosure, cells and heat pipe
          const neighborGlow = 0.25 + 0.55 * overheatNorm;
          batteryTrayMat.emissive = batteryTrayMat.emissive || new THREE.Color();
          batteryTrayMat.emissive.setRGB(0.55 * neighborGlow, 0.12 * neighborGlow, 0.02 * neighborGlow);
          batteryTrayMat.emissiveIntensity = 0.8;

          cellMat.emissive = cellMat.emissive || new THREE.Color();
          cellMat.emissive.setRGB(0.40 * neighborGlow, 0.08 * neighborGlow, 0.01 * neighborGlow);
          cellMat.emissiveIntensity = 0.6;

          // LED burns bright emergency red-amber
          ledHeaterMat.color.setRGB(1.0, 0.25, 0.02);
        } else if (isPowerOn) {
          // NORMAL HEATING: Pad emits warm amber glow (0xb45309)
          const heatBreath = 0.5 + 0.5 * (Math.sin(time * 3.0) * 0.5 + 0.5);
          heatingPadMat.emissive = heatingPadMat.emissive || new THREE.Color();
          heatingPadMat.emissive.setRGB(0.85 * heatBreath, 0.42 * heatBreath, 0.05 * heatBreath);
          heatingPadMat.emissiveIntensity = 0.5;

          // Heat shimmer zero at normal low temperature
          heatShimmerMat.uniforms.uIntensity.value = 0.0;

          // Normal amber telemetry LED
          const heatPulse = 0.4 + 0.6 * (Math.sin(time * 2.5) * 0.5 + 0.5);
          ledHeaterMat.color.setRGB(0.96 * heatPulse, 0.58 * heatPulse, 0.08 * heatPulse);

          if (batteryTrayMat.emissive) batteryTrayMat.emissive.setRGB(0, 0, 0);
          if (cellMat.emissive) cellMat.emissive.setRGB(0, 0, 0);
        } else {
          // NORMAL IDLE: Heater off (within hysteresis comfort band 3.0°C - 5.0°C)
          heatingPadMat.emissive = heatingPadMat.emissive || new THREE.Color();
          heatingPadMat.emissive.setRGB(0.0, 0.0, 0.0);
          heatingPadMat.emissiveIntensity = 0.0;
          heatShimmerMat.uniforms.uIntensity.value = 0.0;
          ledHeaterMat.color.setRGB(0.12, 0.08, 0.02); // Dim standby amber
          if (batteryTrayMat.emissive) batteryTrayMat.emissive.setRGB(0, 0, 0);
          if (cellMat.emissive) cellMat.emissive.setRGB(0, 0, 0);
        }
      } else {
        // Fallback when heaterState is not supplied
        const heatPulse = 0.4 + 0.6 * (Math.sin(time * 2.5) * 0.5 + 0.5);
        ledHeaterMat.color.setRGB(0.96 * heatPulse, 0.58 * heatPulse, 0.08 * heatPulse);
      }

      // 6. IALA-Standard Polar Maritime Strobe (Fl (2) Y 4s Rhythmic Double-Burst)
      const strobeCycle = time % 4.0;
      const isFlash1 = strobeCycle >= 0.0 && strobeCycle < 0.14;
      const isFlash2 = strobeCycle >= 0.38 && strobeCycle < 0.52;
      const isFlashing = isFlash1 || isFlash2;

      if (isFlashing) {
        strobeMat.emissiveIntensity = 12.5;
        strobeLight.intensity = 4.2;
      } else {
        strobeMat.emissiveIntensity = 0.18;
        strobeLight.intensity = 0.0;
      }

      // 7. Waterline Contact Foam Lapping & Swell Oscillation
      const foamPulse = Math.sin(time * 2.6) * 0.08;
      foamRingMesh.scale.set(1.0 + foamPulse, 1.0 + foamPulse, 1.0);
      foamRingMat.opacity = 0.45 + Math.sin(time * 2.1) * 0.15;
    }
  };
}
