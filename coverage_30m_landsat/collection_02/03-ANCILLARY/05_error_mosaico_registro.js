//Selecciona la ecorregión
var year = 2024;
var ecorregionId = 'E1';

// 1. Cargar la grilla CIM
var grids = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/cim-world-1-250000');


// 2. Cargar Classificacion por ecorregión
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/clasificacion-final-3';
var classification = ee.Image(assetClass).select('classification_2024');
var assetRegions = 'projects/mapbiomas-territories/assets/TERRITORIES/CHILE/WORKSPACE/POLITICAL_LEVEL_1/POLITICAL_LEVEL_1_v1'; //defino la ecoregión

//Ecorregión simplificada
var selectedRegion = ee.FeatureCollection(assetRegions); //la geometría es muy compleja para procesar

//clasificacion
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8'); //esta versión de la paletta no es la más reciente
mapbiomasPalette[60] = '1f8d49';   //bosque secundario
mapbiomasPalette[63] = 'ebf8b5';   //Estepa
mapbiomasPalette[64] = '000000';
mapbiomasPalette[65] = '000000';
mapbiomasPalette[66] = 'a89358';  
mapbiomasPalette[67] = 'c8ffb4';   
mapbiomasPalette[68] = '000000';
mapbiomasPalette[69] = '000000';
mapbiomasPalette[70] = '000000';
mapbiomasPalette[71] = '000000';
mapbiomasPalette[72] = '000000';
mapbiomasPalette[73] = '000000';
mapbiomasPalette[74] = '000000';
mapbiomasPalette[75] = '000000';
mapbiomasPalette[76] = '000000';
mapbiomasPalette[77] = '000000';
mapbiomasPalette[78] = '000000';
mapbiomasPalette[79] = '69601e';  //Coniferas
mapbiomasPalette[80] = '7a6c00';   //Latifoliadas

var visClass = {
    'min': 0,
    'max': 80,
    'palette': mapbiomasPalette
};


Map.addLayer(classification, visClass, year + ecorregionId.toString()  + 'class', true);


// --- Región: Chile (disolver por si son varias features) ---
var chile = ee.FeatureCollection(assetRegions).geometry().dissolve();

// --- Cartas que intersectan Chile ---
var cartasChile = grids.filterBounds(geometry2);

// (opcional) contar y mostrar
print('cartas intersectadas:', cartasChile.limit(3));
Map.addLayer(cartasChile.style({color:'red', fillColor:'00000000'}), {}, 'Cartas CIM (intersectan Chile)');

// --- Exportar a Shapefile (Drive) ---
Export.table.toDrive({
  collection: cartasChile,
  description: 'CIM_cartas_intersectan_CHILE',
  folder: 'GEE',                 // cambia si quieres otra carpeta
  fileNamePrefix: 'cim_1250k_CHL_intersect',
  fileFormat: 'SHP'
});
