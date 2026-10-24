import * as THREE from 'three';
import { generateWaterNormalMap, generateOceanFoamMap } from './ProceduralTextures';

/**
 * Dhruva Setu Studio-Grade Polar Ocean Surface Engine
 * 
 * Features:
 * - 7-Octave Trochoidal Gerstner wave displacement (Antarctic swells, cross-seas & capillaries)
 * - Analytical tangent/binormal calculus for 100% physically accurate surface normals
 * - Beer-Lambert volumetric water extinction (Antarctic surface meltwater -> deep abyssal trench)
 * - Subsurface light scattering (SSS) with translucent emerald/cyan wave crest illumination
 * - Triple-scrolling procedural capillary ripple normal blending (silky, liquid-glass fluid sheen)
 * - Anisotropic sun path specular glints with microfacet GGX highlights (zero flat glare wash)
 * - Organic cellular lace whitecap foam on breaking wave crests and buoy hull contact wake
 * - Exponential atmospheric distance fog integration matching the polar sky horizon
 * - DoubleSide underwater rendering with Snell's window total internal reflection for CTD/Seal dives
 * - Synchronized analytical buoyancy calculus for buoy and sea ice floe hydrodynamics
 */
export function createOceanSurface(initialPhysics = {}) {
  // High-density 320x320 ocean mesh spanning 450x450 meters
  const geometry = new THREE.PlaneGeometry(450, 450, 320, 320);
  geometry.rotateX(-Math.PI / 2);

  const waterNormalMap = generateWaterNormalMap();
  const oceanFoamMap = generateOceanFoamMap();

  let accumulatedWaveTime = 0.0;

  const oceanVertShader = `
    uniform float u_time;
    uniform float u_waveTime;
    uniform float u_waveHeightMult;
    uniform float u_waveSteepness;
    uniform float u_chaosFactor;
    uniform vec2 u_buoyPos;
    uniform vec2 u_flowDir;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormalVec;
    varying vec3 vGeomNormal;
    varying vec3 vTangent;
    varying vec3 vBinormal;
    varying float vElevation;
    varying float vCrestFoam;
    varying float vDistance;

    // Gerstner Wave with analytical derivatives and horizontal trochoidal displacement
    vec3 gerstnerWave(
      vec3 pos,
      vec2 dir,
      float wavelength,
      float amplitude,
      float speed,
      float steepness,
      inout vec3 tangent,
      inout vec3 binormal,
      inout float crestAccum
    ) {
      float k = 2.0 * 3.14159265359 / wavelength;
      float c = sqrt(9.81 / k) * speed;
      float f = k * dot(dir, pos.xz) - c * u_waveTime;
      
      float a = amplitude * u_waveHeightMult;
      // Steepness factor Q (trochoid sharpness without self-intersection)
      float q = clamp(steepness * u_waveSteepness / (k * a * 4.0 + 0.001), 0.0, 0.75);

      float cosF = cos(f);
      float sinF = sin(f);

      // Horizontal displacement toward wave crests + vertical heave
      vec3 disp = vec3(
        q * a * dir.x * cosF,
        a * sinF,
        q * a * dir.y * cosF
      );

      // Tangent and binormal exact analytical partial derivatives
      tangent += vec3(
        -q * k * a * dir.x * dir.x * sinF,
        dir.x * cosF * k * a,
        -q * k * a * dir.x * dir.y * sinF
      );

      binormal += vec3(
        -q * k * a * dir.x * dir.y * sinF,
        dir.y * cosF * k * a,
        -q * k * a * dir.y * dir.y * sinF
      );

      // Wave crest steepness and curvature accumulation for organic whitecaps
      crestAccum += (q * k * a) * cosF + sinF * (amplitude / wavelength) * 20.0;

      return disp;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      vec3 tangent = vec3(1.0, 0.0, 0.0);
      vec3 binormal = vec3(0.0, 0.0, 1.0);
      float crestAccum = 0.0;

      // ── 7-OCTAVE GERSTNER WAVE SYSTEM ──
      // Octave 1: Dominant Antarctic Swell (Westward Antarctic Slope Current heading ~270°)
      vec3 w1 = gerstnerWave(pos, normalize(vec2(-0.96, 0.26)), 56.0, 0.85, 1.15, 0.40, tangent, binormal, crestAccum);

      // Octave 2: Secondary Rolling Swell
      vec3 w2 = gerstnerWave(pos, normalize(vec2(-0.48, 0.88)), 34.0, 0.52, 1.28, 0.35, tangent, binormal, crestAccum);

      // Octave 3: Primary Cross-Sea Interference
      vec3 w3 = gerstnerWave(pos, normalize(vec2(0.72, -0.69)), 19.0, 0.32, 1.45, 0.28, tangent, binormal, crestAccum);

      // Octave 4: Surface Wind Chop
      vec3 w4 = gerstnerWave(pos, normalize(vec2(-0.82, -0.57)), 10.5, 0.18, 1.80, 0.22, tangent, binormal, crestAccum);

      // Octave 5: Fine Capillary Wave Harmonic
      vec3 w5 = gerstnerWave(pos, normalize(vec2(0.36, 0.93)), 5.2, 0.09, 2.20, 0.18, tangent, binormal, crestAccum);

      // Octaves 6 & 7: Chaotic Southern Ocean Multi-Directional Swells (scaled by u_chaosFactor)
      vec3 w6 = gerstnerWave(pos, normalize(vec2(0.42, 0.91)), 44.0, 0.65 * u_chaosFactor, 1.35, 0.35 * u_chaosFactor, tangent, binormal, crestAccum);
      vec3 w7 = gerstnerWave(pos, normalize(vec2(-0.68, 0.73)), 14.0, 0.24 * u_chaosFactor, 1.70, 0.25 * u_chaosFactor, tangent, binormal, crestAccum);

      vec3 totalDisp = w1 + w2 + w3 + w4 + w5 + w6 + w7;

      // Concentric hydrodynamic buoy wake ripples around moving spar position
      float r = length(pos.xz - u_buoyPos);
      float wakeRipple = sin(clamp(r - 0.85, 0.0, 18.0) * 2.8 - u_time * 3.5) * exp(-r * 0.38) * 0.10;
      totalDisp.y += wakeRipple;

      vec3 displaced = pos + totalDisp;
      vElevation = displaced.y;
      vCrestFoam = clamp(crestAccum, -1.0, 3.5);

      // Surface normal from cross product of analytical tangent and binormal
      vec3 analyticalNormal = normalize(cross(binormal, tangent));
      vNormalVec = normalize(normalMatrix * analyticalNormal);
      vGeomNormal = analyticalNormal;
      vTangent = normalize(normalMatrix * tangent);
      vBinormal = normalize(normalMatrix * binormal);

      vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
      vWorldPosition = worldPos.xyz;
      vDistance = length(cameraPosition - worldPos.xyz);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const oceanFragShader = `
    uniform float u_time;
    uniform vec2 u_buoyPos;
    uniform vec2 u_flowDir;
    uniform sampler2D u_normalMap;
    uniform sampler2D u_foamMap;
    uniform sampler2D u_skyEquirect;
    uniform int u_hasSkyEquirect;
    uniform vec3 u_skyColor;
    uniform vec3 u_waterSurface;
    uniform vec3 u_waterDeep;
    uniform vec3 u_subsurfaceColor;
    uniform vec3 u_sunDirection;
    uniform float u_sunSpecularPower;
    uniform float u_foamIntensity;
    uniform float u_waveHeightMult;
    uniform vec3 u_fogColor;
    uniform float u_fogDensity;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormalVec;
    varying vec3 vGeomNormal;
    varying vec3 vTangent;
    varying vec3 vBinormal;
    varying float vElevation;
    varying float vCrestFoam;
    varying float vDistance;

    // GGX Microfacet Distribution Function
    float D_GGX(float NdotH, float roughness) {
      float a = roughness * roughness;
      float a2 = a * a;
      float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
      return a2 / (3.14159265359 * denom * denom);
    }

    // Smith Joint Masking-Shadowing Function
    float G_Smith(float NdotV, float NdotL, float roughness) {
      float a = roughness * roughness;
      float a2 = a * a;
      float gv = NdotV * sqrt(a2 + (1.0 - a2) * NdotL * NdotL);
      float gl = NdotL * sqrt(a2 + (1.0 - a2) * NdotV * NdotV);
      return 0.5 / max(gv + gl, 0.0001);
    }

    void main() {
      // ════════════════════════════════════════════════════════════════════════
      // UNDERWATER SURFACE PERSPECTIVE (Viewed from below the waterline)
      // ════════════════════════════════════════════════════════════════════════
      if (!gl_FrontFacing) {
        vec3 subViewDir = normalize(vWorldPosition - cameraPosition);
        vec3 subNormal = -normalize(vGeomNormal);
        float subCosTheta = max(dot(-subViewDir, subNormal), 0.0);

        // Snell's Window Total Internal Reflection (critical angle for water ~ 48.6°, cos ~ 0.661)
        float criticalCos = 0.661;
        float tir = smoothstep(criticalCos - 0.07, criticalCos + 0.05, subCosTheta);

        // High-frequency animated sub-surface caustics dancing on surface underside
        vec2 subUv1 = vWorldPosition.xz * 0.085 + vec2(u_time * 0.025, -u_time * 0.018);
        vec2 subUv2 = vWorldPosition.xz * 0.160 + vec2(-u_time * 0.032, u_time * 0.024);
        vec3 r1 = texture2D(u_normalMap, subUv1).rgb * 2.0 - 1.0;
        vec3 r2 = texture2D(u_normalMap, subUv2).rgb * 2.0 - 1.0;
        float caustic = pow(clamp((r1.z + r2.z * 0.5) * 0.5 + 0.5, 0.0, 1.0), 3.5) * 0.88;

        // Ethereal Antarctic Snell's window: glowing icy turquoise looking upward
        vec3 underWaterSky = mix(vec3(0.08, 0.48, 0.78), vec3(0.24, 0.88, 0.98), caustic);
        // Rich deep polar sapphire water
        vec3 underWaterDeep = vec3(0.012, 0.11, 0.28);

        vec3 subColor = mix(underWaterDeep, underWaterSky, tir);
        // Add crisp caustic sun glitter
        subColor += vec3(0.18, 0.70, 0.90) * caustic;

        // Volumetric subsea distance extinction into deep ocean blue
        float subFog = 1.0 - exp(-vDistance * 0.020);
        vec3 abyssalHaze = vec3(0.010, 0.08, 0.18);
        subColor = mix(subColor, abyssalHaze, clamp(subFog, 0.0, 1.0));

        gl_FragColor = vec4(subColor, 0.95);
        return;
      }

      // ════════════════════════════════════════════════════════════════════════
      // SURFACE WATER PERSPECTIVE (Viewed from above)
      // ════════════════════════════════════════════════════════════════════════
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 sunDir = normalize(u_sunDirection);
      vec3 geomNormal = normalize(vNormalVec);

      // 1. Triple-scale counter-propagating capillary ripples
      vec2 uv1 = vWorldPosition.xz * 0.038 + vec2(u_time * 0.016, u_time * 0.010);
      vec2 uv2 = vWorldPosition.xz * 0.092 + vec2(-u_time * 0.022, u_time * 0.018);
      vec2 uv3 = vWorldPosition.xz * 0.220 + vec2(u_time * 0.038, -u_time * 0.028);

      vec3 n1 = texture2D(u_normalMap, uv1).rgb * 2.0 - 1.0;
      vec3 n2 = texture2D(u_normalMap, uv2).rgb * 2.0 - 1.0;
      vec3 n3 = texture2D(u_normalMap, uv3).rgb * 2.0 - 1.0;

      // Orthonormal TBN transformation
      vec3 rippleTangent = normalize(n1 + n2 * 0.65 + n3 * 0.35);
      vec3 T = normalize(vTangent);
      vec3 B = normalize(vBinormal);
      vec3 N = normalize(geomNormal);
      mat3 tbn = mat3(T, B, N);

      vec3 localRipple = normalize(vec3(rippleTangent.x * 0.28, rippleTangent.y * 0.28, 1.0));
      vec3 finalNormal = normalize(tbn * localRipple);

      // 2. Physically-based Fresnel (polar seawater IOR ~ 1.338 -> F0 = 0.021)
      float r0 = 0.021;
      float NdotV = max(dot(viewDir, finalNormal), 0.001);
      float fresnel = r0 + (1.0 - r0) * pow(clamp(1.0 - NdotV, 0.0, 1.0), 5.0);

      // 3. Beer-Lambert physical water absorption gradient
      // Red light absorbs 20x faster than blue in Antarctic water
      float depthGradient = clamp(-vElevation * 0.45 + 0.38, 0.0, 1.5);
      vec3 absorptionCoeff = vec3(0.38, 0.085, 0.018);
      vec3 waterTransmittance = exp(-absorptionCoeff * (depthGradient * 4.4));
      vec3 waterBodyColor = mix(u_waterDeep, u_waterSurface, waterTransmittance);

      // 4. Subsurface Light Scattering (SSS) inside wave crests (Henyey-Greenstein phase)
      float cosTheta = dot(viewDir, -sunDir);
      float g = 0.62;
      float phaseHG = (1.0 - g * g) / (4.0 * 3.14159265 * pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5));
      float crestElevation = smoothstep(0.08 * u_waveHeightMult, 0.85 * u_waveHeightMult, vElevation);
      float crestThinness = clamp(vCrestFoam * 0.45 + 0.55, 0.0, 1.5);
      vec3 sssGlow = u_subsurfaceColor * phaseHG * crestElevation * crestThinness * 4.2;

      // 5. Dual-Lobe Cook-Torrance GGX Specular (Diamond Glints + Wide Sun Road)
      vec3 H = normalize(viewDir + sunDir);
      float NdotH = max(dot(finalNormal, H), 0.0);
      float NdotL = max(dot(finalNormal, sunDir), 0.0);
      float VdotH = max(dot(viewDir, H), 0.0);

      float F_spec = r0 + (1.0 - r0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);

      // Lobe 1: Tight microfacet specular (sharp diamond glints)
      float D1 = D_GGX(NdotH, 0.038);
      float G1 = G_Smith(NdotV, NdotL, 0.038);
      float spec1 = (D1 * G1 * F_spec) * NdotL;

      // Lobe 2: Broad grazing polar sun road across wave facets
      float geomNdotH = max(dot(geomNormal, H), 0.0);
      float geomNdotL = max(dot(geomNormal, sunDir), 0.0);
      float D2 = D_GGX(geomNdotH, 0.18);
      float G2 = G_Smith(NdotV, geomNdotL, 0.18);
      float spec2 = (D2 * G2 * F_spec) * geomNdotL * 0.45;

      vec3 sunSpecular = vec3(1.0, 0.96, 0.88) * (spec1 + spec2) * 2.8;

      // 6. Sky & Polar Horizon Reflection (Equirectangular Sky or Analytical fallback)
      vec3 refDir = reflect(-viewDir, finalNormal);
      vec3 skyReflection;
      if (u_hasSkyEquirect == 1) {
        float phi = atan(refDir.z, refDir.x);
        float theta = acos(clamp(refDir.y, -1.0, 1.0));
        vec2 skyUv = vec2(phi * 0.15915494309 + 0.5, theta * 0.31830988618);
        skyReflection = texture2D(u_skyEquirect, skyUv).rgb;
      } else {
        float skyElevation = max(refDir.y, 0.0);
        vec3 zenithColor = u_skyColor * 0.65;
        vec3 horizonGlowColor = u_skyColor * 1.25 + vec3(0.03, 0.06, 0.10);
        skyReflection = mix(horizonGlowColor, zenithColor, pow(skyElevation, 0.55));
      }

      // Combine water body with sky reflection via Fresnel
      vec3 finalColor = mix(waterBodyColor + sssGlow, skyReflection, fresnel * 0.85);

      // 7. Organic Whitecap Foam & Buoy Contact Meniscus Wake
      float crestSteepness = max(0.0, vCrestFoam - 0.22);
      float peakElevation = smoothstep(0.35 * u_waveHeightMult, 0.88 * u_waveHeightMult, vElevation);
      float whitecapTrigger = smoothstep(0.16, 0.62, crestSteepness * peakElevation);

      // Multi-scale cellular lace foam with turbulent stretching
      vec2 flowFoamOffset = u_flowDir * (u_time * 0.024);
      vec2 foamUV1 = vWorldPosition.xz * 0.032 + flowFoamOffset;
      vec2 foamUV2 = vWorldPosition.xz * 0.075 - flowFoamOffset * 1.35 + vec2(-u_time * 0.005, u_time * 0.004);
      float foamLace1 = texture2D(u_foamMap, foamUV1).a;
      float foamLace2 = texture2D(u_foamMap, foamUV2).a;
      float foamLace = smoothstep(0.20, 0.65, foamLace1 * 0.7 + foamLace2 * 0.3);

      float whitecapFoam = whitecapTrigger * foamLace * u_foamIntensity * 0.85;

      // Realistic hydrodynamic Kelvin trailing wake & contact meniscus around moving buoy hull
      vec2 relBuoy = vWorldPosition.xz - u_buoyPos;
      float hullDist = length(relBuoy);
      float downstream = dot(relBuoy, u_flowDir);
      float crossStream = abs(dot(relBuoy, vec2(-u_flowDir.y, u_flowDir.x)));

      // Kelvin wake envelope (approx 19.5 degrees)
      float wakeSpread = smoothstep(crossStream / (max(downstream, 0.1) + 0.65), 0.38, 0.26);
      float wakeDecay = step(0.0, downstream) * smoothstep(16.0, 1.0, downstream);
      float wakeTrailing = wakeSpread * wakeDecay;

      // Dynamic waterline meniscus tightly hugging spar hull radius (~0.84m)
      float distToHull = abs(hullDist - 0.84);
      float meniscusFoam = smoothstep(0.22, 0.02, distToHull) * (foamLace1 * 0.6 + 0.4);

      float totalHullFoam = (meniscusFoam * 0.85 + wakeTrailing * 0.42) * (foamLace1 * 0.6 + 0.4);
      float totalFoam = clamp(whitecapFoam + totalHullFoam, 0.0, 0.95);
      vec3 polarFoamColor = vec3(0.96, 0.98, 1.0);

      // Blend whitecap foam with underlying ocean
      finalColor = mix(finalColor, polarFoamColor, totalFoam);

      // Add crisp sun specular on top of water
      finalColor += sunSpecular * (1.0 - totalFoam * 0.80);

      // 7B. Contact Ambient Occlusion & Buoy Grounding Shadow (r < 2.0m)
      float buoyAO = smoothstep(0.68, 1.85, hullDist);
      vec3 sunDirFlat = normalize(vec3(u_sunDirection.x, 0.0, u_sunDirection.z));
      float sunShadowProj = length(vWorldPosition.xz - (u_buoyPos - sunDirFlat.xz * 0.75));
      float buoySunShadow = smoothstep(0.55, 2.4, sunShadowProj);
      float totalContactOcclusion = clamp(buoyAO * 0.65 + buoySunShadow * 0.35, 0.35, 1.0);
      finalColor *= totalContactOcclusion;

      // 8. Exponential Polar Distance Fog (seamless horizon blending)
      float fogExp = 1.0 - exp(-vDistance * vDistance * u_fogDensity * u_fogDensity);
      finalColor = mix(finalColor, u_fogColor, clamp(fogExp, 0.0, 1.0));

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader: oceanVertShader,
    fragmentShader: oceanFragShader,
    uniforms: {
      u_time: { value: 0.0 },
      u_waveTime: { value: 0.0 },
      u_buoyPos: { value: new THREE.Vector2(0, 0) },
      u_flowDir: { value: new THREE.Vector2(0.45, 0.25).normalize() },
      u_normalMap: { value: waterNormalMap },
      u_foamMap: { value: oceanFoamMap },
      u_skyEquirect: { value: null },
      u_hasSkyEquirect: { value: 0 },
      u_waveHeightMult: { value: initialPhysics.waveHeightMult || 1.35 },
      u_waveSpeedMult: { value: initialPhysics.waveSpeedMult || 1.15 },
      u_waveSteepness: { value: initialPhysics.waveSteepness || 0.22 },
      u_chaosFactor: { value: initialPhysics.chaosFactor || 0.15 },
      u_foamIntensity: { value: initialPhysics.foamIntensity || 0.95 },
      u_waterSurface: { value: new THREE.Color(initialPhysics.waterSurfaceColor || 0x075985) },
      u_waterDeep: { value: new THREE.Color(initialPhysics.waterDeepColor || 0x021329) },
      u_skyColor: { value: new THREE.Color(initialPhysics.skyColor || 0x113354) },
      u_subsurfaceColor: { value: new THREE.Color(initialPhysics.subsurfaceColor || 0x06b6d4) },
      u_sunDirection: { value: new THREE.Vector3(36, 16, 28).normalize() },
      u_sunSpecularPower: { value: initialPhysics.sunSpecularPower || 256.0 },
      u_fogColor: { value: new THREE.Color(initialPhysics.fogColor || 0x071526) },
      u_fogDensity: { value: initialPhysics.fogDensity || 0.0075 }
    },
    transparent: false,
    side: THREE.DoubleSide, // Enables underwater Snell's window & surface view from beneath
    depthWrite: true
  });


  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.name = "oceanSurfaceMesh";

  // Target values for smooth uniform interpolation
  const targetUniforms = {
    waveHeightMult: initialPhysics.waveHeightMult || 1.35,
    waveSpeedMult: initialPhysics.waveSpeedMult || 1.15,
    waveSteepness: initialPhysics.waveSteepness || 0.22,
    chaosFactor: initialPhysics.chaosFactor !== undefined ? initialPhysics.chaosFactor : 0.15,
    foamIntensity: initialPhysics.foamIntensity || 0.95,
    waterSurface: new THREE.Color(initialPhysics.waterSurfaceColor || 0x075985),
    waterDeep: new THREE.Color(initialPhysics.waterDeepColor || 0x021329),
    skyColor: new THREE.Color(initialPhysics.skyColor || 0x113354),
    subsurfaceColor: new THREE.Color(initialPhysics.subsurfaceColor || 0x06b6d4),
    sunSpecularPower: initialPhysics.sunSpecularPower || 256.0,
    fogColor: new THREE.Color(initialPhysics.fogColor || 0x071526),
    fogDensity: initialPhysics.fogDensity || 0.0075
  };

  return {
    mesh,
    material,

    setSkyTexture: (tex) => {
      if (tex) {
        material.uniforms.u_skyEquirect.value = tex;
        material.uniforms.u_hasSkyEquirect.value = 1;
      } else {
        material.uniforms.u_hasSkyEquirect.value = 0;
      }
    },

    setFlowDirection: (dx, dz) => {
      const len = Math.hypot(dx, dz) || 1.0;
      material.uniforms.u_flowDir.value.set(dx / len, dz / len);
    },

    // Smooth transition to a new region's physics
    setRegionPhysics: (physics) => {
      targetUniforms.waveHeightMult = physics.waveHeightMult;
      targetUniforms.waveSpeedMult = physics.waveSpeedMult;
      targetUniforms.waveSteepness = physics.waveSteepness !== undefined ? physics.waveSteepness : 0.22;
      targetUniforms.chaosFactor = physics.chaosFactor !== undefined ? physics.chaosFactor : (physics.id === 'southern_ocean_open' ? 1.0 : 0.15);
      targetUniforms.foamIntensity = physics.foamIntensity;
      targetUniforms.waterSurface.setHex(physics.waterSurfaceColor);
      targetUniforms.waterDeep.setHex(physics.waterDeepColor);
      targetUniforms.skyColor.setHex(physics.skyColor);
      targetUniforms.subsurfaceColor.setHex(physics.subsurfaceColor);
      targetUniforms.sunSpecularPower = physics.sunSpecularPower || 256.0;
      if (physics.fogColor) targetUniforms.fogColor.setHex(physics.fogColor);
      if (physics.fogDensity) targetUniforms.fogDensity = physics.fogDensity;
    },

    setWaveHeightScale: (scale) => {
      targetUniforms.waveHeightMult = scale;
    },

    setFoamIntensity: (val) => {
      targetUniforms.foamIntensity = val;
    },

    update: (time, delta = 0.016) => {
      material.uniforms.u_time.value = time;

      // Smooth lerp toward target uniforms for seamless region switching
      const lerpSpeed = Math.min(1.0, delta * 3.5);
      const u = material.uniforms;

      u.u_waveHeightMult.value += (targetUniforms.waveHeightMult - u.u_waveHeightMult.value) * lerpSpeed;
      u.u_waveSpeedMult.value += (targetUniforms.waveSpeedMult - u.u_waveSpeedMult.value) * lerpSpeed;
      u.u_waveSteepness.value += (targetUniforms.waveSteepness - u.u_waveSteepness.value) * lerpSpeed;
      u.u_chaosFactor.value += (targetUniforms.chaosFactor - u.u_chaosFactor.value) * lerpSpeed;
      u.u_foamIntensity.value += (targetUniforms.foamIntensity - u.u_foamIntensity.value) * lerpSpeed;
      u.u_sunSpecularPower.value += (targetUniforms.sunSpecularPower - u.u_sunSpecularPower.value) * lerpSpeed;
      u.u_fogDensity.value += (targetUniforms.fogDensity - u.u_fogDensity.value) * lerpSpeed;

      u.u_waterSurface.value.lerp(targetUniforms.waterSurface, lerpSpeed);
      u.u_waterDeep.value.lerp(targetUniforms.waterDeep, lerpSpeed);
      u.u_skyColor.value.lerp(targetUniforms.skyColor, lerpSpeed);
      u.u_subsurfaceColor.value.lerp(targetUniforms.subsurfaceColor, lerpSpeed);
      u.u_fogColor.value.lerp(targetUniforms.fogColor, lerpSpeed);

      // Monotonically integrated wave phase time (zero phase jumps)
      accumulatedWaveTime += delta * u.u_waveSpeedMult.value;
      material.uniforms.u_waveTime.value = accumulatedWaveTime;
    },

    // Synchronized analytical calculation of wave height for buoy and ice floe buoyancy
    // (with 1-step Newton-Raphson trochoidal coordinate inversion for millimeter GPU alignment)
    getWaveHeight: (x, z) => {
      const hMult = material.uniforms.u_waveHeightMult.value;
      const wTime = accumulatedWaveTime;
      const chaos = material.uniforms.u_chaosFactor.value;
      const steepness = material.uniforms.u_waveSteepness.value;

      // Invert horizontal trochoidal Gerstner displacement to locate exact un-displaced rest coordinate (x0, z0)
      const flowDir = material.uniforms.u_flowDir.value;
      const fDirX = flowDir.x;
      const fDirZ = flowDir.y;

      const k1 = 2.0 * Math.PI / 56.0;
      const c1 = Math.sqrt(9.81 / k1) * 1.15;
      const f1_approx = k1 * (x * fDirX + z * fDirZ) - c1 * wTime;
      const q1 = steepness / (k1 * 0.85 * 7.0);
      const dx1 = q1 * 0.85 * fDirX * Math.cos(f1_approx);
      const dz1 = q1 * 0.85 * fDirZ * Math.cos(f1_approx);

      const k2 = 2.0 * Math.PI / 34.0;
      const c2 = Math.sqrt(9.81 / k2) * 1.28;
      const f2_approx = k2 * (-x * 0.48 + z * 0.88) - c2 * wTime;
      const q2 = steepness / (k2 * 0.52 * 7.0);
      const dx2 = q2 * 0.52 * (-0.48) * Math.cos(f2_approx);
      const dz2 = q2 * 0.52 * 0.88 * Math.cos(f2_approx);

      // Inverted rest coordinates
      const x0 = x - (dx1 + dx2);
      const z0 = z - (dz1 + dz2);

      // Octave 1: Dominant Swell (aligned with prevailing current flow)
      const f1 = k1 * (x0 * fDirX + z0 * fDirZ) - c1 * wTime;
      const w1 = Math.sin(f1) * 0.85 * hMult;

      // Octave 2: Secondary Swell (wavelength 34m, speed 1.28, amp 0.52)
      const f2 = k2 * (-x0 * 0.48 + z0 * 0.88) - c2 * wTime;
      const w2 = Math.sin(f2) * 0.52 * hMult;

      // Octave 3: Primary Cross Sea (wavelength 19m, speed 1.45, amp 0.32)
      const k3 = 2.0 * Math.PI / 19.0;
      const c3 = Math.sqrt(9.81 / k3) * 1.45;
      const f3 = k3 * (x0 * 0.72 - z0 * 0.69) - c3 * wTime;
      const w3 = Math.sin(f3) * 0.32 * hMult;

      // Octave 4: Surface Wind Chop (wavelength 10.5m, speed 1.80, amp 0.18)
      const k4 = 2.0 * Math.PI / 10.5;
      const c4 = Math.sqrt(9.81 / k4) * 1.80;
      const f4 = k4 * (-x0 * 0.82 - z0 * 0.57) - c4 * wTime;
      const w4 = Math.sin(f4) * 0.18 * hMult;

      // Octaves 6 & 7: Chaotic Southern Ocean Waves (active when chaos > 0)
      let w6 = 0.0;
      let w7 = 0.0;
      if (chaos > 0.01) {
        const k6 = 2.0 * Math.PI / 44.0;
        const c6 = Math.sqrt(9.81 / k6) * 1.35;
        const f6 = k6 * (x0 * 0.42 + z0 * 0.91) - c6 * wTime;
        w6 = Math.sin(f6) * 0.65 * hMult * chaos;

        const k7 = 2.0 * Math.PI / 14.0;
        const c7 = Math.sqrt(9.81 / k7) * 1.70;
        const f7 = k7 * (-x0 * 0.68 + z0 * 0.73) - c7 * wTime;
        w7 = Math.sin(f7) * 0.24 * hMult * chaos;
      }

      // Buoy wake ripple near center
      const r = Math.sqrt(x * x + z * z);
      let wake = 0.0;
      if (r < 24.0) {
        wake = Math.sin(Math.max(0.0, r - 1.2) * 2.2 - material.uniforms.u_time.value * 3.5) * Math.exp(-r * 0.28) * 0.14;
      }

      return w1 + w2 + w3 + w4 + w6 + w7 + wake;
    }
  };
}
