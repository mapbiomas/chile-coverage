// ESTE SCRIPT CREA Y EXPORTA UNA MASCARA DE ZONAS POTENCIALMENTE DE INFRAESTRUCTURA 
//BASADO EN INFORMACIÓN DE LUCES NOCTURNAS

//----------------------------------------------------------------------------------------------------
Map.setOptions("HYBRID"); // Elijo el satelite 

//Limites politico 
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/chile-political-level-1-buffer'; // Dirección
var regions = ee.FeatureCollection(assetRegions); // Variable con los limites
var selectedRegion = regions;//.filter(ee.Filter.eq('region_id', regionId)); // Filtro por la zona de trabajo
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = selectedRegion.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});
//Otros assets de interés
var caminos = ee.FeatureCollection('projects/mapbiomas-chile/assets/ANCILLARY_DATA/caminos');
var mosaic = ee.ImageCollection('projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2');


//Asset de Salida
var assetMask = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL'; // output ubicación clasificación 
var versionId = 1; //versión de la máscara 

//---------------------------------------------------------------------------------------------------------------------
//Paletas
var visParams = {
  min: 0.0,
  max: 30.0,
  palette: ['000000', '400000', 'a00000', '00ffff'],
};

var visReal = { // visualización mosaico en color real
    'bands': ['red_median','green_median','blue_median'],
    'gamma': 1.5,
    'min':80 ,
    'max':3800};


//--------------------------------------------------------------------------------------
//Agrego el producto VIIRS para el año más actual disponible 
var VIIRS = ee.ImageCollection('NOAA/VIIRS/DNB/ANNUAL_V22').select('average_masked')
.filterBounds(aoi).filter(ee.Filter.date('2024-01-01', '2024-12-30'));
 print(VIIRS, 'VIIRS');

var VIIRS2024 = VIIRS.first().clip(selectedRegion);
Map.addLayer(VIIRS2024, {},'VIIRS2024'); //visualizo

//Limitamos el numero de variables del mosaico, solo para visualización
var featureSpace = [
  'red_median', 
  'green_median',
  'blue_median',
  'nir_median',
  'swir1_median',
  'swir2_median',
  'ndbi'
];

var years = [2024]; //visualizamos año 2024 para las pruebas

var firstImage = mosaic
  .filter(ee.Filter.eq('year', years[0])) // Selecciona el primer año (puedes ajustar esto según tus necesidades)
  .filter(ee.Filter.bounds(selectedRegionSimplified))
  .mosaic()
  .select(featureSpace);  

//visualizo en la consola
print(firstImage, 'mosaico de la primera imagen');

//----------------------------------------------------------------------------------------------------
//Funciones 
// Reclasificar cada imagen 
function VIIRS_R(image){
  var reclass = image  
          .where(image.lte(1), 0) // Menor o igual a 0.1 -> 0 (No urbano)
          .where(image.gt(1), 1)// Mayor a 0.1 -> 1 (urbano)
          .rename("urbanpotencial");
  return image.addBands(reclass)//.clip(selectedRegion);
}

// Crea buffer para Geometrias
var bufferDistance = 30; // Aplicar un buffer a la FeatureCollection (m)
function buffer(feature) {
  return feature.buffer(bufferDistance).set('value',1);
}

//Enmascarar cada imagen de una colección
function maskImage(image) {
  // Aplica la máscara 'allurban_uni' a la imagen
  var masked = image.updateMask(allurban_uni);
  return masked;
}

//Preprocesar variables
var VIIRS_re = VIIRS.map(VIIRS_R).select('urbanpotencial');
var VIIRS_2021 = VIIRS_re.mosaic();
//print(VIIRS_2021, "VIIRS imagen");

var caminosB =  caminos.map(buffer);//aplico la función
var caminosR =  caminosB.reduceToImage(['value'], ee.Reducer.first());//convierto en raster
//print(caminosR, "caminos");


//convierto en máscara 
//var condition = VIIRS_2021.eq(0);
var urbanall_mask = VIIRS_2021.where(VIIRS_2021.eq(0), caminosR);
//var allurban_uni = urbanall_mask.eq(1).selfMask(); // Crea la máscara de urbano
var allurban_uni = VIIRS_2021.eq(1).selfMask(); // Crea la máscara de urbano

// Aplicar la máscara de áreas urbanas
var nourban_maskedall = firstImage.updateMask(allurban_uni);
var maskedCollection = mosaic.map(maskImage);


// Visualizar el raster
Map.addLayer(VIIRS, null, 'VIIRS masked', false);
Map.addLayer(VIIRS_re, null, 'VIIRS mascara', false);
Map.addLayer(caminosR, {min: 0, max: 1, palette: ['white', 'black']}, 'Buffered Raster',false);
Map.addLayer(allurban_uni, null, 'all urban unido', false);
Map.addLayer(nourban_maskedall, visReal, 'Mosaico con la mascara');

//exporto la máscara
Export.image.toAsset({
    "image": allurban_uni,
    "description": 'urban-mask'+'-'+versionId,
    "assetId": assetMask + 'urban-mask'+'-'+versionId,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": aoi
}); 
