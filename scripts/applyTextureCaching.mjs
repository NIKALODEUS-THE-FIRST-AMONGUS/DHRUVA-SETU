import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/3d/ProceduralTextures.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add texture cache definition at the top after imports
const cacheHeader = `
const _textureCache = new Map();

/**
 * Dispose and clear all cached procedural textures on teardown
 */
export function clearProceduralTextureCache() {
  _textureCache.forEach(val => {
    if (val && typeof val.dispose === 'function') val.dispose();
    if (val && val.envMap && typeof val.envMap.dispose === 'function') val.envMap.dispose();
    if (val && val.skyTexture && typeof val.skyTexture.dispose === 'function') val.skyTexture.dispose();
  });
  _textureCache.clear();
}
`;

if (!content.includes('const _textureCache = new Map();')) {
  content = content.replace("import * as THREE from 'three';", "import * as THREE from 'three';" + cacheHeader);
}

// 2. Wrap standard single-texture functions
const mappings = [
  { name: 'generateHDPEBumpMap', key: "'hdpeBump'" },
  { name: 'generateBrushedMetalMap', key: "'brushedMetal'" },
  { name: 'generateIceFractureMap', key: "'iceFracture'" },
  { name: 'generateSealSkinBumpMap', key: "'sealSkinBump'" },
  { name: 'generateWeddellSealPelt', key: "'weddellSealPelt'" },
  { name: 'generateSolarCellTexture', key: "'solarCell'" },
  { name: 'generateRimeIceTexture', key: "'rimeIce'" },
  { name: 'generateWaterNormalMap', key: "'waterNormal'" },
  { name: 'generatePCBTexture', key: "'pcb'" },
  { name: 'generateHelipadTexture', key: "'helipad'" },
  { name: 'generateOceanFoamMap', key: "'oceanFoam'" },
  { name: 'generateIndianFlagTexture', key: "'indianFlag'" },
  { name: 'generateBenthicBiofoulingMap', key: "'benthicBio'" },
  { name: 'generateHeatingPadTexture', key: "'heatingPad'" },
  { name: 'generatePolarCloudMap', key: "'polarCloud'" }
];

for (const m of mappings) {
  const funcDecl = `export function ${m.name}() {`;
  if (content.includes(funcDecl) && !content.includes(`_textureCache.has(${m.key})`)) {
    content = content.replace(funcDecl, `${funcDecl}\n  if (_textureCache.has(${m.key})) return _textureCache.get(${m.key});`);
  }
}

// Also cache right before return for each of these functions
// We can find `return texture;` inside each function and replace it with `_textureCache.set(key, texture); return texture;`
// Let's do this safely:
for (const m of mappings) {
  // Find function slice
  const startIndex = content.indexOf(`export function ${m.name}() {`);
  if (startIndex !== -1) {
    const nextFuncIndex = content.indexOf('export function', startIndex + 20);
    const endIndex = nextFuncIndex !== -1 ? nextFuncIndex : content.length;
    const body = content.substring(startIndex, endIndex);
    if (!body.includes(`_textureCache.set(${m.key}`)) {
      const lastReturn = body.lastIndexOf('return texture;');
      if (lastReturn !== -1) {
        const newBody = body.substring(0, lastReturn) + `_textureCache.set(${m.key}, texture);\n  return texture;` + body.substring(lastReturn + 'return texture;'.length);
        content = content.substring(0, startIndex) + newBody + content.substring(endIndex);
      }
    }
  }
}

// Handle generatePolarEnvironmentMap
const envFuncDecl = `export function generatePolarEnvironmentMap(renderer, season = 'summer') {`;
if (content.includes(envFuncDecl) && !content.includes(`_textureCache.has(cacheKey)`)) {
  content = content.replace(
    envFuncDecl,
    `${envFuncDecl}\n  const cacheKey = 'polar_env_' + season;\n  if (_textureCache.has(cacheKey)) return _textureCache.get(cacheKey);`
  );
  
  const envReturn = `return { envMap, skyTexture: canvasTexture };`;
  if (content.includes(envReturn) && !content.includes(`_textureCache.set(cacheKey`)) {
    content = content.replace(
      envReturn,
      `const res = { envMap, skyTexture: canvasTexture };\n  _textureCache.set(cacheKey, res);\n  return res;`
    );
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('ProceduralTextures.js caching applied successfully!');
