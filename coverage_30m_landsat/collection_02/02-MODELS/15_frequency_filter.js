/*************************************************************
 * MAPBIOMAS CHILE C02 — Filtro por "últimos años" (sin N fijo)
 * Detecta el primer año (quiebre) desde el cual una clase pasa
 * a ser estable (≥ umbral) hasta el presente. Corrige SOLO desde
 * ese año hacia adelante. Las clases compiten con prioridad.
 *************************************************************/

//------------------------------------------------------------------------------------------------------------------------
//Parámetros
 
var version = {         
    'output': '1',
    'input': '1',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E3';
var ecorregionxregionId =4;

// Defino la clase objetivo
var CLASS_ID = 18;

// Defino el umbral de cambio
var THRESHOLD = 0.3;

// Defino otros parámetros de interés
var BAND_PREFIX = 'classification_'; // prefijo de la clase
var SCALE = 30; // resolución 
var SHOW_YEAR = 2024;  // año de visuzalización 

//-------------------------------------------------------------------------------------------------------------------------------------------------------
 //Asset 
var classification = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso/temporal-filter-5-'+
                                                                      ecorregionId.toString()+'-'+
                                                                      ecorregionxregionId.toString()+'-'+
                                                                      version.input.toString()
                                                                      );

print(classification)

var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString()+'-region'; //Zonas
                   
var regiones = ee.FeatureCollection(assetRegions);

var region = regiones.filter(ee.Filter.eq('id', ecorregionxregionId));

var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});
//-------------------------------------------------------------------------------------------------------------

//Parámetros de Visualización
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8'); //esta versión de la paletta no es la más reciente
mapbiomasPalette[24] = 'D900C8'; //Infraestructura
mapbiomasPalette[60] = '1f8d49';   //bosque secundario
mapbiomasPalette[61] = 'c5c5c5';   //salar
mapbiomasPalette[63] = 'ebf8b5';   //Estepa
mapbiomasPalette[64] = '000000';
mapbiomasPalette[65] = '000000';
mapbiomasPalette[66] = 'a89358';   //Matorral
mapbiomasPalette[67] = 'c8ffb4';   //Bosque Achaparrado
mapbiomasPalette[68] = 'B7F527';   //No urbano 
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


var visClass = {     //parámetros de visualización
  bands: 'classification_'+SHOW_YEAR.toString(),
  min:0,
  max:80,
  palette:mapbiomasPalette,
  format:'png'
};


// ------------------- BINARIA 1/0 -------------------
function binaryForYear(img, year, classId, prefix){
  var band = ee.String(prefix).cat(ee.Number(year).format('%d'));
  var perYear = img.select([band]);
  // nombre fijo 'bin' + respeta máscara del año
  return perYear.eq(classId).rename('bin').updateMask(perYear.mask());
}

// ------------------- FILTRO (una clase) -------------------
function applyRecentRegimeOneClass(img, classId, threshold, prefix){ 
  // ⚠️ Ajusta esta lista si tus bandas no cubren exactamente 1998..2025
  var YEARS = ee.List.sequence(1998, 2025);
  var n = YEARS.size();

  // 1) Lista de binarias homogéneas
  var binList = YEARS.map(function(y){
    return binaryForYear(img, ee.Number(y), classId, prefix);
  });
  binList = ee.List(binList); // lista de ee.Image (1 banda 'bin')

  // 2) Máscara global de datos válidos (unión de máscaras de bandas)
  var bandNames = YEARS.map(function(y){
    y = ee.Number(y);
    return ee.String(prefix).cat(y.format('%d'));
  });
  var validMask = img.select(bandNames).mask().reduce(ee.Reducer.max());

  // 3) MkList usando SOLO años válidos por píxel en cada sufijo [k..end]
  var MkList = ee.List.sequence(0, n.subtract(1)).map(function(k){
    k = ee.Number(k);
    var sub    = binList.slice(k, n);                      // [k..end]
    var sumK   = ee.ImageCollection(sub).sum().rename('sumK');
    var validK = ee.ImageCollection(sub).count().rename('validK'); // por píxel
    var propK  = sumK.divide(validK);                      // proporción por píxel
    // Mk homogénea, enmascarada donde hay datos
    return propK.gte(ee.Image.constant(threshold))
                .updateMask(validK.gt(0))
                .updateMask(validMask)
                .rename('Mk')
                .toByte();
  });

  // 4) startYearImg (Int16) con misma extensión que la clasificación
  var maxYear = ee.Number(YEARS.get(n.subtract(1)));
  var minYear = ee.Number(YEARS.get(0));
  var startYearImg = ee.Image.constant(maxYear.add(1))
    .toInt16()
    .updateMask(validMask)
    .clip(img.geometry())
    .rename('startYear');

  startYearImg = ee.Image(ee.List.sequence(0, n.subtract(1)).iterate(function(k, acc){
    k   = ee.Number(k);
    acc = ee.Image(acc).toInt16();
    var Mk  = ee.Image(MkList.get(k)); // banda 'Mk'
    var ykI = ee.Image.constant(ee.Number(YEARS.get(k))).toInt16();
    // donde Mk==1, escribir el año k
    return acc.where(Mk.eq(1), ykI);
  }, startYearImg)).toInt16()
    .updateMask(validMask)
    .clip(img.geometry())
    .rename('startYear');

  // 5) Corrige solo desde startYear en adelante
  var outBands = YEARS.map(function(y){
    y = ee.Number(y);
    var band = ee.String(prefix).cat(y.format('%d'));
    var orig = img.select([band]);
    var maskRecent = ee.Image.constant(y).gte(startYearImg); // comparación Image vs Image
    return orig.where(maskRecent, classId).rename(band);
  });

  var n = outBands.size();
  var seed = ee.Image(outBands.get(0));
  var stacked = ee.Image(ee.List.sequence(1, n.subtract(1)).iterate(function(i, acc){
    i = ee.Number(i);
    acc = ee.Image(acc);
    var imgI = ee.Image(outBands.get(i));
      return acc.addBands(imgI);
      }, seed)).toUint8();
      return stacked;
            }

// ------------------- EJECUCIÓN -------------------
var classification_post = applyRecentRegimeOneClass(classification, CLASS_ID, THRESHOLD, BAND_PREFIX);

// =================== Visualización ===================

//Visualizo
Map.addLayer(regiones, {}, 'regiones', false);
Map.addLayer(region, {color: 'red'}, 'region', false);
Map.addLayer(classification, visClass, 'Original ' + SHOW_YEAR, false);
Map.addLayer(classification_post, visClass, 'Post (últimos años) ' + SHOW_YEAR, true);

//-------------------------------------------------------------------------------------------------------------
 //Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso/';



Export.image.toAsset({
    "image": classification_post ,
    "description": 'frecuence-filter-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + 'frecuence-filter-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});



