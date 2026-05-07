//Script para clasificar Infraestructura. 
//Este script tomas los puntos adicionales exportados de la classificación preliminar
//además revisa subecoregiones
//-----------------------------------------------------------------------------------------------------------------------------------------------

 
//Parámetros
Map.setOptions("HYBRID"); // mapa base

var ecorregionId = 'E2'; //Seleccionar la ecorregión

var version = { //version de archivos de salida
    'aditional_samples': '1', // output samples
    'samples':'1',
    'classification': '1',    // output classification
};

//Ponderación de las muestras 
// [0] none
// [0.5] 50% of points
// [0.75] 75% of points
// [1] all points
var classWeights = [
    [24, 0.75], // Infraestructura
    [68, 0.5], // Otros
];


// Número de muestras complementarias a generar
    var complementary = [
    [24, 500], // Infraestructura
    [68, 500], // Otros
];

// Mínimo y máximo n° de muestras para clasificación
var nSamplesAllowed = {
    'min': 200,
    'max': 3000,
};

// Parámetros de random forest
var rfParams = {
    'numberOfTrees': 100, //100
    'variablesPerSplit': 4,
    'minLeafPopulation': 25,
    'seed': 1
};

//VARIABLES
var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2'; //input Mosaico
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString(); // input Limite ecorregión
var assetSamples = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/INFRAESTRUCTURE'; //input - output puntos de entrenamiento 
var assetClass = 'projects/mapbiomas-chile/assets/COLLECTION1/classification-urbano'; // output classifciación 
var mosaics = ee.ImageCollection(assetMosaics);
var regions = ee.FeatureCollection(assetRegions);
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = regions.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

//MASCARA URBANO
var mascara = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/urban-mask-1')
                                              .clip(selectedRegionSimplified);
                        Map.addLayer(mascara, null, 'Máscara', false);

//AÑOS
var years = [
    /* 1997, 1998, 1999, 2000 , 
     2001, 2002, 2003, 2004, 2005,
     2006, 2007, 2008, 2009, 2010,
     2011, 2012, 2013, 2014, 2015,
     2016, 2017, 2018, 2019, 2020,
     2021, 2022, 2023, 2024, 2025*/
     2004,2014, 2024
];
 

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

var visReal = {
    'bands': [
        'red_median',
        'green_median',
        'blue_median'
    ],
    'gamma': 1.5,
    'min':80 ,
    'max':3800
};

//LISTA DE VARIABLES A UTILIZAR
var featureSpace = [
//'blue_amp',
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



///////////////////////////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------
// User defined functions
//------------------------------------------------------------------
/**
 * Create a function to collect random point inside the polygons
 * @param {*} polygons 
 * @param {*} nPoints 
 * @returns 
 */
var generateAditionalPoints = function (polygons, classValues, classPoints) {

    // convert polygons to raster
    var polygonsRaster = ee.Image().paint({
        featureCollection: polygons,
        color: 'urban'
    }).rename('urban');

    // Generate N random points inside the polygons
    var points = polygonsRaster.stratifiedSample({
        'numPoints': 1,
        'classBand': 'urban',
        'classValues': classValues,
        'classPoints': classPoints,
        'region': polygons,
        'scale': 30,
        'seed': 1,
        'dropNulls': true,
        'geometries': true,
    });

    return points;
};

/**
 * 
 * @param {*} collection 
 * @param {*} seed 
 */
var shuffle = function (collection, seed) {
    // Adds a column of deterministic pseudorandom numbers to a collection.
    // The range 0 (inclusive) to 1000000000 (exclusive).
    collection = collection.randomColumn('random', seed || 1)
        .sort('random', true)
        .map(
            function (feature) {
                var rescaled = ee.Number(feature.get('random'))
                    .multiply(1000000000)
                    .round();
                return feature.set('new_id', rescaled);
            }
        );
    // list of random ids
    var randomIdList = ee.List(
        collection.reduceColumns(ee.Reducer.toList(), ['new_id'])
            .get('list'));
    // list of sequential ids
    var sequentialIdList = ee.List.sequence(1, collection.size());
    // set new ids
    var shuffled = collection.remap(randomIdList, sequentialIdList, 'new_id');
    return shuffled;
};


var samplesList = [
    typeof (c59) !== 'undefined' ? c59 : ee.FeatureCollection([]), // 1.1 Bosque Nativo Primario
    typeof (c60) !== 'undefined' ? c60 : ee.FeatureCollection([]), // 1.2 Bosque Nativo Secundario/Renovales
    typeof (c67) !== 'undefined' ? c67 : ee.FeatureCollection([]), // 1.2 Bosque Nativo Achaparrado
    typeof (c68) !== 'undefined' ? c68 : ee.FeatureCollection([]),
    typeof (c66) !== 'undefined' ? c66 : ee.FeatureCollection([]), // 2.1 Matorrales
    typeof (c12) !== 'undefined' ? c12 : ee.FeatureCollection([]), // 2.2 Pastizales
    typeof (c11) !== 'undefined' ? c11 : ee.FeatureCollection([]), // 2.3 Humedales
    typeof (c18) !== 'undefined' ? c18 : ee.FeatureCollection([]), // 3.2 Agricultura
    typeof (c9) !== 'undefined'  ? c9  : ee.FeatureCollection([]), // 3.5 Bosque Plantado/Silvicultura
    typeof (c23) !== 'undefined' ? c23 : ee.FeatureCollection([]), // 4.1 Arenas, Playas y Dunas
    typeof (c29) !== 'undefined' ? c29 : ee.FeatureCollection([]), // 4.2 Suelos Rocosos
    typeof (c24) !== 'undefined' ? c24 : ee.FeatureCollection([]), // 4.3 Infraestructura Urbana
    typeof (c61) !== 'undefined' ? c61 : ee.FeatureCollection([]), // 4.4 Salares
    typeof (c25) !== 'undefined' ? c25 : ee.FeatureCollection([]), // 4.5 Otras Areas sin Vegetacion
    typeof (c33) !== 'undefined' ? c33 : ee.FeatureCollection([]), // 5.1 Rios, Lagos y Oceanos
    typeof (c34) !== 'undefined' ? c34 : ee.FeatureCollection([]), // 5.2 Nieve y Hielo
    typeof (c27) !== 'undefined' ? c27 : ee.FeatureCollection([]), // 6.1 No Observado
];
//print(samplesList);

// merges all polygons
var samplesPolygons = ee.List(samplesList).iterate(
    function (sample, samplesPolygon) {
        return ee.FeatureCollection(samplesPolygon).merge(sample);
    },
    ee.FeatureCollection([])
);

// filter by user defined region "userRegion" if exists
samplesPolygons = ee.FeatureCollection(samplesPolygons).filter(ee.Filter.bounds(selectedRegionSimplified));
// avoid geodesic operation error
samplesPolygons = samplesPolygons.map(
    function (polygon) {
        return polygon.buffer(1, 10);
    }
);
var classValues = complementary.map(
    function (array) {
        return array[0];
    }
);
var classPoints = complementary.map(
    function (array) {
        return array[1];
    }
);



// generate training points
var aditionalTrainingPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);
// generate validation points
var aditionalValidationPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);

print('trainingPoints', aditionalTrainingPoints.aggregate_histogram('urban'));
//print('validationPoints', aditionalValidationPoints.aggregate_histogram('class'));*/

// set sample type
aditionalTrainingPoints = aditionalTrainingPoints.map(
    function (sample) {
        return sample.set('sample_type', 'training');
    }
);

aditionalValidationPoints = aditionalValidationPoints.map(
    function (sample) {
        return sample.set('sample_type', 'validation');
    }
);

// merge training and validation points
var aditionalSamplesPoints = aditionalTrainingPoints.merge(aditionalValidationPoints);

// visualize points using mapbiomas color palette
var samplesPointsVis = aditionalSamplesPoints.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('urban')),
            'width': 1,
        });
    }
);



var classifiedList = [];
years.forEach(
    function (year) {
        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(aoi))
            .mosaic();
        mosaicYear = mosaicYear
          .select(featureSpace) //Puedo seleccionar solo algunas bandas si quiero
          .clip(aoi)
          .updateMask(mascara.eq(1));

        var trainedSamples = ee.FeatureCollection(
            assetSamples + '/samples-points-infraestructura-'+ year.toString() + '-' + version.samples);

        // shuffle the points
        var shuffledSamples = shuffle(trainedSamples, 2);

        //Agregar una nueva columna con las nuevas clases "class" to "urban"
        function asignarUrban(feature) {
        // Intenta obtener el valor de la propiedad 'class', asumiendo un valor predeterminado si no existe
        var clase = ee.Number(ee.Algorithms.If(feature.get('class'), feature.get('class'), null));
        // Utiliza ee.Algorithms.If para verificar si 'class' es igual a 24 y asignar valores en consecuencia
        var urban = ee.Algorithms.If(ee.Number(clase).eq(24), 24, 68);
        // Retorna el feature con la nueva propiedad 'urban' agregada
        return feature.set('urban', urban);
                                }

       var trainedSamples = trainedSamples.map(asignarUrban);
       
        // shuffle the points
       // var shuffledSamples = shuffle(trainedSamples, 2);
        var shuffledSamples = shuffle(trainedSamples, 2);
        var weightedSamples = classWeights.map(
            function (classWeight) {
                var classId = classWeight[0];
                var weight = classWeight[1];

                var nSamples = Math.max(Math.round(nSamplesAllowed.max * weight), nSamplesAllowed.min);

               // return shuffledSamples.filter(ee.Filter.eq('class', classId))
                return shuffledSamples.filter(ee.Filter.eq('urban', classId))
                    .limit(nSamples);
            }
        );


        var weightedSamples = ee.FeatureCollection(weightedSamples).flatten();
        
      // Collect the spectral information to get the trained samples
        var additionalTrainedSamples = mosaicYear.reduceRegions({
            'collection': aditionalTrainingPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        });
        
        var additionalValidationSamples = mosaicYear.reduceRegions({
            "collection": aditionalValidationPoints,
            "reducer": ee.Reducer.first(),
            "scale": 30
          })

        additionalValidationSamples = additionalValidationSamples.filter(ee.Filter.notNull(['green_median_texture']));
        additionalTrainedSamples = additionalTrainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        weightedSamples = weightedSamples.map(function(f) {
          return f.set('class', ee.Number(f.get('urban')).toFloat());
        });
        additionalTrainedSamples = additionalTrainedSamples.map(function(f) {
          return f.set('class', ee.Number(f.get('urban')).toFloat());
        });
        additionalValidationSamples = additionalValidationSamples.map(function(f) {
          return f.set('class', ee.Number(f.get('urban')).toFloat());
        });

        // merge stable and additional training samples
        var allTrainedSamples = weightedSamples
          .merge(additionalTrainedSamples)
          .merge(additionalValidationSamples);
          
        var numberOfClassRemaining = ee.Number(weightedSamples.aggregate_count_distinct('urban'));
        // Separar muestras según tipo 'entrenamiento' y  'validación'
        var trainingSamples = allTrainedSamples.filter(ee.Filter.eq('sample_type', 'training'));
        var validationSamples = allTrainedSamples.filter(ee.Filter.eq('sample_type', 'validation'));
        print('Trained Samples:'+ year.toString(), trainingSamples.aggregate_histogram('urban'));
        //print('Validation Samples:'+ year.toString(), validationSamples.aggregate_histogram('class'));
    

//-----------------------------------------------------------------------------------------------------------------
       //Clasificación
       
        var classifier = ee.Classifier.smileRandomForest(rfParams)
           .train(allTrainedSamples, 'urban', featureSpace);
           // .train(allTrainedSamples.filter(ee.Filter.eq('sample_type', 'training')), 'class', featureSpace);
        //Analizar importancia de las variables
      //  print(classifier.explain(), 'explain classifier')

        var classified = ee.Algorithms.If(
            allTrainedSamples.size().gt(0),
            ee.Algorithms.If(
                numberOfClassRemaining.gt(1),
                mosaicYear.classify(classifier),
                ee.Image(0)
            ),
            ee.Image(0)
        );

        classified = ee.Image(classified).rename('classification_' + year.toString()).updateMask(mascara.eq(1));

        classifiedList.push(classified);

       Map.addLayer(mosaicYear, visReal, year + ' ' + ecorregionId.toString(), false);
       Map.addLayer(classified, visClass, year + ' ' + ecorregionId.toString() + ' ' + 'class', true);
       Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'weighted samples - ' + year.toString(), false);

          
       // Export points to asset
        var pointsName = 'samples-points-infraestructura-' + ecorregionId.toString() + '-' + year.toString() + '-aditional-' + version.aditional_samples;
        Export.table.toAsset({
            "collection": allTrainedSamples,
            "description": pointsName,
            "assetId": assetSamples + '/' + pointsName
        });
    }
);

//----------------------------------------------------------------------------------------------------------------------------
//Convertir la classificación en una imagen multibanda

var classifiedStack = ee.Image(classifiedList);
classifiedStack = classifiedStack
    .set('collection_id', 1.0)
    .set('version', version.classification)
    .set('territory', 'CHILE');


Export.image.toAsset({
    "image": classifiedStack,
    "description": 'CHILE-URBANO-' + version.classification,
    "assetId": assetClass + 'CHILE-URBANO-' + version.classification,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": selectedRegionSimplified
}); 
