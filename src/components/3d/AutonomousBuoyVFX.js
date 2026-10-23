import * as THREE from 'three';
import { CONFIG } from '../../constants/config';
import { generateHDPEBumpMap, generateSolarCellTexture, generateBrushedMetalMap, generatePCBTexture, generateBenthicBiofoulingMap, generateHeatingPadTexture } from './ProceduralTextures';

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
  hullBackMesh.castShadow = true;
  hullBackMesh.receiveShadow = true;
  hullGroup.add(hullBackMesh);

  // Bottom hull cap
  const hullBottomGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D, 48, 16, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.42);
  const hullBottomMesh = new THREE.Mesh(hullBottomGeo, hullMat);
  hullGroup.add(hullBottomMesh);

  // Top collar rim
  const hullTopGeo = new THREE.SphereGeometry(CONFIG.BUOY_RADIUS_3D, 48, 16, 0, Math.PI * 2, 0, Math.PI * 0.32);
  const hullTopMesh = new THREE.Mesh(hullTopGeo, hullMat);
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
  hullGroup.add(acrylicWindow);

  // SOLAS Waterline Reflective Equator Band (with opening for front cutaway window)
  const bandGeo = new THREE.CylinderGeometry(CONFIG.BUOY_RADIUS_3D * 1.008, CONFIG.BUOY_RADIUS_3D * 1.008, 0.16, 48, 1, true, 0.30 * Math.PI, 1.40 * Math.PI);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.35 });
  const bandMesh = new THREE.Mesh(bandGeo, bandMat);
  hullGroup.add(bandMesh);

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
    patch.userData = { subsystemId: 'solar', name: 'Conformal Solar Photovoltaic Shell' };
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

  // Internal Payload Bay Illumination (Studio glow for inspection - calibrated for clean bloom)
  const bayCyanLight = new THREE.PointLight(0x38bdf8, 0.45, 1.8);
  bayCyanLight.position.set(0.12, 0.30, 0.35);
  electronicsBayGroup.add(bayCyanLight);

  const bayAmberLight = new THREE.PointLight(0xf59e0b, 0.35, 1.6);
  bayAmberLight.position.set(-0.20, 0.25, 0.30);
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
  esp32Can.userData = { subsystemId: 'pcb', name: 'Avionics Motherboard & Dual-Core Gateway' };
  electronicsBayGroup.add(esp32Can);

  // ESP32 Chip Pins / Lead frame
  const pinMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });
  const pinStripL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.22), pinMat);
  pinStripL.position.set(-0.29, 0.10, -0.06);
  electronicsBayGroup.add(pinStripL);
  const pinStripR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.22), pinMat);
  pinStripR.position.set(-0.03, 0.10, -0.06);
  electronicsBayGroup.add(pinStripR);

  // Animated Telemetry Status LEDs on Motherboard
  // 1. SYS_OK (Breathing Green LED)
  const ledSysOkMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const ledSysOk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledSysOkMat);
  ledSysOk.position.set(-0.24, 0.11, 0.10);
  electronicsBayGroup.add(ledSysOk);

  // 2. LORA_TX (Flashing Amber Burst LED)
  const ledLoraTxMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const ledLoraTx = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledLoraTxMat);
  ledLoraTx.position.set(-0.20, 0.11, 0.10);
  electronicsBayGroup.add(ledLoraTx);

  // 3. CTD_RX (Blinking Cyan Sensor Bus LED)
  const ledCtdRxMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const ledCtdRx = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), ledCtdRxMat);
  ledCtdRx.position.set(-0.16, 0.11, 0.10);
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
  // Electrolytic Power Decoupling Capacitors (Metallic silver cylinders with black ground stripe)
  const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  const capTopMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  for (let c = 0; c < 3; c++) {
    const capCan = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.055, 12), capMat);
    capCan.position.set(-0.28 + c * 0.06, 0.12, 0.20);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.005, 12), capTopMat);
    capTop.position.set(capCan.position.x, 0.15, capCan.position.z);
    electronicsBayGroup.add(capCan);
    electronicsBayGroup.add(capTop);
  }

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
  electronicsBayGroup.add(mpptHeatSink);

  const toroidGeo = new THREE.TorusGeometry(0.035, 0.015, 8, 20);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 });
  const toroidMesh = new THREE.Mesh(toroidGeo, coilMat);
  toroidMesh.rotation.x = Math.PI / 2;
  toroidMesh.position.set(-0.04, 0.11, 0.20);
  electronicsBayGroup.add(toroidMesh);

  // E. 4S2P LiFePO4 Subsea Battery Bank (Transparent blue wrap with gold copper busbars)
  const cellMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.75,
    clearcoat: 0.8
  });
  const cellGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.24, 16);
  const batteryCells = [];

  for (let row = 0; row < 2; row++) {
    for (let col = -1; col <= 2; col++) {
      const cell = new THREE.Mesh(cellGeo, cellMat);
      cell.position.set(col * 0.10 - 0.05, -0.20, row * 0.10 - 0.15);
      cell.userData = { subsystemId: 'battery', name: '4S2P LiFePO4 Polar Battery Bank' };
      electronicsBayGroup.add(cell);
      batteryCells.push(cell);
    }
  }

  // Inter-cell Copper Busbars
  const busbarMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.92, roughness: 0.15 });
  for (let b = 0; b < 3; b++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.006, 0.02), busbarMat);
    bar.position.set(-0.10 + b * 0.10, -0.075, -0.15);
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
  batteryHeaterPad.userData = { subsystemId: 'heater', name: 'Flexible Polyimide Kapton Battery Heating Pad (-40°C)' };
  heaterGroup.add(batteryHeaterPad);

  // 2. Chassis Under-Deck Heating Pad (Thermal bed for avionics chamber)
  const chassisHeaterPad = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.012, 0.55), heatingPadMat);
  chassisHeaterPad.position.set(0, -0.345, 0.05);
  chassisHeaterPad.userData = { subsystemId: 'heater', name: 'Avionics Deck Thermal Anti-Freeze Heating Pad' };
  heaterGroup.add(chassisHeaterPad);

  // 3. Copper heat-pipe running along the battery tray
  const heaterBlockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
  const heatPipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.32, 12);
  const heatPipe = new THREE.Mesh(heatPipeGeo, heaterBlockMat);
  heatPipe.rotation.z = Math.PI / 2.5;
  heatPipe.position.set(0.08, -0.18, 0.02);
  heatPipe.userData = { subsystemId: 'heater', name: 'Sub-Zero PTC Thermal Anti-Freeze Core' };
  heaterGroup.add(heatPipe);

  // 4. Polar Thermal Active Status LED (Warm amber glow on PCB)
  const ledHeaterMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const ledHeater = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 8), ledHeaterMat);
  ledHeater.position.set(-0.12, 0.11, 0.10);
  ledHeater.userData = { subsystemId: 'heater', name: 'Polar Thermal Control Active Indicator' };
  heaterGroup.add(ledHeater);

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
  electronicsBayGroup.add(wireBatPos);

  const wireBatNeg = createCurvedWire([
    [-0.15, -0.08, -0.15],
    [-0.22, -0.04, -0.08],
    [-0.22, 0.04, 0.06],
    [-0.18, 0.09, 0.16],
    [-0.08, 0.09, 0.22]
  ], 0.009, 0x09090b); // Silicone Black
  electronicsBayGroup.add(wireBatNeg);

  // 2. Solar PV Infeed Wire Pair (Curving from Upper Dome through hull gland to MPPT)
  const wireSolar1 = createCurvedWire([
    [-0.20, 0.35, -0.10],
    [-0.22, 0.26, 0.05],
    [-0.18, 0.16, 0.18],
    [-0.12, 0.10, 0.24]
  ], 0.007, 0xf8fafc); // Solar White
  electronicsBayGroup.add(wireSolar1);

  const wireSolar2 = createCurvedWire([
    [-0.18, 0.35, -0.12],
    [-0.20, 0.26, 0.03],
    [-0.16, 0.16, 0.16],
    [-0.10, 0.10, 0.22]
  ], 0.007, 0x0284c7); // Solar Blue
  electronicsBayGroup.add(wireSolar2);

  // 3. Winch Stepper Motor 4-Wire Loom (Routing from TMC2209 driver to bottom pass-through)
  const wireWinch1 = createCurvedWire([
    [-0.28, 0.09, -0.14],
    [-0.30, 0.02, -0.16],
    [-0.28, -0.15, -0.16],
    [-0.24, -0.32, -0.10]
  ], 0.006, 0xef4444); // Stepper Coil A+ (Red)
  const wireWinch2 = createCurvedWire([
    [-0.26, 0.09, -0.14],
    [-0.28, 0.02, -0.16],
    [-0.26, -0.15, -0.16],
    [-0.22, -0.32, -0.10]
  ], 0.006, 0x10b981); // Stepper Coil A- (Green)
  const wireWinch3 = createCurvedWire([
    [-0.24, 0.09, -0.14],
    [-0.26, 0.02, -0.16],
    [-0.24, -0.15, -0.16],
    [-0.20, -0.32, -0.10]
  ], 0.006, 0x38bdf8); // Stepper Coil B+ (Cyan)
  const wireWinch4 = createCurvedWire([
    [-0.22, 0.09, -0.14],
    [-0.24, 0.02, -0.16],
    [-0.22, -0.15, -0.16],
    [-0.18, -0.32, -0.10]
  ], 0.006, 0xfbbf24); // Stepper Coil B- (Yellow)
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
  electronicsBayGroup.add(wireCoax);

  // 5. Sensor Bus Twisted Pair to Slip Ring (Green/Yellow I2C telemetry)
  const wireI2C_A = createCurvedWire([
    [0.08, 0.09, 0.24],
    [0.14, 0.02, 0.22],
    [0.18, -0.14, 0.16],
    [0.18, -0.32, 0.08]
  ], 0.005, 0x10b981);
  const wireI2C_B = createCurvedWire([
    [0.10, 0.09, 0.24],
    [0.16, 0.02, 0.22],
    [0.20, -0.14, 0.16],
    [0.20, -0.32, 0.08]
  ], 0.005, 0xf59e0b);
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
  antMesh.userData = { subsystemId: 'antenna', name: 'LoRa SX1278 433MHz High-Gain Whip Antenna' };
  mastGroup.add(antMesh);

  // Copper loading coil at base of whip antenna
  const coilGeo = new THREE.TorusGeometry(0.02, 0.006, 8, 20);
  const coilMesh = new THREE.Mesh(coilGeo, new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.95, roughness: 0.15 }));
  coilMesh.rotation.x = Math.PI / 2;
  coilMesh.position.set(0.08, CONFIG.BUOY_RADIUS_3D + 1.15, 0);
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
  gpsPatch.userData = { subsystemId: 'antenna', name: 'NavIC / GPS L1 Polar Positioning Patch' };
  mastGroup.add(gpsPatch);

  // Maritime Navigation Strobe LED
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xf97316,
    emissiveIntensity: 2.5,
    roughness: 0.1
  });
  const strobeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), strobeMat);
  strobeMesh.position.set(0, CONFIG.BUOY_RADIUS_3D + 1.45, 0);
  mastGroup.add(strobeMesh);

  // ════════════════════════════════════════════════════════════════════════
  // 5. SUBSEA WINCH & SLIP RING ASSEMBLY
  // ════════════════════════════════════════════════════════════════════════
  const drumGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.42, 32);
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.8 });
  const drumMesh = new THREE.Mesh(drumGeo, drumMat);
  drumMesh.rotation.z = Math.PI / 2;
  drumMesh.position.set(0, -CONFIG.BUOY_RADIUS_3D - 0.55, 0);
  drumMesh.userData = { subsystemId: 'motor', name: 'Winch Spool & CTD Cable Reel' };
  winchGroup.add(drumMesh);

  const cableCoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.32, 24),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55, metalness: 0.15 })
  );
  cableCoil.rotation.z = Math.PI / 2;
  cableCoil.position.copy(drumMesh.position);
  cableCoil.userData = { subsystemId: 'motor', name: 'Winch Spool & CTD Cable Reel' };
  winchGroup.add(cableCoil);

  // Winch Stepper Motor & Planetary Gearbox
  const motorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.28, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 })
  );
  motorMesh.rotation.z = Math.PI / 2;
  motorMesh.position.set(-0.35, drumMesh.position.y, 0);
  motorMesh.userData = { subsystemId: 'motor', name: 'NEMA-17 Winch Stepper Motor & Planetary Gearbox' };
  winchGroup.add(motorMesh);

  // Planetary Gearbox Reduction Flange
  const gearboxFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.20, 0.20, 0.06, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
  );
  gearboxFlange.rotation.z = Math.PI / 2;
  gearboxFlange.position.set(-0.20, drumMesh.position.y, 0);
  winchGroup.add(gearboxFlange);

  // High-Precision 12-Channel Gold-Alloy Sealed Rotary Slip Ring Capsule
  const slipRingCapsuleMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.18, metalness: 0.92 });
  const slipRingCapsule = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.20, 24),
    slipRingCapsuleMat
  );
  slipRingCapsule.rotation.z = Math.PI / 2;
  slipRingCapsule.position.set(0.30, drumMesh.position.y, 0);
  slipRingCapsule.userData = { subsystemId: 'motor', name: '12-Channel Gold Rotary Slip Ring Capsule' };
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
  keelGroup.add(standoffArm);

  // Duplex 2205 Subsea Mooring Swivel
  const swivelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.018, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.1 })
  );
  swivelRing.position.set(0.56, -CONFIG.BUOY_RADIUS_3D - 1.95, 0);
  swivelRing.userData = { subsystemId: 'mooring', name: 'Duplex 2205 Subsea Mooring Swivel' };
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
  anchorBlock.userData = { subsystemId: 'mooring', name: '350kg Cast-Iron Clump Anchor (Benthic Biofouling)' };
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
  releaseCanister.userData = { subsystemId: 'mooring', name: 'Acoustic Release Transponder' };
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
    interactiveMeshes,
    update: (time, waveElevation, waveSurgeX = 0, waveSurgeZ = 0, explodedFactor = 0, targetPitch = 0, targetRoll = 0, isBursting = false, delta = 0.016, currentFlow = { x: 0.45, z: 0.25 }, isInspecting = false) => {
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

      // HEATER_ON: Warm breathing pulse when thermal management is active
      const heatPulse = 0.4 + 0.6 * (Math.sin(time * 2.5) * 0.5 + 0.5);
      ledHeaterMat.color.setRGB(0.96 * heatPulse, 0.58 * heatPulse, 0.08 * heatPulse);

      // Mast safety strobe flash
      const flash = Math.sin(time * 6.28) > 0.65 ? 3.5 : 0.2;
      strobeMat.emissiveIntensity = flash;
    }
  };
}
