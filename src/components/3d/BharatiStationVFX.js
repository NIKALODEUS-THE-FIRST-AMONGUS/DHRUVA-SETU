import * as THREE from 'three';
import { generateIndianFlagTexture, generateHelipadTexture, generateBrushedMetalMap } from './ProceduralTextures';

/**
 * World-Class Architectural Reconstruction of Bharati Station (Larsemann Hills, East Antarctica)
 * Based on the award-winning bof Architekten / Kaulquappe design for NCPOR / MoES:
 * 1. Aerodynamic Faceted Habitat Building (Insulated brushed aluminum & graphite composite skin)
 * 2. Elevated Heavy Structural Steel Pilings with Cross-bracing (blizzard drift clearance)
 * 3. 180° Cantilevered Panoramic Thermal Observation Lounge with Warm Amber Interior Light
 *    - Easter Egg: Steaming Chai Thermos Flask ("Chai at -40°C") & Expedition Field Desk
 * 4. ISRO Ground Station Tracking Radome & Satellite Microwave Dish Gantry
 * 5. Official Concrete Helipad with High-Visibility Yellow Ring & White 'H' Target
 * 6. 18-meter Communications Steel Lattice Mast with Grand Waving Indian National Flag (Tiranga)
 * 7. Indian Polar Expedition Icebreaker Vessel & Fast-Ice Zodiac
 */
export function createBharatiStation(ocean) {
  const group = new THREE.Group();
  group.name = "bharatiStationGroup";

  const flagTexture = generateIndianFlagTexture();
  const helipadTexture = generateHelipadTexture();
  const brushedMetal = generateBrushedMetalMap();

  // Waving Cloth Shader for the Indian National Flag
  const flagVertShader = `
    uniform float u_time;
    uniform float u_waveSpeed;
    varying vec2 vUv;
    varying vec3 vNormalVec;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float flyFactor = uv.x;
      float wave1 = sin(pos.x * 3.5 - u_time * u_waveSpeed) * 0.18 * flyFactor;
      float wave2 = cos(pos.x * 6.5 - u_time * (u_waveSpeed * 1.4) + pos.y * 2.0) * 0.08 * flyFactor;
      float wave3 = sin(pos.y * 4.5 - u_time * 2.8) * 0.04 * flyFactor;

      pos.z += wave1 + wave2;
      pos.y += wave3;

      vNormalVec = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const flagFragShader = `
    uniform sampler2D u_flagTexture;
    uniform float u_opacity;
    varying vec2 vUv;
    varying vec3 vNormalVec;

    void main() {
      vec4 texColor = texture2D(u_flagTexture, vUv);
      float light = abs(dot(vNormalVec, normalize(vec3(0.5, 0.8, 0.5)))) * 0.30 + 0.82;
      vec3 finalColor = texColor.rgb * light;
      gl_FragColor = vec4(finalColor, texColor.a * u_opacity);
    }
  `;

  const flagMats = [];

  function createWavingFlag(width, height, speed = 5.0) {
    const geo = new THREE.PlaneGeometry(width, height, 24, 16);
    geo.translate(width / 2, 0, 0);

    const mat = new THREE.ShaderMaterial({
      vertexShader: flagVertShader,
      fragmentShader: flagFragShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_waveSpeed: { value: speed },
        u_flagTexture: { value: flagTexture },
        u_opacity: { value: 1.0 }
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true
    });

    flagMats.push(mat);
    return new THREE.Mesh(geo, mat);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. BHARATI RESEARCH BASE (Larsemann Hills Coastal Ridge)
  // ════════════════════════════════════════════════════════════════════════
  const stationGroup = new THREE.Group();
  stationGroup.position.set(-78, 4.5, -92);

  // A. Authentic Multi-tiered Larsemann Hills Solid Granulite/Gneiss Bedrock Promontory
  // The Larsemann Hills is an ice-free Antarctic oasis of exposed dark gneiss/granite bedrock.
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x242831, // Deep weathered Antarctic metamorphic charnockite/gneiss
    roughness: 0.94,
    metalness: 0.15,
    flatShading: true
  });
  const rockLayer2Mat = new THREE.MeshStandardMaterial({
    color: 0x374151, // Layered rocky plateau terrace
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true
  });
  const screeMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937, // Shoreline talus & frost-shattered boulders
    roughness: 0.96,
    metalness: 0.08,
    flatShading: true
  });

  // 1. Massive Primary Bedrock Promontory (Solid continental rock mass extending to coastline)
  const mainBedrockMass = new THREE.Mesh(new THREE.CylinderGeometry(42, 65, 16, 12), rockMat);
  mainBedrockMass.position.set(-2, -3.5, -2);
  stationGroup.add(mainBedrockMass);

  // 2. Stepped Continental Bedrock Ridge & Plateau
  const plateauTerrace = new THREE.Mesh(new THREE.BoxGeometry(52, 9, 38), rockLayer2Mat);
  plateauTerrace.position.set(4, 2.5, -6);
  plateauTerrace.rotation.y = 0.18;
  stationGroup.add(plateauTerrace);

  // 3. Coastal Granite Cliff Face & Boulder Shoreline (Grounding firmly into seabed)
  const coastalCliff = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 28), rockMat);
  coastalCliff.position.set(-16, 1.0, 10);
  coastalCliff.rotation.y = -0.22;
  stationGroup.add(coastalCliff);

  // 4. Natural frost-shattered permafrost scree crags around station perimeter
  for (let ri = 0; ri < 8; ri++) {
    const rAngle = (ri / 8) * Math.PI * 2;
    const rDist = 24 + (ri % 3) * 6;
    const crag = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5 + (ri % 2) * 2.0, 0), screeMat);
    crag.position.set(Math.cos(rAngle) * rDist, 1.5, Math.sin(rAngle) * rDist);
    crag.scale.set(1.4, 0.8, 1.2);
    stationGroup.add(crag);
  }

  // B. Structural Heavy Steel Pilings (Anchored directly into solid bedrock)
  const stiltMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
    bumpMap: brushedMetal,
    bumpScale: 0.008
  });

  const stiltPositions = [
    [-14, 3], [-14, -3],
    [-7, 3],  [-7, -3],
    [0, 3],   [0, -3],
    [7, 3],   [7, -3],
    [14, 3],  [14, -3]
  ];

  stiltPositions.forEach(([sx, sz]) => {
    const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.44, 7.5, 12), stiltMat);
    stilt.position.set(sx, 7.2, sz);
    stationGroup.add(stilt);

    // Diagonal seismic & blizzard wind cross-brace
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6.2, 8), stiltMat);
    brace.position.set(sx, 6.5, sz * 0.4);
    brace.rotation.x = sz > 0 ? 0.35 : -0.35;
    stationGroup.add(brace);
  });

  // C. The Main Aerodynamic Building Envelope (Faceted Aluminum Cladding)
  const aluMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc, // Matte insulated aluminum
    roughness: 0.32,
    metalness: 0.75,
    bumpMap: brushedMetal,
    bumpScale: 0.012
  });
  const anthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark anthracite structural composite
    roughness: 0.40,
    metalness: 0.60
  });
  const orangeAccentMat = new THREE.MeshStandardMaterial({
    color: 0xea580c, // Official NCPOR Antarctic high-vis orange
    roughness: 0.35,
    metalness: 0.35
  });

  // Lower Floor Level (Container modules)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(32, 4.2, 11), anthraciteMat);
  lowerBody.position.set(0, 11.0, 0);
  stationGroup.add(lowerBody);

  // Upper Floor Level with Cantilevered Observation Nose
  const upperBody = new THREE.Mesh(new THREE.BoxGeometry(36, 4.4, 11.6), aluMat);
  upperBody.position.set(2.0, 14.8, 0);
  stationGroup.add(upperBody);

  // Aerodynamic Beveled Windward Nose (Facing East Antarctic katabatic winds)
  const noseGeo = new THREE.CylinderGeometry(5.8, 5.8, 4.4, 4);
  noseGeo.rotateY(Math.PI / 4);
  const noseMesh = new THREE.Mesh(noseGeo, orangeAccentMat);
  noseMesh.position.set(20.0, 14.8, 0);
  stationGroup.add(noseMesh);

  // Orange Architectural Identification Band
  const idBand = new THREE.Mesh(new THREE.BoxGeometry(36.2, 0.9, 11.8), orangeAccentMat);
  idBand.position.set(2.0, 13.0, 0);
  stationGroup.add(idBand);

  // D. 180° Panoramic Observation Lounge with Warm Amber Interior Light
  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transmission: 0.65,
    opacity: 0.85,
    transparent: true,
    roughness: 0.1,
    metalness: 0.1,
    ior: 1.52
  });
  const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(26, 1.8, 0.4), windowGlassMat);
  windowGlass.position.set(2.0, 15.2, 5.9);
  stationGroup.add(windowGlass);

  // Warm Amber Interior Laboratory Glow
  const warmGlowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
  const glowStrip = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 0.2), warmGlowMat);
  glowStrip.position.set(2.0, 15.6, 5.6);
  stationGroup.add(glowStrip);

  // Point light casting warm glow on station deck
  const interiorLight = new THREE.PointLight(0xfbbf24, 2.5, 35, 1.5);
  interiorLight.position.set(2.0, 15.0, 4.5);
  stationGroup.add(interiorLight);

  // ── EASTER EGG 3: Steaming Chai Thermos & Field Notebook in Observation Lounge ──
  const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x78350f }));
  deskMesh.position.set(4.0, 14.0, 5.2);
  stationGroup.add(deskMesh);

  // Stainless steel Indian chai thermos flask
  const flaskBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.6, 16),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
  );
  flaskBody.position.set(3.2, 14.4, 5.2);
  stationGroup.add(flaskBody);

  const flaskCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.12, 0.16, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  flaskCap.position.set(3.2, 14.75, 5.2);
  stationGroup.add(flaskCap);

  // Little steamy steel cup with chai
  const cupMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.06, 0.14, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 })
  );
  cupMesh.position.set(3.7, 14.15, 5.2);
  stationGroup.add(cupMesh);

  // Research field laptop
  const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.35), anthraciteMat);
  laptopBase.position.set(4.8, 14.1, 5.2);
  stationGroup.add(laptopBase);
  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.35, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  laptopScreen.position.set(4.8, 14.3, 5.05);
  laptopScreen.rotation.x = -0.25;
  stationGroup.add(laptopScreen);

  // E. Official Concrete Helipad Platform
  const helipadPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(11, 11.5, 1.2, 24),
    new THREE.MeshStandardMaterial({
      map: helipadTexture,
      roughness: 0.75,
      metalness: 0.15
    })
  );
  helipadPlatform.position.set(-26.0, 7.8, 8.0);
  stationGroup.add(helipadPlatform);

  // Helipad concrete support pillars
  for (let hi = 0; hi < 4; hi++) {
    const angle = (hi / 4) * Math.PI * 2;
    const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 7.5, 8), stiltMat);
    hp.position.set(-26 + Math.cos(angle) * 7.5, 3.8, 8 + Math.sin(angle) * 7.5);
    stationGroup.add(hp);
  }

  // Helipad perimeter approach beacons (pulsing green/amber)
  for (let li = 0; li < 8; li++) {
    const angle = (li / 8) * Math.PI * 2;
    const lightMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: li % 2 === 0 ? 0x10b981 : 0xf59e0b })
    );
    lightMesh.position.set(-26 + Math.cos(angle) * 10.5, 8.6, 8 + Math.sin(angle) * 10.5);
    stationGroup.add(lightMesh);
  }

  // F. ISRO Ground Station Geodesic Tracking Radome & Antenna Gantry
  const gantryPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(9.0, 0.6, 9.0),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
  );
  gantryPlatform.position.set(16.0, 17.5, -4.0);
  stationGroup.add(gantryPlatform);

  // ISRO Geodesic Radome (White sphere with faceted telemetry pattern)
  const isroRadome = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.08 })
  );
  isroRadome.position.set(16.0, 18.0, -4.0);
  stationGroup.add(isroRadome);

  // Parabolic Microwave Satellite Dish Antenna
  const dishMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 0.4, 0.8, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
  );
  dishMesh.position.set(12.0, 19.5, -7.0);
  dishMesh.rotation.x = 0.55;
  dishMesh.rotation.y = 0.45;
  stationGroup.add(dishMesh);

  // G. 18-Meter Communication Lattice Mast & Grand Indian National Flag (Tiranga)
  const mastBaseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.55, 20.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
  );
  mastBaseMesh.position.set(-10.0, 22.0, -2.0);
  stationGroup.add(mastBaseMesh);

  // Yardarm crossbar
  const yardarm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
  );
  yardarm.position.set(-10.0, 30.5, -2.0);
  yardarm.rotation.z = Math.PI / 2;
  stationGroup.add(yardarm);

  // Indian National Flag (Large 7.2m x 4.8m with 24-spoke Ashoka Chakra)
  // Rotated towards camera view to showcase the Tricolor waving without edge-on distortion
  const stationFlag = createWavingFlag(7.2, 4.8, 5.2);
  stationFlag.position.set(-9.8, 28.0, -2.0);
  stationFlag.rotation.y = 0.55;
  stationGroup.add(stationFlag);

  // Aviation obstruction strobe beacon on pinnacle
  const beaconMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.40, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beaconMesh.position.set(-10.0, 32.2, -2.0);
  stationGroup.add(beaconMesh);

  // H. Auxiliary ISO Shipping Containers & Bunkering (NCPOR Safety Orange & Navy)
  const containerColors = [0xea580c, 0x0284c7, 0x1e293b, 0xea580c];
  for (let ci = 0; ci < 4; ci++) {
    const cMesh = new THREE.Mesh(
      new THREE.BoxGeometry(6.0, 2.6, 2.4),
      new THREE.MeshStandardMaterial({ color: containerColors[ci], roughness: 0.45, metalness: 0.35 })
    );
    cMesh.position.set(-10 + ci * 6.5, 4.8, -18.0);
    stationGroup.add(cMesh);
  }

  group.add(stationGroup);

  // ════════════════════════════════════════════════════════════════════════
  // 2. INDIAN POLAR EXPEDITION ICEBREAKER SHIP
  // ════════════════════════════════════════════════════════════════════════
  const shipGroup = new THREE.Group();
  shipGroup.position.set(72, 0, -68);
  shipGroup.rotation.y = -Math.PI * 0.65;

  // Icebreaker Red Lower Belt
  const hullLower = new THREE.Mesh(
    new THREE.BoxGeometry(42, 5.0, 10.5),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.25 })
  );
  hullLower.position.y = 1.4;
  shipGroup.add(hullLower);

  // Slanted heavy icebreaker bow
  const bowGeo = new THREE.CylinderGeometry(0.6, 5.4, 10.5, 4);
  bowGeo.rotateZ(Math.PI / 2);
  const bowMesh = new THREE.Mesh(bowGeo, new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45 }));
  bowMesh.position.set(21.0, 2.0, 0);
  shipGroup.add(bowMesh);

  // Upper Hull (Deep Navy Blue)
  const hullUpper = new THREE.Mesh(
    new THREE.BoxGeometry(40, 3.6, 10.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.4 })
  );
  hullUpper.position.y = 4.8;
  shipGroup.add(hullUpper);

  // Multi-tier White Superstructure & Wheelhouse
  const superMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.2 });
  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(20, 3.8, 8.8), superMat);
  deck1.position.set(-2.0, 7.5, 0);
  shipGroup.add(deck1);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(11, 3.2, 9.2), superMat);
  bridge.position.set(-1.0, 10.8, 0);
  shipGroup.add(bridge);

  // Panoramic Wheelhouse Bridge Windows
  const bridgeWindows = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 1.1, 9.4),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  bridgeWindows.position.set(-0.8, 11.2, 0);
  shipGroup.add(bridgeWindows);

  // Satellite Tracking Domes on Ship Superstructure
  const shipRadome1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), superMat);
  shipRadome1.position.set(-7.5, 10.5, 2.4);
  shipGroup.add(shipRadome1);

  const shipRadome2 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 12), superMat);
  shipRadome2.position.set(-7.5, 10.5, -2.4);
  shipGroup.add(shipRadome2);

  // Ship Radar & Communications Mast
  const shipMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 12.0, 8),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85, roughness: 0.2 })
  );
  shipMast.position.set(-2.0, 17.0, 0);
  shipGroup.add(shipMast);

  // Stern Jackstaff & Indian Tricolor Flag (5.4m x 3.6m)
  const sternPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.10, 0.14, 7.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
  );
  sternPole.position.set(-20.0, 9.5, 0);
  sternPole.rotation.z = -0.18;
  shipGroup.add(sternPole);

  const shipFlag = createWavingFlag(5.4, 3.6, 5.0);
  shipFlag.position.set(-19.8, 12.0, 0);
  shipGroup.add(shipFlag);

  // Deck Cargo Crane (Antarctic Yellow)
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const craneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 3.5, 8), craneMat);
  craneBase.position.set(11.0, 6.8, 2.2);
  shipGroup.add(craneBase);

  const craneJib = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.45, 0.45), craneMat);
  craneJib.position.set(15.5, 9.5, 2.2);
  craneJib.rotation.z = 0.35;
  shipGroup.add(craneJib);

  group.add(shipGroup);

  // ════════════════════════════════════════════════════════════════════════
  // 3. FAST-ICE EXPEDITION ZODIAC BOAT
  // ════════════════════════════════════════════════════════════════════════
  const zodiacGroup = new THREE.Group();
  zodiacGroup.position.set(-24, 0, -22);
  zodiacGroup.rotation.y = 0.85;

  const pontoonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const pontoonLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 5.5, 10), pontoonMat);
  pontoonLeft.rotateZ(Math.PI / 2);
  pontoonLeft.position.set(0, 0.30, -1.05);
  zodiacGroup.add(pontoonLeft);

  const pontoonRight = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 5.5, 10), pontoonMat);
  pontoonRight.rotateZ(Math.PI / 2);
  pontoonRight.position.set(0, 0.30, 1.05);
  zodiacGroup.add(pontoonRight);

  const bowPontoon = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.45, 8, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.7 })
  );
  bowPontoon.position.set(2.5, 0.30, 0);
  bowPontoon.rotation.y = Math.PI / 2;
  zodiacGroup.add(bowPontoon);

  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.16, 1.7),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 })
  );
  floorMesh.position.set(0.2, 0.12, 0);
  zodiacGroup.add(floorMesh);

  // Zodiac Indian Pennant
  const zodiacPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 })
  );
  zodiacPole.position.set(-2.2, 1.35, 0.65);
  zodiacGroup.add(zodiacPole);

  const zodiacFlag = createWavingFlag(1.8, 1.1, 6.2);
  zodiacFlag.position.set(-2.15, 2.1, 0.65);
  zodiacGroup.add(zodiacFlag);

  group.add(zodiacGroup);

  // Freeze static world matrices for non-animated architectural structures
  group.updateMatrixWorld(true);
  group.traverse(obj => {
    if (obj.isMesh && obj.parent !== shipGroup && obj.parent !== zodiacGroup && !obj.material?.isShaderMaterial) {
      obj.matrixAutoUpdate = false;
    }
  });

  // Overall smooth target visibility
  let targetOpacity = 0.0;
  let currentOpacity = 0.0;

  return {
    group,
    setTargetRegion: (regionId, cameraPreset) => {
      targetOpacity = (regionId === 'bharati_station' || cameraPreset === 'station' || cameraPreset === 'ship') ? 1.0 : 0.0;
      if (targetOpacity === 1.0) {
        group.visible = true;
      }
    },
    setCameraPreset: (preset) => {
      if (preset === 'station' || preset === 'ship') {
        targetOpacity = 1.0;
        group.visible = true;
      }
    },
    update: (time) => {
      currentOpacity += (targetOpacity - currentOpacity) * 0.08;
      
      if (currentOpacity < 0.005) {
        group.visible = false;
        return;
      }
      group.visible = true;

      flagMats.forEach(mat => {
        mat.uniforms.u_time.value = time;
        mat.uniforms.u_opacity.value = currentOpacity;
      });

      if (shipGroup.visible) {
        const shipH = ocean.getWaveHeight(shipGroup.position.x, shipGroup.position.z);
        shipGroup.position.y = shipH * 0.45;
        shipGroup.rotation.z = Math.sin(time * 0.8) * 0.016;
        shipGroup.rotation.x = Math.cos(time * 0.6) * 0.012;
      }

      if (zodiacGroup.visible) {
        const zH = ocean.getWaveHeight(zodiacGroup.position.x, zodiacGroup.position.z);
        zodiacGroup.position.y = zH * 0.92;
        zodiacGroup.rotation.z = Math.sin(time * 1.5) * 0.038;
        zodiacGroup.rotation.x = Math.cos(time * 1.3) * 0.032;
      }
    }
  };
}
