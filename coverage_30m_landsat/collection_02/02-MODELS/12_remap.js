/**************************************
 * REMAP POR POLÍGONOS (pixel-natural) + PALETA MAPBIOMAS
 **************************************/

Map.setOptions('HYBRID');

/**************************************
 * 0) CONFIGURACIÓN
 **************************************/
var ecorregionId = 'E6S4';
var ecorregionxregionId = 3;
var year = 2024; // año a visualizar

var CLASS_ASSET = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/correcciones-finales-1' 

// Imagen base (multi-banda classification_YYYY)
var classBase = (typeof class_outTotal !== 'undefined'
  ? class_outTotal
  : ee.Image(CLASS_ASSET)
).toInt8();

/**************************************
 * 0.1) PALETA (tal cual)
 **************************************/
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8');

mapbiomasPalette[60] = '1f8d49';   // Bosque Secundario
mapbiomasPalette[61] = 'c5c5c5';   // Salar
mapbiomasPalette[63] = 'ebf8b5';   // Estepa
mapbiomasPalette[64] = '000000';
mapbiomasPalette[65] = '000000';
mapbiomasPalette[66] = 'a89358';   // Matorral
mapbiomasPalette[67] = 'c8ffb4';   // Bosque Achaparrado
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
mapbiomasPalette[79] = '69601e';   // Coníferas
mapbiomasPalette[80] = '7a6c00';   // Latifoliadas

var visClass = {
  bands: 'classification_' + year.toString(),
  min: 0,
  max: 80,
  palette: mapbiomasPalette,
  format: 'png'
};

Map.addLayer(classBase, visClass, 'Clasificación (original) ' + year, false);

/**************************************
 * 1) COLECCIONES DE EDICIÓN (agrega las que uses)
 *    props requeridas: from, to
 *    opcionales: priority, years (lista), from_list (lista)
 **************************************/
var fcList = [];
if (typeof ptob2 !== 'undefined') fcList.push(ptob2);
if (typeof c18toc24  !== 'undefined') fcList.push(c18toc24);
if (typeof c60toc66  !== 'undefined') fcList.push(c60toc66);
if (typeof c24toc25  !== 'undefined') fcList.push(c24toc25);
if (typeof c12toc18  !== 'undefined') fcList.push(c12toc18);
if (typeof c66toc18  !== 'undefined') fcList.push(c66toc18);
if (typeof c24toc66  !== 'undefined') fcList.push(c24toc66);
if (typeof c18toc11  !== 'undefined') fcList.push(c18toc11);
if (typeof c18toc3  !== 'undefined') fcList.push(c18toc3);
if (typeof c18toc9  !== 'undefined') fcList.push(c18toc9);
if (typeof c12toc24  !== 'undefined') fcList.push(c12toc24);
if (typeof c60toc24  !== 'undefined') fcList.push(c60toc24);
if (typeof c60toc9  !== 'undefined') fcList.push(c60toc9);
if (typeof c60toc9  !== 'undefined') fcList.push(c60toc9);
if (typeof c9toc18  !== 'undefined') fcList.push(c9toc18);
if (typeof c3toc11  !== 'undefined') fcList.push(c3toc11);
if (typeof c3toc18  !== 'undefined') fcList.push(c3toc18);
if (typeof c3toc9  !== 'undefined') fcList.push(c3toc9);
if (typeof c11toc18  !== 'undefined') fcList.push(c11toc18);
if (typeof c23toc24  !== 'undefined') fcList.push(c23toc24);
if (typeof c9toc24  !== 'undefined') fcList.push(c9toc24);
if (typeof c34toc24  !== 'undefined') fcList.push(c34toc24);
if (typeof c63toc24  !== 'undefined') fcList.push(c63toc24);
if (typeof c59toc3  !== 'undefined') fcList.push(c59toc3);
if (typeof c24toc18  !== 'undefined') fcList.push(c24toc18);
if (typeof c33toc29  !== 'undefined') fcList.push(c33toc29);
if (typeof c34toc25  !== 'undefined') fcList.push(c34toc25);
if (typeof c25toc23  !== 'undefined') fcList.push(c25toc23);
if (typeof c61toc23  !== 'undefined') fcList.push(c61toc23);
if (typeof c24toc12  !== 'undefined') fcList.push(c24toc12);
if (typeof c24toc12  !== 'undefined') fcList.push(c24toc12);
if (typeof c34toc33  !== 'undefined') fcList.push(c34toc33);
if (typeof c9toc11  !== 'undefined') fcList.push(c9toc11);
if (typeof c9toc3  !== 'undefined') fcList.push(c9toc3);
if (typeof c60toc59  !== 'undefined') fcList.push(c60toc59);


var edits = ee.FeatureCollection([]);
fcList.forEach(function(fc){ edits = edits.merge(fc); });

// Sanitizar props
edits = edits
  .filter(ee.Filter.notNull(['from', 'to']))
  .map(function(f){
    var prio  = ee.Number(ee.Algorithms.If(f.propertyNames().contains('priority'), f.get('priority'), 0));
    var years = ee.Algorithms.If(f.propertyNames().contains('years'), f.get('years'), null);
    var flist = ee.Algorithms.If(f.propertyNames().contains('from_list'), f.get('from_list'), null);
    return ee.Feature(f.geometry(), {
      from: ee.Number(f.get('from')),
      to:   ee.Number(f.get('to')),
      priority: prio,
      years: years,
      from_list: flist
    });
  });

/**************************************
 * 2) AUXILIARES
 **************************************/
// Nombres de bandas a partir de años
function yearsToBands(yearsList){
  yearsList = ee.List(yearsList);
  return yearsList.map(function(y){ y = ee.Number(y); return ee.String('classification_').cat(y.format()); });
}

// Intersección segura de listas (evita .intersection inexistente)
function listIntersect(listA, listB){
  listA = ee.List(listA); listB = ee.List(listB);
  var kept = listA.map(function(el){ el = ee.String(el); return ee.Algorithms.If(listB.contains(el), el, null); });
  return ee.List(kept).removeAll([null]);
}

/**************************************
 * 2.1) RASTRERIZACIÓN PIXEL-NATURAL
 * Modo: 'center' (default), 'touch', 'area'
 **************************************/
var MASK_MODE = 'center';    // 'center' | 'touch' | 'area'
var AREA_THRESHOLD = 0.5;    // usado si MASK_MODE == 'area' (0..1)
var OVERSAMPLE = 3;          // refinamiento para 'area' (>=2)

function polyMaskFromGeom(geom, proj){
  var scale = ee.Number(proj.nominalScale());

  if (MASK_MODE === 'center') {
    // píxel cuenta si su centro cae dentro (aprox con erosión media celda)
    var eroded = geom.buffer(scale.multiply(-0.5));
    return ee.Image.constant(1).clip(eroded).selfMask().reproject(proj);
  }

  if (MASK_MODE === 'touch') {
    // píxel cuenta si toca el polígono (dilatación media celda)
    var dilated = geom.buffer(scale.multiply(0.5));
    return ee.Image.constant(1).clip(dilated).selfMask().reproject(proj);
  }

  // MASK_MODE === 'area'  -> fracción de área cubierta
  var fineScale = scale.divide(OVERSAMPLE);
  var fine = ee.Image.constant(1).clip(geom).unmask(0).reproject({crs: proj, scale: fineScale});
  var frac = fine.reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 1024}).reproject(proj);
  return frac.gte(AREA_THRESHOLD).selfMask().reproject(proj);
}

/**************************************
 * 2.2) Reemplazo sobre subconjunto de bandas
 **************************************/
function replaceOnBands(img, bandNames, fromList, toVal, polyMask){
  var target = img.select(bandNames);

  // máscara acumulada: pix = cualquiera de los 'from'
  var initMask = target.eq(-999); // siempre falso (multibanda)
  var maskAny = ee.List(fromList).iterate(function(c, acc){
    var accImg = ee.Image(acc);
    return accImg.or(target.eq(ee.Number(c)));
  }, initMask);
  maskAny = ee.Image(maskAny).updateMask(polyMask);

  var updated = target.where(maskAny, ee.Number(toVal));
  return img.addBands(updated, null, true);
}

/**************************************
 * 3) REMAP ITERATIVO (con prioridad y years)
 **************************************/
function remapByEdits(img, fc){
  var sorted = ee.FeatureCollection(fc).sort('priority');

  var out = ee.FeatureCollection(sorted).iterate(function(feat, acc){
    feat   = ee.Feature(feat);
    var accImg = ee.Image(acc);

    var from     = ee.Number(feat.get('from'));
    var to       = ee.Number(feat.get('to'));
    var years    = feat.get('years');       // puede ser null
    var fromList = feat.get('from_list');   // puede ser null
    fromList = ee.Algorithms.If(fromList, ee.List(fromList), ee.List([from]));

    var proj = accImg.projection();
    var polyMask = polyMaskFromGeom(feat.geometry(), proj);

    var allBands  = accImg.bandNames();
    var candidate = ee.Algorithms.If(years, yearsToBands(years), allBands);
    var bandNames = listIntersect(candidate, allBands); // seguro

    var updated = replaceOnBands(accImg, bandNames, ee.List(fromList), to, polyMask);
    return updated.toInt8();
  }, img);

  return ee.Image(out).toInt8();
}

/**************************************
 * 4) EJECUCIÓN
 **************************************/
var remapped = remapByEdits(classBase, edits).toInt8();

/**************************************
 * 5) MAPA + (opcional) EXPORT
 **************************************/
Map.addLayer(remapped, visClass, 'Clasificación (remapeada - pixel natural) ' + year, true);
Map.centerObject(classBase.geometry(), 7);

Export.image.toAsset({
    "image": remapped,
    "description": 'clasificacion-final-final-1' ,
    "assetId":  CLASS_ASSET + 'clasificacion-final-final-1' ,
    "scale": 30,
    "pyramidingPolicy": {
       '.default': 'mode'
    },
    "maxPixels": 1e13,
    
});
