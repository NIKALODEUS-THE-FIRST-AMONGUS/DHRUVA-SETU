import * as THREE from 'three';

/**
 * VFX Procedural PBR Texture Generator
 * Creates micro-surface bump, roughness, and normal maps directly on CanvasTexture buffers,
 * giving studio-grade material tactile detail without external asset dependencies.
 */

// 1. HDPE Orange-Peel Bump Map (Micro-textured Polyethylene)
export function generateHDPEBumpMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Neutral mid-gray base
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Layer 1: High frequency Perlin-style noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Multi-frequency noise
      const n1 = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 22;
      const n2 = Math.sin(x * 0.45 + y * 0.35) * 14;
      const grain = (Math.random() - 0.5) * 18;
      const val = Math.min(255, Math.max(0, 128 + n1 + n2 + grain));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

// 2. Anisotropic Brushed Titanium & Aluminum Map
export function generateBrushedMetalMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Longitudinal brushed grooves
  for (let i = 0; i < size; i++) {
    const darkness = 110 + Math.random() * 45;
    ctx.strokeStyle = `rgb(${darkness},${darkness},${darkness})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  texture.needsUpdate = true;
  return texture;
}

// 3. Glacier Ice Fracture & Vein Normal Map
export function generateIceFractureMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Normal map neutral base: (128, 128, 255)
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  // Draw fracture lines & stress cracks
  ctx.strokeStyle = 'rgba(160, 160, 255, 0.7)';
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 18; i++) {
    let px = Math.random() * size;
    let py = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let step = 0; step < 7; step++) {
      px += (Math.random() - 0.5) * 80;
      py += Math.random() * 60;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

// 4. Organic Wet Seal Epidermal Bump Map
export function generateSealSkinBumpMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  // Streamlined wet mammalian fur flow & micro-creases
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Directional hair flow along Y axis with fine lateral ripple
      const hairFlow = Math.sin(x * 1.8 + Math.sin(y * 0.15) * 4.0) * 10.0;
      const microPores = Math.sin(x * 4.0) * Math.cos(y * 4.0) * 6.0;
      const noise = (Math.random() - 0.5) * 16.0;
      const v = Math.min(255, Math.max(0, 128 + hairFlow + microPores + noise));
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

// 4B. Photorealistic Antarctic Weddell Seal Mottled Pelt Albedo Map
export function generateWeddellSealPelt() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base dorsal-to-ventral smooth gradient (Dark slate back -> Pale silvery belly)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
  baseGrad.addColorStop(0.00, '#111827'); // Deep dorsal charcoal
  baseGrad.addColorStop(0.25, '#1e293b'); // Rich slate grey
  baseGrad.addColorStop(0.50, '#334155'); // Mid-flank cool grey
  baseGrad.addColorStop(0.75, '#64748b'); // Lower flank silvery grey
  baseGrad.addColorStop(1.00, '#94a3b8'); // Pale ventral blubber belly
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Layer 1: Large soft mottled patches (Weddell seal signature dappling)
  for (let i = 0; i < 90; i++) {
    const px = Math.random() * size;
    // Concentrate dapples along midriff and flanks
    const py = (0.25 + Math.random() * 0.65) * size;
    const radX = 14 + Math.random() * 32;
    const radY = 8 + Math.random() * 18;
    const rot = (Math.random() - 0.5) * 0.8;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    const isLightDapple = Math.random() > 0.45;
    ctx.fillStyle = isLightDapple ? 'rgba(226, 232, 240, 0.28)' : 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Layer 2: Fine dark leopard-like rosettes and speckles
  for (let j = 0; j < 450; j++) {
    const sx = Math.random() * size;
    const sy = (0.15 + Math.random() * 0.80) * size;
    const r = 2.0 + Math.random() * 5.5;

    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 23, 42, 0.45)' : 'rgba(241, 245, 249, 0.30)';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 3: Organic wet hair grain overlay
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const grain = (Math.random() - 0.5) * 12.0;
      data[idx] = Math.min(255, Math.max(0, data[idx] + grain));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + grain));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + grain));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// 5. Monocrystalline Solar Photovoltaic Grid Map with Triple Busbars & Wafer Chamfers
export function generateSolarCellTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep anti-reflective textured marine silicon blue-violet
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0.0, '#040d1a');
  bgGrad.addColorStop(0.5, '#071830');
  bgGrad.addColorStop(1.0, '#0a2347');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Monocrystalline wafer cut chamfers at cell borders
  ctx.strokeStyle = '#020813';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Subtle wafer crystalline grain
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 1.2));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 1.5));
  }
  ctx.putImageData(imgData, 0, 0);

  // Triple high-conductivity silver busbars (standard 3BB solar cell architecture)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3.5;
  const busbars = [size * 0.22, size * 0.50, size * 0.78];
  busbars.forEach(bx => {
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, size);
    ctx.stroke();

    // Busbar ribbon solder pads at ends
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(bx - 4, 0, 8, 14);
    ctx.fillRect(bx - 4, size - 14, 8, 14);
  });

  // Fine screen-printed silver contact fingers (64 micro-lines per cell)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 0.9;
  const fingerCount = 64;
  for (let i = 0; i < fingerCount; i++) {
    const y = (i / fingerCount) * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

// 5B. Waterline Rime Ice & Frozen Salt Crust Map
export function generateRimeIceTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Transparent background for natural blending over the hull
  ctx.clearRect(0, 0, size, size);

  // White and glacial-cyan hoarfrost crystal spires
  for (let i = 0; i < 220; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 4 + Math.random() * 20;

    const radGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
    radGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.65)');
    radGrad.addColorStop(0.85, 'rgba(186, 230, 253, 0.25)');
    radGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dendritic ice needle streaks (crystallized freezing spray)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.2;
  for (let s = 0; s < 180; s++) {
    let px = Math.random() * size;
    let py = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(px, py);
    const steps = 4 + Math.floor(Math.random() * 4);
    for (let st = 0; st < steps; st++) {
      px += (Math.random() - 0.5) * 16;
      py += Math.random() * 12; // Freezing gravity drip direction
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(4, 1);
  texture.needsUpdate = true;
  return texture;
}

// 6. Smooth Seamless Polar Ocean Normal Map (Multi-scale capillary ripples, silky fluid sheen)
export function generateWaterNormalMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Generate heightfield with multi-scale continuous fluid harmonics
  const heights = new Float32Array(size * size);
  const pi2 = Math.PI * 2.0;

  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;

      // Toroidal coordinates for 100% seamless tileable texture wrapping
      const u = nx * pi2;
      const v = ny * pi2;

      // Multi-frequency directional fluid wave harmonics
      let h = Math.sin(u * 1.5 + Math.cos(v * 2.0)) * 0.35;
      h += Math.cos(u * 3.0 - Math.sin(v * 2.5)) * 0.25;
      h += Math.sin(u * 6.0 + v * 5.0) * 0.18;
      h += Math.cos(u * 11.0 - v * 9.0) * 0.12;
      h += Math.sin(u * 22.0 + v * 18.0) * 0.06;
      h += Math.cos(u * 38.0 - v * 32.0) * 0.03;
      // High-frequency capillary ripples
      h += (Math.sin(u * 70.0 + Math.cos(v * 60.0)) + Math.cos(u * 55.0 - v * 75.0)) * 0.015;

      heights[y * size + x] = h;
    }
  }

  // Calculate tangent space surface normals via central difference Sobel-style gradient
  const strength = 3.2;
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;

    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;

      const dx = (heights[y * size + xNext] - heights[y * size + xPrev]) * strength;
      const dy = (heights[yNext * size + x] - heights[yPrev * size + x]) * strength;

      // Tangent space normal vector (dx, dy, 1.0) normalized
      const len = Math.sqrt(dx * dx + dy * dy + 1.0);
      const nx = (-dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (1.0 / len) * 0.5 + 0.5;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(nx * 255);
      data[idx + 1] = Math.round(ny * 255);
      data[idx + 2] = Math.round(nz * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 6B. High-Detail Custom PCB Motherboard Texture (Nodal Centre Hardware Booth)
export function generatePCBTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep Matte Navy FR4 Solder Mask (ISRO / NCPOR Space & Oceanographic Spec)
  ctx.fillStyle = '#051b2c';
  ctx.fillRect(0, 0, size, size);

  // Micro-woven fiberglass substrate crosshatch texture
  ctx.fillStyle = 'rgba(12, 45, 75, 0.35)';
  for (let i = 0; i < size; i += 4) {
    ctx.fillRect(i, 0, 1.5, size);
    ctx.fillRect(0, i, size, 1.5);
  }

  // Large Copper Ground / Power Pours (Hatched & Solid Zones)
  ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
  ctx.fillRect(40, 40, size - 80, size - 80);

  // High-Precision Gold ENIG Circuit Bus Traces (Electroless Nickel Immersion Gold)
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const mainTraces = [
    // Power rails (+12V, +5V, +3.3V)
    [[60, 60], [300, 60], [340, 100], [340, 420]],
    [[80, 80], [280, 80], [320, 120], [320, 420]],
    [[100, 100], [260, 100], [300, 140], [300, 420]],
    // SPI & I2C high-speed differential pairs to sensors
    [[380, 80], [540, 80], [590, 130], [590, 320]],
    [[390, 100], [530, 100], [570, 140], [570, 320]],
    [[640, 90], [800, 90], [860, 150], [860, 420]],
    [[650, 110], [790, 110], [840, 160], [840, 420]],
    // Winch driver & encoder feedback tracks
    [[90, 520], [260, 520], [320, 580], [320, 840]],
    [[110, 540], [240, 540], [300, 600], [300, 840]],
    [[130, 560], [220, 560], [280, 620], [280, 840]],
    // RF Sub-GHz 433MHz feedline with coplanar waveguide clearance
    [[720, 480], [840, 480], [890, 530], [890, 780]],
    [[710, 500], [820, 500], [870, 550], [870, 780]],
    // Halocline telemetry bus
    [[420, 460], [600, 460], [660, 520], [660, 860]],
    [[440, 480], [580, 480], [640, 540], [640, 860]],
    [[180, 880], [480, 880], [540, 820], [820, 820]],
    [[200, 900], [460, 900], [520, 840], [800, 840]]
  ];

  mainTraces.forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.stroke();
  });

  // Secondary fine signal traces (0.8mm equivalent)
  ctx.strokeStyle = '#e6ca65';
  ctx.lineWidth = 1.6;
  for (let r = 0; r < 24; r++) {
    const sx = 120 + (r * 34) % 760;
    const sy = 160 + (r * 41) % 680;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 45, sy);
    ctx.lineTo(sx + 75, sy + 30);
    ctx.lineTo(sx + 130, sy + 30);
    ctx.stroke();
  }

  // Thermal Via Arrays & Gold Test Points
  ctx.fillStyle = '#fef08a';
  for (let x = 70; x < size - 70; x += 32) {
    for (let y = 70; y < size - 70; y += 32) {
      if ((x * 3 + y * 5) % 11 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#051b2c';
        ctx.beginPath();
        ctx.arc(x, y, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
      }
    }
  }

  // High-Density SMD IC Solder Pad Footprints
  // 1. ESP32-S3 QFN-56 perimeter pads
  ctx.fillStyle = '#fde047';
  const espX = 420;
  const espY = 240;
  const espSize = 140;
  for (let p = 0; p < 14; p++) {
    const offset = 14 + p * 8.5;
    // Top & Bottom
    ctx.fillRect(espX + offset, espY - 6, 5.5, 12);
    ctx.fillRect(espX + offset, espY + espSize - 6, 5.5, 12);
    // Left & Right
    ctx.fillRect(espX - 6, espY + offset, 12, 5.5);
    ctx.fillRect(espX + espSize - 6, espY + offset, 12, 5.5);
  }
  // ESP32 central exposed thermal ground pad
  ctx.fillRect(espX + 24, espY + 24, espSize - 48, espSize - 48);

  // 2. LoRa SX1278 SOIC-16 Footprint
  const loraX = 720;
  const loraY = 240;
  for (let p = 0; p < 8; p++) {
    const py = loraY + 12 + p * 12;
    ctx.fillRect(loraX - 8, py, 14, 6);
    ctx.fillRect(loraX + 80, py, 14, 6);
  }

  // 3. Multi-pin Molex & Terminal Header Strips
  const headers = [
    { x: 80, y: 380, count: 10, vert: true },
    { x: 80, y: 720, count: 8, vert: true },
    { x: 500, y: 920, count: 12, vert: false },
    { x: 880, y: 720, count: 8, vert: true }
  ];
  headers.forEach(h => {
    ctx.fillStyle = '#fde047';
    for (let i = 0; i < h.count; i++) {
      const px = h.vert ? h.x : h.x + i * 16;
      const py = h.vert ? h.y + i * 16 : h.y;
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#051b2c';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde047';
    }
  });

  // Crisp Pure-White Silkscreen Typography & Alignment Marks (SIH 26065 Polar Observatory)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText('DHRUVA SETU // SIH 26065', 70, 50);

  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText('NCPOR-ISRO POLAR OBSERVATORY MOTHERBOARD (REV 3.2)', 70, 75);
  ctx.fillText('EAST ANTARCTICA MIZ // PRYDZ BAY HYDROLOGY HARNESS', 70, 94);

  // Silkscreen Outlines & Component Legends
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  
  // U1 ESP32 Outline
  ctx.strokeRect(espX - 16, espY - 16, espSize + 32, espSize + 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillText('U1: ESP32-S3 (240MHz DUAL-CORE XTENSA)', espX - 10, espY - 24);

  // U2 LoRa Outline
  ctx.strokeRect(loraX - 18, loraY - 10, 120, 120);
  ctx.fillText('U2: SX1278 (433MHz +20dBm)', loraX - 12, loraY - 18);

  // U3 MPPT Outline
  ctx.strokeRect(100, 220, 160, 110);
  ctx.fillText('U3: BQ24650 MPPT 18V', 108, 210);

  // U4 Stepper Driver Outline
  ctx.strokeRect(100, 520, 180, 140);
  ctx.fillText('U4: TMC2209 STEALTHCHOP', 108, 510);

  // Port Identification Labels
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('J1: 4S2P LiFePO4 POWER', 75, 365);
  ctx.fillText('J2: PV ARRAY INPUT', 75, 705);
  ctx.fillText('J3: WINCH STEPPER & OPTICAL ENCODER', 460, 950);
  ctx.fillText('J4: CTD UMBILICAL SLIP RING', 760, 705);

  // Test Points
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText('TP1: +3.3V', 400, 50);
  ctx.fillText('TP2: +5.0V', 490, 50);
  ctx.fillText('TP3: +12.8V', 580, 50);
  ctx.fillText('TP4: GND', 680, 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 6C. Official Bharati Station Concrete Helipad Texture
export function generateHelipadTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Weathered concrete base
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, size, size);

  // Outer yellow safety circle
  const center = size / 2;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(center, center, 210, 0, Math.PI * 2);
  ctx.stroke();

  // White inner circle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(center, center, 175, 0, Math.PI * 2);
  ctx.stroke();

  // Bold White 'H' Landing Target
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 180px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', center, center);

  // Heliport ID marking
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillStyle = '#facc15';
  ctx.fillText('BHARATI STATION HELIPORT', center, 65);
  ctx.fillText('NCPOR // 69°24\'S 76°11\'E', center, size - 45);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 7. Organic Polar Ocean Foam / Wake Texture (High-Res Cellular Lace & Froth)
export function generateOceanFoamMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  const pi2 = Math.PI * 2.0;

  // Multi-frequency cellular lace algorithm with organic foam froth
  for (let y = 0; y < size; y++) {
    const ny = y / size;
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const u = nx * pi2;
      const v = ny * pi2;

      // 1. Primary Voronoi-like cellular membrane lace
      const f1 = Math.sin(u * 5.0 + Math.sin(v * 4.0));
      const f2 = Math.cos(u * 9.0 - Math.cos(v * 8.0));
      const f3 = Math.sin(u * 16.0 + v * 14.0);
      const laceCell = Math.abs(f1 * 0.5 + f2 * 0.35 + f3 * 0.15);
      
      // 2. Secondary bubble micro-froth
      const b1 = Math.sin(u * 32.0 + Math.cos(v * 28.0));
      const b2 = Math.cos(u * 48.0 - v * 44.0);
      const microBubbles = Math.max(0, (b1 * 0.6 + b2 * 0.4) - 0.25) * 1.33;

      // 3. Turbulent streakiness
      const turbulence = Math.sin(u * 3.0 + v * 2.0 + Math.cos(u * 7.0)) * 0.25 + 0.75;

      // Combine: high opacity along filament walls, semi-transparent bubble centers
      const laceIntensity = Math.pow(laceCell, 3.2);
      const combined = Math.min(1.0, (laceIntensity * 0.75 + microBubbles * 0.45) * turbulence);

      const val = Math.min(255, Math.max(0, Math.round(combined * 255)));

      const idx = (y * size + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = val;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 8. Authentic Indian Tricolor Flag (Tiranga) with 24-spoke Ashoka Chakra
export function generateIndianFlagTexture() {
  const width = 600;
  const height = 400; // Standard 3:2 flag ratio
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const stripeH = height / 3;

  // 1. Saffron (Top)
  ctx.fillStyle = '#FF9933';
  ctx.fillRect(0, 0, width, stripeH);

  // 2. White (Middle)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, stripeH, width, stripeH);

  // 3. India Green (Bottom)
  ctx.fillStyle = '#128807';
  ctx.fillRect(0, stripeH * 2, width, stripeH);

  // 4. Ashoka Chakra (Navy Blue 24-spoke wheel in center of white band)
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = stripeH * 0.42;

  ctx.strokeStyle = '#000088';
  ctx.lineWidth = 3.5;

  // Outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Central hub
  ctx.fillStyle = '#000088';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // 24 Spokes
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// 12. Antarctic Benthic Cold-Water Moss, Biofouling & Algae Map
export function generateBenthicBiofoulingMap() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Oxidized dark cast-iron foundation
  ctx.fillStyle = '#1c2631';
  ctx.fillRect(0, 0, size, size);

  // Layer 1: Mottled deep cold-water benthic algae (Himantothallus / Desmarestia)
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 15 + Math.random() * 45;

    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    const colors = ['#28421c', '#375424', '#47682d', '#54461c', '#203217'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    grad.addColorStop(0, col);
    grad.addColorStop(0.7, col + 'cc');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 2: Calcified polar bryozoan & diatomaceous micro-fouling flecks
  ctx.fillStyle = 'rgba(209, 213, 219, 0.45)';
  for (let i = 0; i < 400; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    const pr = Math.random() * 2.5 + 0.8;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 3: Subsea rust bleed oxidation veins
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * 30;
      cy += Math.random() * 25 + 5;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Kapton Polyimide Flexible Heating Pad Texture
 * Features:
 * - Amber/gold translucent polyimide film base
 * - Etched serpentine zig-zag copper/nichrome resistive heating element grid
 * - Solder terminal tabs and polar thermal management silk legend (-40°C spec)
 */
export function generateHeatingPadTexture() {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 1. Translucent Amber Polyimide (Kapton) Base Film
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#d97706');
  bgGrad.addColorStop(0.5, '#b45309');
  bgGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle fiberglass mesh substrate backing
  ctx.strokeStyle = 'rgba(254, 215, 170, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // 2. Etched Serpentine Heating Grid (Continuous Copper/Nichrome resistive trace)
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const margin = 36;
  const traceSpacing = 28;
  const yStart = margin + 30;
  const yEnd = size - margin - 30;
  const xLeft = margin + 20;
  const xRight = size - margin - 20;

  ctx.beginPath();
  let currentY = yStart;
  let goingRight = true;
  ctx.moveTo(xLeft, currentY);

  while (currentY <= yEnd) {
    const targetX = goingRight ? xRight : xLeft;
    ctx.lineTo(targetX, currentY);
    currentY += traceSpacing;
    if (currentY <= yEnd) {
      ctx.arcTo(goingRight ? xRight + 12 : xLeft - 12, currentY - traceSpacing / 2, targetX, currentY, 12);
      ctx.lineTo(goingRight ? xRight : xLeft, currentY);
    }
    goingRight = !goingRight;
  }
  ctx.stroke();

  // Glow shadow pass for etched depth
  ctx.strokeStyle = 'rgba(180, 83, 9, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 3. Solder Connection Terminal Pads
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(margin + 20, yStart, 9, 0, Math.PI * 2);
  ctx.arc(margin + 20, yEnd, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#dc2626'; // Red terminal indicator (+)
  ctx.beginPath();
  ctx.arc(margin + 20, yStart, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a'; // Black terminal indicator (-)
  ctx.beginPath();
  ctx.arc(margin + 20, yEnd, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Engineering Silkscreen Technical Legend
  ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('SIH-26065 // POLAR HEATING ELEMENT', margin + 40, margin + 18);
  ctx.font = '9px monospace';
  ctx.fillText('12V DC  |  15W  |  POLYIMIDE SUBSTRATE  |  -40°C RATED', margin + 40, size - margin - 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}



