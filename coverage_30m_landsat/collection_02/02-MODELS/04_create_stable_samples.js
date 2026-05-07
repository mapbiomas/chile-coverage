//Este Código sirve para generar puntos en los pixeles estables y extraer la información espectral en los mismos
// permite además remapear píxeles mal clasificados a su clase real o a una clase de no observado 'c00'

// Variables a definir 

var regionId = 'E1';
var version = {
    'stable_map': '1',
    'output_samples': '1'
};

var aoiId = '2'; //
var aoi = aoi2; 

var years = [
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 
    2025
];

var nSamplesPerClass = [
    { 'class_id': 11, 'n_samples': 1000 }, //humedal
   // { 'class_id': 12, 'n_samples': 3000 }, //herbazal
  //  { 'class_id': 15, 'n_samples': 3000 }, //pastura
    { 'class_id': 18, 'n_samples': 1000 }, //agricultura
    { 'class_id': 23, 'n_samples': 1000 }, //arena
  //  { 'class_id': 24, 'n_samples': 3000 }, //infraestructura
    { 'class_id': 25, 'n_samples': 1000 }, //otras areas sin vegetacion
    { 'class_id': 29, 'n_samples': 1000 }, //afloramiento rocoso
    { 'class_id': 33, 'n_samples': 1000 }, // agua
    { 'class_id': 34, 'n_samples': 1000 }, // nieve o hielo
    { 'class_id': 59, 'n_samples': 1000 }, // bosque primario
  //  { 'class_id': 60, 'n_samples': 3000 }, // bosque secundario
    { 'class_id': 61, 'n_samples': 1000 }, // salar
  //  { 'class_id': 62, 'n_samples': 3000 }, // salar cubierto
    { 'class_id': 63, 'n_samples': 1000 }, // estepa
    { 'class_id': 66, 'n_samples': 1000 }, // matorral
  //  { 'class_id': 67, 'n_samples': 3000 }, // bosque achaparrado
  //  { 'class_id': 77, 'n_samples': 3000 }, // invasión de aromo
  //  { 'class_id': 79, 'n_samples': 3000 }, // plantación de 
  //  { 'class_id': 80, 'n_samples': 3000 }, // plantación de 
];

/*
//Esta sección sirve para filtrar clases por valores de altura estimada con GEDI
var gediThreshPerClass = [
    { 'class_id': 59, 'min_value': 3, 'max_value': 100 },
    { 'class_id': 60, 'min_value': 3, 'max_value': 100 },
    { 'class_id': 66, 'min_value': 0, 'max_value': 2 },
]; */


//Assets

var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ regionId.toString();
var outputFolder = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/STABLE'+ regionId.toString();
var assetStable = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-stable/stable-'
    + regionId.toString()
    + '-' +
    version.stable_map;

var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2';

// Defino el Mosaico y el FeatureSpace
var regions = ee.FeatureCollection(assetRegions);

//
var featureSpace = [
'aspect',
'blue_amp',
'blue_max',
'blue_median',
'blue_median_dry',
'blue_median_wet',
'blue_min',
'blue_stdDev',
'cai_amp',
'cai_max',
'cai_median',
'cai_median_dry',
'cai_median_wet',
'cai_min',
'cai_stdDev',
'cloud_amp',
'cloud_max',
'cloud_median',
'cloud_median_dry',
'cloud_median_wet',
'cloud_min',
'cloud_stdDev',
'elevation',
'evi2_amp',
'evi2_max',
'evi2_median',
'evi2_median_dry',
'evi2_median_wet',
'evi2_min',
'evi2_stdDev',
'fns_amp',
'fns_max',
'fns_median',
'fns_median_dry',
'fns_median_wet',
'fns_min',
'fns_stdDev',
'gcvi_amp',
'gcvi_max',
'gcvi_median',
'gcvi_median_dry',
'gcvi_median_wet',
'gcvi_min',
'gcvi_stdDev',
'green_amp',
'green_max',
'green_median',
'green_median_dry',
'green_median_texture',
'green_median_wet',
'green_min',
'green_stdDev',
'gv_amp',
'gv_max',
'gv_median',
'gv_median_dry',
'gv_median_wet',
'gv_min',
'gv_stdDev',
'gvs_amp',
'gvs_max',
'gvs_median',
'gvs_median_dry',
'gvs_median_wet',
'gvs_min',
'gvs_stdDev',
'hallcover_amp',
'hallcover_max',
'hallcover_median',
'hallcover_median_dry',
'hallcover_median_wet',
'hallcover_min',
'hallcover_stdDev',
'hallheigth_amp',
'hallheigth_max',
'hallheigth_median',
'hallheigth_median_dry',
'hallheigth_median_wet',
'hallheigth_min',
'hallheigth_stdDev',
 'mbi',
'ndbi',
'ndfi_amp',
'ndfi_max',
'ndfi_median',
'ndfi_median_dry',
'ndfi_median_wet',
'ndfi_min',
'ndfi_stdDev',
'ndmi',
'ndsi',
'ndvi_amp',
'ndvi_max',
'ndvi_median',
'ndvi_median_dry',
'ndvi_median_wet',
'ndvi_min',
'ndvi_stdDev',
'ndwi_amp',
'ndwi_max',
'ndwi_median',
'ndwi_median_dry',
'ndwi_median_wet',
'ndwi_min',
'ndwi_stdDev',
'nir_amp',
'nir_max',
'nir_median',
'nir_median_dry',
'nir_median_wet',
'nir_min',
'nir_stdDev',
'npv_amp',
'npv_max',
'npv_median',
'npv_median_dry',
'npv_median_wet',
'npv_min',
'npv_stdDev',
'pri_amp',
'pri_max',
'pri_median',
'pri_median_dry',
'pri_median_wet',
'pri_min',
'pri_stdDev',
'red_amp',
'red_max',
'red_median',
'red_median_dry',
'red_median_wet',
'red_min',
'red_stdDev',
'savi_amp',
'savi_max',
'savi_median',
'savi_median_dry',
'savi_median_wet',
'savi_min',
'savi_stdDev',
'sefi_amp',
'sefi_max',
'sefi_median',
'sefi_median_dry',
'sefi_median_wet',
'sefi_min',
'sefi_stdDev',
'shade_amp',
'shade_max',
'shade_median',
'shade_median_dry',
'shade_median_wet',
'shade_min',
'shade_stdDev',
'slope',
'soil_amp',
'soil_max',
'soil_median',
'soil_median_dry',
'soil_median_wet',
'soil_min',
'soil_stdDev',
'swir1_amp',
'swir1_max',
'swir1_median',
'swir1_median_dry',
'swir1_median_wet',
'swir1_min',
'swir1_stdDev',
'swir2_amp',
'swir2_max',
'swir2_median',
'swir2_median_dry',
'swir2_median_wet',
'swir2_min',
'swir2_stdDev',
'tpi',
'wefi_amp',
'wefi_max',
'wefi_median',
'wefi_median_dry',
'wefi_median_wet',
'wefi_min',
'wefi_stdDev'
];

var classValues = nSamplesPerClass.map(
    function (item) {
        return item.class_id;
    }
);

var classPoints = nSamplesPerClass.map(
    function (item) {
        return item.n_samples;
    }
);

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

var mosaics = ee.ImageCollection(assetMosaics);
var stable = ee.Image(assetStable).rename('reference');
Map.addLayer(stable, visClass, 'Stable', true);

//
/// Remapeo manual usando polígonos dibujados (opcional)
var drawinfTools = Map.drawingTools();

var geometryList = drawinfTools.layers().map(function (obj) {
    var eeObject = obj.getEeObject();
    return ee.Algorithms.If(
        ee.String(ee.Algorithms.ObjectType(eeObject)).equals('FeatureCollection'),
        eeObject,
        ee.FeatureCollection(eeObject)
    );
});

var featCollection = ee.FeatureCollection(geometryList)
    .flatten()
    .filter(ee.Filter.neq('from', null))
    .filter(ee.Filter.neq('to', null));

print(featCollection);

// Crear imágenes "from" y "to" para remapeo (si existen polígonos)
var imageFrom = ee.Image().paint(featCollection, 'from');
var imageTo = ee.Image().paint(featCollection, 'to');

var stableRemapped = ee.Image(ee.Algorithms.If(
    featCollection.size().gt(0),
    stable.where(stable.eq(imageFrom), imageTo),
    stable
)).rename('reference');



// Generar muestras estratificadas desde la imagen estable (sin GEDI)
var stableSamples = stableRemapped.stratifiedSample({
    'numPoints': 0,
    'classBand': 'reference',
    'region': aoi,//regions.geometry(),
    'classValues': classValues,
    'classPoints': classPoints,
    'scale': 30,
    'seed': 1,
    'geometries': true
});

// Exportar muestras por año con bandas espectrales
years.forEach(function (year) {
    var mosaicYear = mosaics
        .filter(ee.Filter.eq('year', year))
        .filter(ee.Filter.bounds(aoi))
        .mosaic()
        .select(featureSpace)
        .clip(aoi);

    var trainedSamples = stableRemapped
        .rename('class')
        .clip(aoi)
        .addBands(mosaicYear)
        .reduceRegions({
            'collection': stableSamples,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        })
        .filter(ee.Filter.notNull(['green_median_texture'])); // Puedes cambiar por otra banda si es necesario

    var outputName = 'samples-stable-' +aoiId.toString() + '-' + year.toString() +'-' + regionId.toString() + '-' + version.output_samples;
    +aoiId.toString() + '-' + year.toString() +

Map.addLayer(mosaicYear, visMos, year + '-Mosaico', false);
Map.addLayer(stableSamples, {color: 'red'}, 'Puntos generados', false);
    
    Export.table.toAsset({
        'collection': trainedSamples,
        'description': outputName,
        'assetId': outputFolder + '/' + outputName
    });
    
    print('Año', year, 'Muestras con espectro:', trainedSamples.limit(5));
});

Map.addLayer(stableRemapped, visClass, 'Stable remapeada', true);
Map.addLayer(regions, {}, 'regions', false);
