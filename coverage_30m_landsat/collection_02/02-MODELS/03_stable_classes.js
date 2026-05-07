//Script para extracción de muestras estables
// define la ecoregion id
var regionId = 'E6S4';
var version_output = 1;
var sv = 'v1';
// Definir los años de interés
var years = ee.List.sequence(1997, 2025);

var version = {
    'classification': '1',
    'stable_map': '1'
};

//--------------------------------------------------------------------------------------------------------------------------------------
// Assets
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+regionId; //defino la ecoregión
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-'+regionId.toString();
var assetStable = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-stable';

//Simplifico la geometría de mi ecoregión
var selectedRegion = ee.FeatureCollection(assetRegions); //la geometría es muy compleja para procesar
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = selectedRegion.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

//Defino mi región de trabajo
var region = typeof (userRegion) !== 'undefined' ? userRegion : selectedRegionSimplified;

//---------------------------------------------------------------------------------------------------------------------------------------
//Visualización
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8'); //esta versión de la paletta no es la más reciente
mapbiomasPalette[60] = '1f8d49';   //bosque secundario
mapbiomasPalette[63] = 'ebf8b5';   //Mosaico Agricultura Pastura
mapbiomasPalette[64] = '000000';
mapbiomasPalette[65] = '000000';
mapbiomasPalette[66] = 'a89358';   //Matorral
mapbiomasPalette[67] = 'c8ffb4';   //Bosque Achaparrado
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

var visMos = {
    'bands': [
        'swir1_median',
        'nir_median',
        'red_median'
    ],
    'gain': [0.08, 0.06, 0.2],
    'gamma': 0.85
};


//------------------------------------------------------------------------------------------------------------------------------
//construyo mi función para evaluar la estabilidad de las clasificaciones en cada pixel en cada año disponible
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
 // ===================== CARGA DE CLASIFICACIONES =====================

// Convertir la ImageCollection en imagen multibanda (una banda por año)
var classificationMultiBand = ee.ImageCollection(assetClass)
  .filter(ee.Filter.stringEndsWith('system:index', sv))
  .filter(ee.Filter.inList('year', years))
  .sort('year')
  .map(function(img) {
    var year = img.get('year');
    return img.select('classification')
              .rename(ee.String('classification_').cat(ee.Number(year).format('%d')))
  })
  .toBands()
  .clip(region);

/*
//Opción Alternativa
var classificationMultiBand = ee.ImageCollection(assetClass)
  .filter(ee.Filter.inList('year', years))
  .sort('year')
  .map(function(img) {
    return img.clip(region);  // ya tiene nombre 'classification_YYYY'
  })
  .toBands();
*/

// ===================== EVALUACIÓN DE ESTABILIDAD =====================

// Contar número de clases distintas por píxel
var nClasses = classificationMultiBand.reduce(ee.Reducer.countDistinctNonNull());

// Seleccionar la clase del primer año como referencia
var firstBand = classificationMultiBand.bandNames().get(0);
var referenceClass = classificationMultiBand.select([firstBand]);

var bandNames = classificationMultiBand.bandNames();

var yearsEqualToFirst = ee.ImageCollection(
  bandNames.map(function(bandName) {
    bandName = ee.String(bandName);
    var band = classificationMultiBand.select([bandName]);
    return band.eq(referenceClass).rename('equalToFirst');
  })
).reduce(ee.Reducer.sum()).rename('yearsEqualToFirst');

// Imagen binaria: 1 si el píxel no cambió de clase en ningún año
var stableBinary = nClasses.eq(1).rename('stableBinary');

// Imagen final de estabilidad: clase del primer año donde fue estable
var stable = referenceClass
  .updateMask(stableBinary)
  .selfMask()
  .rename('stable');

//Visualizo
Map.centerObject(region, 7);
Map.addLayer(yearsEqualToFirst, {}, 'yearsEqualToFirst', true);
//Map.addLayer(stableBinary, {min: 0, max: 1, palette: ['grey', 'white']}, 'Estabilidad binaria');
Map.addLayer(stable, visClass, 'stable', true);

stable = stable
    .rename('stable')
    .set('collection_id', 2.0)
    .set('version', version_output)
    .set('region_id', regionId)
    .set('territory', 'CHILE');


// ===================== RESUMEN =====================

// Conteo total de píxeles estables
/*var stableCount = stableBinary.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: region.geometry(),
  scale: 30,
  maxPixels: 1e13
}).get('stableBinary');

print('Píxeles estables (nClasses == 1):', stableCount);*/
print('Imagen yearsEqualToFirst (años igual al primero):', yearsEqualToFirst);
// Contar la cantidad de píxeles por clase en el mapa de estabilidad
var classHistogram = stable.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: region.geometry(),
  scale: 30,
  maxPixels: 1e13
});

// Mostrar en consola
print('Cantidad de píxeles por clase estable:', classHistogram);


// ===================== Exportar =====================


var stableName = 'stable-' + regionId.toString() + '-' + version_output;

Export.image.toAsset({
    "image": stable,
    "description": stableName,
    "assetId": assetStable + '/' + stableName,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": region
}); 
