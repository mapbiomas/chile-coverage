//Integración
Map.setOptions("HYBRID"); //Selecciona mapa hibrido 
//---------------------------------------------------------------------------------------------------------------------------
//Defino 
var year = 2024;

var featureSpace = [
'blue_median',
'green_median',
'red_median',
'nir_median',
'swir1_median',
'swir2_median',
'savi_median',
'ndsi'
 ];
 
//---------------------------------------------------------------------------------------------------------------------------
//Dirección de las rutas a los assets
var assetMosaic = ee.ImageCollection('projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2')
var c01 = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE_COL1_2v5').select('classification_2022')
var E1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E1')
var E2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E2')
var E3 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E3')
var E4 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E4')
var E5S1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E5S1')
var E5S2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E5S2')
var E6S1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S1')
var E6S2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S2')
var E6S3_1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S3_1')
var E6S3_2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S3_2')
var E6S4 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S4_2')
var E6S5 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S5_2').filter(ee.Filter.eq('version', 3));
var E7 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E7').filter(ee.Filter.eq('version', 3));
var E8 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E8').filter(ee.Filter.eq('version', 2));
var E9 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E9').filter(ee.Filter.eq('version', 1));

//----------------------------------------------------------------------------------

var cabof = ee.Image("projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/CLASES/Class_CaboForward");


//Filtro el imageCollection por mi año de interés
var imageE1 = E1.filter(ee.Filter.eq('year', year)).mosaic();
var imageE2 = E2.filter(ee.Filter.eq('year', year)).mosaic();
var imageE3 = E3.filter(ee.Filter.eq('year', year)).mosaic();
var imageE4 = E4.filter(ee.Filter.eq('year', year)).mosaic();
var imageE5S1 = E5S1.filter(ee.Filter.eq('year', year)).mosaic();
var imageE5S2 = E5S2.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S1 = E6S1.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S2 = E6S2.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S3_1 = E6S3_1.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S3_2 = E6S3_2.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S4 = E6S4.filter(ee.Filter.eq('year', year)).mosaic();
var imageE6S5 = E6S5.filter(ee.Filter.eq('year', year)).mosaic();
var imageE7 = E7.filter(ee.Filter.eq('year', year)).mosaic();
var imageE8 = E8.filter(ee.Filter.eq('year', year)).mosaic();
var imageE9 = E9.filter(ee.Filter.eq('year', year)).mosaic();

var mosaic =  assetMosaic
            .filter(ee.Filter.eq('year', year))
            .mosaic()
            .select(featureSpace);

//----------------------------------------------------------------------------------------------------------------------------
// Visualización
// Defino Parámetros de Visualización

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

//mosaico
var visMos = {
    'bands': [
        'red_median',
        'green_median',
        'blue_median'
    ],
    'gain': [0.08, 0.06, 0.2],
    'gamma': 0.85
};

//----------------------------------------------------------------------------------------------------
//Despliego en el lienzo

//Visualizo el Mosaico
Map.addLayer(mosaic, visMos, year + '-Mosaico', false);
Map.addLayer(c01, visClass,'Colección01', false);
//Visualizo las clasificaciones por ecoregión

	Map.addLayer(imageE1, visClass, year + '-Mosaico-E1-'  + 'class', false);
        Map.addLayer(imageE2, visClass, year + '-Mosaico-E2-'  + 'class', false);
        Map.addLayer(imageE3, visClass, year + '-Mosaico-E3-'  + 'class', false);
        Map.addLayer(imageE4, visClass, year + '-Mosaico-E4-'  + 'class', false);
        Map.addLayer(imageE5S1, visClass, year + '-Mosaico-E5S1-'  + 'class', false);
        Map.addLayer(imageE5S2, visClass, year + '-Mosaico-E5S2-'  + 'class', false);
        Map.addLayer(imageE6S1, visClass, year + '-Mosaico-E6S1-'  + 'class', false);
        Map.addLayer(imageE6S2, visClass, year + '-Mosaico-E6S2-'  + 'class', false);
        Map.addLayer(imageE6S3_1, visClass, year + '-Mosaico-E6S3_1-'  + 'class', false);
        Map.addLayer(imageE6S3_2, visClass, year + '-Mosaico-E6S3_2-'  + 'class', false);
        Map.addLayer(imageE6S4, visClass, year + '-Mosaico-E6S4-'  + 'class', false);
        Map.addLayer(imageE6S5, visClass, year + '-Mosaico-E6S5-'  + 'class', false);
        Map.addLayer(imageE7, visClass, year + '-Mosaico-E7-'  + 'class', false);
        Map.addLayer(imageE8, visClass, year + '-Mosaico-E8-'  + 'class', false);
        Map.addLayer(imageE9, visClass, year + '-Mosaico-E9-'  + 'class', false);
        var palette = [

  '#519799', // 1 Pulvinado  -> Humedales (11)

  '#519799', // 2 Shpagun s/arbóreo -> Humedales (11)

  '#519799', // 3 Shpagun c/mediano arbóreo -> Humedales (11)

  '#519799', // 4 Shpagun c/mucho arbóreo -> Humedales (11)

  '#d6bc74', // 5 Graminoide -> Herbazales (12)

  '#ffefc3', // 6 Mosaico -> Mosaico (21)

  '#2532e4', // 7 Agua -> Agua (33)

  '#006400', // 8 Bosque -> Bosque (59)

  '#1f8d49', // 9 Renoval -> Renoval (60)   *ojo: en tu lista faltaba el '#'

  '#c8ffb4', // 10 Achaparrado -> Achaparrado (67)

  '#d6bc74', // 11 Herbácea -> Herbazales (12)

  '#db4d4f', // 12 Suelo desnudo -> Suelo desnudo (25)

  '#93dfe6'  // 13 Nieve -> Nieve (34)

];

 

Map.addLayer(cabof,{

    'min': 1,

    'max': 13,

    'palette': palette},'cabo forward', false)
