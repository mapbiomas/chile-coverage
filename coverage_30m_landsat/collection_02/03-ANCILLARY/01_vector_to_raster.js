//Parámetros de Visualización
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8'); //esta versión de la paletta no es la más reciente
mapbiomasPalette[60] = '1f8d49';   //bosque secundario
mapbiomasPalette[61] = 'c5c5c5';   //salar
mapbiomasPalette[63] = 'ebf8b5';   //Estepa
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

///PARÁMETROS
//modificar asset último modificado
var asset_clasificacion = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/chile-integracion-general-2'
//area a aplicar el filtro
var ec = 'E7' //modificar
var ecorregionxregionId = 1;
var version = {         
    'output': '1',
};
var ano_vis = 1999
var ano_vis2 = 2024

var region = ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/' + ec +'-region')
                  .filter(ee.Filter.eq('fid',ecorregionxregionId))
                  
var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});


var selectedRegion = regionbuff.reduceToImage({
  properties: ['id'],            // atributo para convertir en raster
  reducer: ee.Reducer.first()       // cómo resolver solapes (first, mode, max, etc.)
}).rename('territory_id');  

                  
var imagen = ee.Image(asset_clasificacion)
               .mask(selectedRegion)

var mosaico = ee.ImageCollection("projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2")
            .filter(ee.Filter.eq('year', ano_vis))
            .mosaic()
            .mask(selectedRegion)

var mb1 = ee.ImageCollection.fromImages([imagen.select('classification_2022','classification_2023','classification_2024')])
           .mode()
           .remap([59],[59]);

Map.addLayer(mb1,visClass,'moda1 2022 - 2024 bp',false)

var modificado = imagen.where(imagen.eq(60).and(mb1.eq(59)),59);

Map.addLayer(modificado,{},'serie temporal',false)

Map.addLayer(mosaico,visMos,'mosaico ' + ano_vis.toString())
Map.addLayer(modificado.select('classification_' + ano_vis.toString()),visClass,'Filtro BN primario 1999')
Map.addLayer(modificado.select('classification_' + ano_vis2.toString()),visClass,'Filtro BN primario 2024')


var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso';

Export.image.toAsset({
    "image": modificado,
    "description": 'primaryF-filter-'+ec.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + '/primaryF-filter-' +ec.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});

// ===== Utilidades (lado cliente) =====
var allBandNames = modificado.bandNames().getInfo();  // lista JS de strings
function hasBand(year){
  return allBandNames.indexOf('classification_' + year) !== -1;
}
function yearsRange(a, b){
  var out = [];
  for (var y = a; y <= b; y++) out.push(y);
  return out;
}

var CLASS_ID = 59
var aoi = regionbuff

// ===== Gráfico rápido (área clase 60 antes vs después) =====
var ha = ee.Image.pixelArea().divide(10000);
function areaClass(img, year, classId){
  var band = 'classification_' + year; // string JS
  var masked = img.select(band).eq(classId);
  var dict = ha.updateMask(masked)
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 150,
      maxPixels: 1e13,
      tileScale: 2
    });
  return ee.Number(dict.get('area', 0));
}
var yearsAllArr = yearsRange(1998, 2025).filter(hasBand);
var feats = yearsAllArr.map(function(y){
  return ee.Feature(null, {
    year: y,
    original_c59: areaClass(imagen, y, CLASS_ID),
    nuevo_c59:    areaClass(modificado, y, CLASS_ID)
  });
});
var fcArea = ee.FeatureCollection(feats);
var chart = ui.Chart.feature.byFeature({
  features: fcArea,
  xProperty: 'year',
  yProperties: ['original_c59','nuevo_c59']
}).setOptions({
  title: 'CLASE 59 MODIFICADO',
  hAxis: { title: 'Año' },
  vAxis: { title: 'Área (ha)' },
  legend: { position: 'bottom' },
  lineWidth: 2,
  pointSize: 3
});
print(chart);

