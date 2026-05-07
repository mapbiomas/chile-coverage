// Este Script colecta la información espectral de las bandas del feature Space en cada uno de los puntos 
// generados aletoriamente dentro de los polígonos base
var aoi = geometry3;
var aoiId = 3 ;
var versionOutput = 1; // Versión de las muestras a guardar

var assetSamples = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/INFRAESTRUCTURE/'; //Directorio de salida para las muestras
var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2';  //Mosaico
var mosaics = ee.ImageCollection(assetMosaics); 

var mascara = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/urban-mask-1') //Máscara de infraestructura potencial
                                                        .clip(aoi); // corto para agilizar el procesamiento


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Años del mosaico para considerar en la toma de muestras
var years = [ 1997, 1998, 1999, 
    2000, 2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];

// El feature Space se basa en el de venezuela más algunas otras bandas de interés. 

var featureSpace = [
'blue_amp',
'blue_max',
'blue_median',
'blue_median_dry',
'blue_median_wet',
'blue_min',
'blue_stdDev',
'cloud_amp',
'cloud_max',
'cloud_median',
'cloud_median_dry',
'cloud_median_wet',
'cloud_min',
'cloud_stdDev',
'evi2_amp',
'evi2_max',
'evi2_median',
'evi2_median_dry',
'evi2_median_wet',
'evi2_min',
'evi2_stdDev',
'green_amp',
'green_max',
'green_median',
'green_median_dry',
'green_median_texture',
'green_median_wet',
'green_min',
'green_stdDev',
 'mbi',
'ndbi',
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
'tpi'
];

//Número de puntos a generar en el total de las áreas de entrenamiento.

//Esto lo podemos discutir. 
var nTrainingPoints = 2000 ;  // Number of points to training

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Parámetros de visalización de las capas
//Clasificación
var palettes = require('users/mapbiomas/modules:Palettes.js');
var mapbiomasPalette = palettes.get('classification8'); //esta versión de la paletta no es la más reciente
mapbiomasPalette[24] = 'D900C8';
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

//Mosaico
var visMos = {
    'bands': [
        'swir1_median',
        'nir_median',
        'red_median'
    ],
    'gain': [0.08, 0.06, 0.2],
    'gamma': 0.85
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Agrego el asset de las áreas de entrenamiento. 
//Las clases dependen de cada ecoregión, las que no correspondan se deben comentar '//'

var region = typeof (userRegion) !== 'undefined' ? userRegion : aoi;
var samplesList = [
    typeof (c59) !== 'undefined' ? c59 : ee.FeatureCollection(assetSamples+'polygons-base-c59-chile'), // Bosque Nativo Primario
    typeof (c60) !== 'undefined' ? c60 : ee.FeatureCollection(assetSamples+'polygons-base-c60-chile'), // Bosque Nativo Secundario
   // typeof (c67) !== 'undefined' ? c67 : ee.FeatureCollection(assetSamples+'polygons-base-c67-chile'), // Bosque Achaparrado
    typeof (c66) !== 'undefined' ? c66 : ee.FeatureCollection(assetSamples+'polygons-base-c66-chile'), // Matorrales
    typeof (c11) !== 'undefined' ? c11 : ee.FeatureCollection(assetSamples+'polygons-base-c11-chile'), // humedales
    typeof (c79) !== 'undefined' ? c79 : ee.FeatureCollection(assetSamples+'polygons-base-c79-chile'), // Coniferas
    typeof (c80) !== 'undefined' ? c80 : ee.FeatureCollection(assetSamples+'polygons-base-c80-chile'), // Latifoliadas
    typeof (c23) !== 'undefined' ? c23 : ee.FeatureCollection(assetSamples+'polygons-base-c23-chile'), // Arenas, Playas y Dunas      
    typeof (c15) !== 'undefined' ? c15 : ee.FeatureCollection(assetSamples+'polygons-base-c15-chile'), // Praderas
    typeof (c18) !== 'undefined' ? c18 : ee.FeatureCollection(assetSamples+'polygons-base-c18-chile'), // Agricultura
    typeof (c12) !== 'undefined' ? c12 : ee.FeatureCollection(assetSamples+'polygons-base-c12-chile'), // Herbazales
   // typeof (c63) !== 'undefined' ? c63 : ee.FeatureCollection(assetSamples+'polygons-base-c63-chile'), // Estepa 
   // typeof (c21) !== 'undefined' ? c21 : ee.FeatureCollection(assetSamples+'polygons-base-c21-chile'), // Mosaico Agricultura Pastura
    typeof (c25) !== 'undefined' ? c25 : ee.FeatureCollection(assetSamples+'polygons-base-c25-chile'), // Otras Areas sin Vegetacion
    typeof (c33) !== 'undefined' ? c34 : ee.FeatureCollection(assetSamples+'polygons-base-c33-chile'), // agua
    typeof (c34) !== 'undefined' ? c34 : ee.FeatureCollection(assetSamples+'polygons-base-c34-chile'), // Nieve y Hielo
    typeof (c29) !== 'undefined' ? c29 : ee.FeatureCollection(assetSamples+'polygons-base-c29-chile'), // Afloramiento Rocosos
    typeof (c24) !== 'undefined' ? c24 : ee.FeatureCollection(assetSamples+'polygons-base-c24-chile'), // Infraestructura Urbana
    typeof (c61) !== 'undefined' ? c61 : ee.FeatureCollection(assetSamples+'polygons-base-c61-chile'), // Salares
   // typeof (c62) !== 'undefined' ? c62 : ee.FeatureCollection(assetSamples+'polygons-base-c62-chile'), // Salares cubiertos **
];
//Se puede revisar en la consola la lista de poligonos
//print('Sample poligon List:', samplesList);

//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------

/**
 * Funcion para crear puntos aleatorios dentro de los polígonos:
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
var generatePoints = function (polygons, nPoints) {
    // convert polygons to raster
    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'class'
    }).rename('class');

    // Generate N random points inside the polygons
    var points = polygonsRaster.stratifiedSample({
        'numPoints': nPoints,
        'classBand': 'class',
        'region': polygons,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true
    });
    return points;
};
//------------------------------------------------------------------
// Unir todos los poligonos de diferentes clases
var samplesPolygons = ee.List(samplesList).iterate(
    function (sample, samplesPolygon) {
        return ee.FeatureCollection(samplesPolygon).merge(sample);
    },
    ee.FeatureCollection([])
);

// Filtrar por "userRegion" si existe
samplesPolygons = ee.FeatureCollection(samplesPolygons)
    .filter(ee.Filter.bounds(aoi));

// avoid geodesic operation error
samplesPolygons = samplesPolygons.map(
    function (polygon) {
        return polygon.buffer(1, 10);
    }
);

// Generar puntos de entrenamiento desde los polígonos de muestra
var generatedPoints = generatePoints(samplesPolygons, nTrainingPoints);
// Unir los puntos generados con los puntos externos
var allPoints = generatedPoints;

// Mezclar aleatoriamente los puntos
var randomized = allPoints.randomColumn('random'); // Agrega columna aleatoria

// Separar el 80% como entrenamiento
var trainingPoints = randomized.filter(ee.Filter.lt('random', 0.8))
  .map(function(f) {
    return f.set('sample_type', 'training');
  });

// El 20% restante como validación
var validationPoints = randomized.filter(ee.Filter.gte('random', 0.8))
  .map(function(f) {
    return f.set('sample_type', 'validation');
  });

// Revisar histogramas por clase
print('trainingPoints 80%', trainingPoints.aggregate_histogram('class'));
print('validationPoints 20%', validationPoints.aggregate_histogram('class'));

// set sample type
trainingPoints = trainingPoints.map(
    function (sample) {
        return sample.set('sample_type', 'training');
    }
);
validationPoints = validationPoints.map(
    function (sample) {
        return sample.set('sample_type', 'validation');
    }
);

// merge training and validation points
var samplesPoints = trainingPoints.merge(validationPoints);

// visualize points using mapbiomas color palette
var samplesPointsVis = samplesPoints.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('class')),
            'width': 1,
        });
    }
);

years.forEach(
    function (year) {
        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(aoi))
            .mosaic()
            ;

        mosaicYear = mosaicYear
                      .select(featureSpace)
                      .clip(aoi)//Podemos filtrar las variables a usar
                      .updateMask(mascara.eq(1)); // aplicar máscara donde sea 1
                      
                      Map.addLayer(mosaicYear, visMos, year.toString()+'-mosaico', false); //y agregar el mosaico al mapa

        // Collect the spectral information to get the trained samples
        var trainedSamples = mosaicYear.reduceRegions({
            'collection': samplesPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        });

        trainedSamples = trainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        // Export points to asset
        var pointsName = 'samples-points-infraestructura-' + year.toString() + '-' + versionOutput+'-'+aoiId;

        Export.table.toAsset({
            "collection": trainedSamples,
            "description": pointsName,
            "assetId": assetSamples  + pointsName
        });
    });

//Visualizamos algunas capas en el mapa
Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'samples - points');

// Export polygons to asset
var polygonsName = 'samples-polygons-infraestructura-' + versionOutput+'-'+aoiId;

Export.table.toAsset({
    "collection": samplesPolygons,
    "description": polygonsName,
    "assetId": assetSamples + polygonsName
});
