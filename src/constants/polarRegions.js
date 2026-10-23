// Polar & Southern Ocean Operational Deployment Zones & Hydrographic Profiles
export const POLAR_REGIONS = {
  prydz_bay_miz: {
    id: "prydz_bay_miz",
    name: "Prydz Bay Marginal Ice Zone",
    shortName: "PRYDZ BAY MIZ",
    subTitle: "SOUTHERN OCEAN // EAST ANTARCTICA",
    station: "Prydz Bay MIZ",
    coordinates: "68°22'S, 76°45'E",
    basin: "Southern Ocean (Indian Sector)",
    program: "INDIAN ANTARCTIC PROGRAM (NCPOR)",
    description: "Dynamic Marginal Ice Zone (MIZ) in Prydz Bay where Southern Ocean swells encounter the pack ice edge. Characterized by drifting pancake ice floes, wave-ice damping, and dense biological foraging corridors for Weddell seals and krill.",
    
    // Wave & Sea Surface Physics
    seaPhysics: {
      waveHeightMult: 1.25,
      waveSpeedMult: 1.10,
      waveSteepness: 0.22,
      chaosFactor: 0.15,
      foamIntensity: 0.95,
      waterSurfaceColor: 0x076189, // Vibrant Antarctic icy teal meltwater
      waterDeepColor: 0x021326,    // Deep Antarctic Bottom Water abyss
      skyColor: 0x0f2a45,
      subsurfaceColor: 0x06b6d4,   // Translucent glowing emerald-cyan
      sunSpecularPower: 256.0,
      iceFloeDensity: 0.55,        // Moderate pancake ice floes in MIZ
      icebergDist: 115,
      fogDensity: 0.0075,
      fogColor: 0x08172b
    },

    // Hydrography (Water column CTD equations)
    hydrography: {
      haloclineDepth: 38.0,
      surfaceTemp: -1.75, // Antarctic Surface Water near freezing (-1.86°C)
      deepTemp: +0.65,    // Modified Circumpolar Deep Water (MCDW) intrusion
      surfaceSalinity: 33.45, // Summer meltwater layer
      deepSalinity: 34.68,    // Dense Shelf Water / AABW precursor
      transitionWidth: 10.0,
      layerNameSurface: "ANTARCTIC SURFACE WATER (AASW - Melt Layer)",
      layerNameHalocline: "⚡ PYCNOCLINE SHEAR (Melt -> Mod. Circumpolar Deep Water)",
      layerNameDeep: "MODIFIED CIRCUMPOLAR DEEP WATER (MCDW Intrusion)",
      soundSpeedBase: 1445.0,
      seawaterDensityBase: 1027.6
    },

    // Seal Biologger
    seal: {
      species: "Weddell Seal (Leptonychotes weddellii)",
      tagId: "WED-PRYDZ-42",
      maxDepthM: 195.0,
      avgBreachPeriodSec: 38.0,
      notes: "Foraging in marginal pack ice leads for Antarctic silverfish and krill."
    }
  },

  bharati_station: {
    id: "bharati_station",
    name: "Off Bharati Station (Larsemann Hills)",
    shortName: "OFF BHARATI STATION",
    subTitle: "PRYDZ BAY COASTAL // INDIA BASE",
    station: "Bharati Station",
    coordinates: "69°24'S, 76°11'E",
    basin: "Larsemann Hills, Coastal Prydz Bay",
    program: "BHARATI RESEARCH BASE // NCPOR GOI",
    description: "Coastal Antarctic polynya and fast-ice boundary off India's third permanent research station, Bharati. Pristine glacial runoff from Dålk Glacier, grounded tabular icebergs calved from the Amery Ice Shelf, and supercooled Ice Shelf Water (ISW).",
    
    seaPhysics: {
      waveHeightMult: 0.75,
      waveSpeedMult: 0.85,
      waveSteepness: 0.14,
      chaosFactor: 0.0,
      foamIntensity: 0.55,
      waterSurfaceColor: 0x056e88, // Pristine glacial runoff emerald-cyan
      waterDeepColor: 0x02182b,    // Deep coastal trench
      skyColor: 0x0a243a,
      subsurfaceColor: 0x14b8a6,   // Emerald ice shelf water
      sunSpecularPower: 320.0,
      iceFloeDensity: 0.70,        // Fast ice slabs and tabular bergs
      icebergDist: 85,             // Close towering grounded icebergs
      fogDensity: 0.0068,
      fogColor: 0x061424
    },

    hydrography: {
      haloclineDepth: 52.0,
      surfaceTemp: -1.82, // Supercooled Ice Shelf Water
      deepTemp: -1.88,    // High Salinity Dense Shelf Water (DSW)
      surfaceSalinity: 33.80,
      deepSalinity: 34.72,
      transitionWidth: 14.0,
      layerNameSurface: "GLACIAL MELTWATER & ICE SHELF WATER (ISW)",
      layerNameHalocline: "⚡ SUPERCOOLED ACOUSTIC DUCT (~50m Depth)",
      layerNameDeep: "ANTARCTIC DENSE SHELF WATER (DSW Pre-AABW)",
      soundSpeedBase: 1442.5,
      seawaterDensityBase: 1028.1
    },

    seal: {
      species: "Weddell Seal (Leptonychotes weddellii)",
      tagId: "WED-BHARATI-09",
      maxDepthM: 175.0,
      avgBreachPeriodSec: 42.0,
      notes: "Breathing crack breathing and benthic dive profiling near fast-ice margin."
    }
  }
};

export const DEFAULT_REGION_ID = "prydz_bay_miz";

