//Script para clasificación preliminar
// En este script se utilizan los puntos con datos de entrenamiento extraidos del Script Modelo 01. 
// Además se pueden sumar áreas complementarias obtenidas con Script Modelo 0. 

// Este script debe ser guardado con el código de la ecoregión '02-classification-preliminar-ec1'
// ------------------------------------------------------------------------------------------
Map.setOptions('Hybrid');
//Parámetros a modificar
var ecoregionId = 'E5S2'; // define la ecoregión
var version_output = 1; // la versión de la clasificación 
var version_samples = 1; //la versión de las muestras
//---------------------------------------------------------------------------------------------
//Variables de entrada
var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2'; //Mosaico
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecoregionId.toString(); //defino la ecoregión
var assetSamples = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/STABLE/'+ecoregionId.toString(); //Directorio de entrada y salida para las muestras
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-'+ecoregionId.toString(); //ImageCollection para guardar clasificación preliminar 
var mosaics = ee.ImageCollection(assetMosaics);
//print(mosaics, 'mosaicos');

//Casificación clases colindantes
var assetE4 = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E4';
var assetEX = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-'+ecoregionId.toString(); // classificación preliminar de tu ecoregión
var assetE2 = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E2';
var assetE3 = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E3';
var class01 = 'projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE_COL1_2v5';

/*
//polygonos de otras ecoregiones
var polygonsE2 = ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/E2/samples-polygons-E2-1');
var c25E2 = polygonsE2.filter(ee.Filter.eq('class', 25));
var c12E2 = polygonsE2.filter(ee.Filter.eq('class', 12));
*/

//Otras capas de interés para visualizar
var salares = ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/CLASES/C61/Salares');
var humedales = ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/CLASES/C11/Inventario_humedales_2015')
                                    .filter(ee.Filter.bounds(aoi));

//--------------------------------------------------------------------------------------------
////Puntos Externos con información espectral, para agregar más se debe agregar en líneas separadas por coma
var assetExternalPoints = []; //es una lista
// Función para cargar cada FeatureCollection
 var colecciones = assetExternalPoints.map(function(asset) {
 var FC = ee.FeatureCollection(asset);
  return FC;
});
//
//// Une todas las colecciones en un solo FeatureCollection
var assetExternalPoints = ee.FeatureCollection(colecciones).flatten();
//------------------------------------------------------------------------------------------------

var selectedRegion = ee.FeatureCollection(assetRegions); //la geometría es muy compleja para procesar
// Se simplifica
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = selectedRegion.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

//var selectedRegionSimplified = geometry;
//-------------------------------------------------------------------------------------------
//Número minimo y máximo de muestras permitidas por clase Para entrenar el modelo
//Si no alcanza el minimo de 200 puntos, debe agregar muestras complementarias

// min and max number of samples allowed
var nSamplesAllowed = {
    'min': 200,  // Si no se cumple, se debe tomar muestras complementarias.
    'max': 2000, // se puede modificar
};

//------------------------------------------------------------------------------------------

//Limitar los puntos externos
 //Paso 1: Añadir una columna aleatoria
var randomizedExternalPoints = assetExternalPoints.randomColumn('random');
// Paso 2: Limitar el número de puntos de forma aleatoria
var externalPoints = randomizedExternalPoints
  .sort('random')            // ordena por la columna aleatoria
  .limit(nSamplesAllowed.max);   // selecciona n puntos aleatorios
print(externalPoints, 'Puntos complementarios'); //Revisar si tiene propiedad class 


//-------------------------------------------------------------------------------------------
//Ajustar la proporción de los puntos de acuerdo a los resultados de la Colección 1
// Revisar Script Auxiliar 01

// [0] none
// [0.5] 50% of points
// [0.75] 75% of points
// [1] all points

var classWeights = [
    [59, 0.1], // Bosque Nativo Primario
    [60, 1], // Bosque Nativo Secundario/Renovales
    [67, 1], // Bosque Nativo Achaprrado
    [66, 1], // Matorrales
    [11, 1], // Humedales
    [12, 1], // Herbazales
    [18, 0.6], // Agricultura
    [15, 1], // Pradera
    [79, 1], // Coniferas
    [80, 1], // Latifoliadas
    [23, 1], // Arenas, Playas y Dunas
    [29, 0.6], // Afloramiento Rocosos
   // [24, 1], // Infraestructura Urbana
    [63, 1], // Estepa
    [61, 1], // Salares
    [25, 1], // Otras Areas sin Vegetacion
    [33, 1], // Rios, Lagos y Oceanos
    [34, 1], // Nieve y Hielo
//  [9, 0],  // Silvicultura

];

//Si se agregan muestras complementarias, defina cuantos puntos se deben crear
var complementary = [
    [59, 200], // Bosque Nativo Primario
  //  [60, 200], // Bosque Nativo Secundario/Renovales
  //  [67, 0], // Bosque Nativo Achaprrado
    [66, 200], // Matorrales
    [11, 200], // Humedales
   // [12, 200], // Herbazales
    [18, 200], // Agricultura
  //  [15, 0], // Pastura
  //  [79, 0], // Coniferas
  //  [80, 0], // Latifoliadas
    [23, 200], // Arenas, Playas y Dunas
    [29, 200], // Afloramiento Rocosos
  //  [24, 0], // Infraestructura Urbana
    [63, 400], // Estepa
    [61, 200], // Salares
    [25, 200], // Otras Areas sin Vegetacion
    [33, 200], // Rios, Lagos y Oceanos
    [34, 200], // Nieve y Hielo
];

//----------------------------------------------------------------------------------------
//Parametros del algoritmo Random Forest
var rfParams = {
    'numberOfTrees': 100, //100
    'variablesPerSplit': 4,
    'minLeafPopulation': 25,
    'seed': 1 
};

//Años a considerar en la clasificación
var years = [
   /*1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004, 2005,
    2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015,
    2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024 ,2025*/
  
   2004, 2014,2024
];
//----------------------------------------------------------------------------------------

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
//
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
        color: 'class'
    }).rename('class');

    // Generate N random points inside the polygons
    var points = polygonsRaster.stratifiedSample({
        'numPoints': 1,
        'classBand': 'class',
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

/**
 * Devuelve una imagen de clasificación para un año desde un asset.
 * @param {String} assetPath - Ruta del asset (ImageCollection)
 * @param {Number} year - Año que se desea filtrar
 * @returns {ee.Image} Imagen clasificada para el año dado
 */
function getClassifiedImage(assetPath, year) {
  return ee.ImageCollection(assetPath)
           .filter(ee.Filter.eq('year', year))
           .mosaic()
           .set('year', year);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var region = typeof (userRegion) !== 'undefined' ? userRegion : aoi;

//Agregar muestras complementarias 
//Deben eliminar la clase en 'geometry imports' en el lienzo si cargarán puntos externos
var samplesList = [
    typeof (c59) !== 'undefined' ? c59 : ee.FeatureCollection([]), // Bosque Nativo Primario
    typeof (c60) !== 'undefined' ? c60 : ee.FeatureCollection([]), // Bosque Nativo Secundario
    typeof (c67) !== 'undefined' ? c67 : ee.FeatureCollection([]), // Bosque Achaparrado
    typeof (c66) !== 'undefined' ? c66 : ee.FeatureCollection([]), // Matorrales
    typeof (c11) !== 'undefined' ? c11 : ee.FeatureCollection([]), // Humedal
    typeof (c12) !== 'undefined' ? c12 : ee.FeatureCollection([]), // Herbazal
    typeof (c15) !== 'undefined' ? c15 : ee.FeatureCollection([]), // Praderas
    typeof (c18) !== 'undefined' ? c18 : ee.FeatureCollection([]), // Agricultura
    typeof (c79) !== 'undefined' ? c79 : ee.FeatureCollection([]),// Coniferas
    typeof (c80) !== 'undefined' ? c80 : ee.FeatureCollection([]), // Latifoliadas
    typeof (c23) !== 'undefined' ? c23 : ee.FeatureCollection([]), // Arenas, Playas y Dunas
    typeof (c29) !== 'undefined' ? c29 : ee.FeatureCollection([]), // Afloramiento Rocosos
    typeof (c24) !== 'undefined' ? c24 : ee.FeatureCollection([]), // Infraestructura Urbana
    typeof (c61) !== 'undefined' ? c61 : ee.FeatureCollection([]), // Salares
    typeof (c63) !== 'undefined' ? c63 : ee.FeatureCollection([]), // Estepa
    typeof (c25) !== 'undefined' ? c25 : ee.FeatureCollection([]), // Otras Areas sin Vegetacion
    typeof (c33) !== 'undefined' ? c33 : ee.FeatureCollection([]), // Rios, Lagos y Oceanos
    typeof (c34) !== 'undefined' ? c34 : ee.FeatureCollection([]), // Nieve y Hielo
    //typeof (c09) !== 'undefined' ? c09 : ee.FeatureCollection([]), // Silvicultura
    //typeof (c03) !== 'undefined' ? c09 : ee.FeatureCollection([]), // Bosque 
];

print(samplesList, 'muestras complementarias');
// merges all polygons
var samplesPolygons = ee.List(samplesList).iterate(
    function (sample, samplesPolygon) {
        return ee.FeatureCollection(samplesPolygon).merge(sample);
    },
    ee.FeatureCollection([])
);

// filter by user defined region "userRegion" if exists
samplesPolygons = ee.FeatureCollection(samplesPolygons)
    .filter(ee.Filter.bounds(aoi));

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


//--------------------------------------------------------------------------------------
// Generar puntos de entrenamiento desde los polígonos de muestra
var generatedPoints = generateAditionalPoints(samplesPolygons, classValues, classPoints);
// Unir los puntos generados con los puntos externos
var allPoints = generatedPoints; //COMENTAR SI ES QUE NO SE TIENEN PUNTOS COMPLEMENTARIOS

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

var aditionalSamplesPoints = randomized;

//----------------------------------------------------------------------------------------

// visualize points using mapbiomas color palette
var samplesPointsVis = aditionalSamplesPoints.map(
    function (feature) {
        return feature.set('style', {
            'color': ee.List(mapbiomasPalette).get(feature.get('class')),
            'width': 1,
        });
    }
);
//


var classifiedList = [];
years.forEach(
    function (year) {
        var mosaicYear = mosaics
            .filter(ee.Filter.eq('year', year))
            .filter(ee.Filter.bounds(aoi))
            .mosaic();
        mosaicYear = mosaicYear
          .select(featureSpace) //Puedo seleccionar solo algunas bandas si quiero
          .clip(aoi); 

        var trainedSamples = ee.FeatureCollection(
            assetSamples + '/samples-stable-'  + year.toString() + '-' + ecoregionId.toString()+ '-'+ version_samples);

        // shuffle the points
        var shuffledSamples = shuffle(trainedSamples, 2);

        var weightedSamples = classWeights.map(
            function (classWeight) {
                var classId = classWeight[0];
                var weight = classWeight[1];

                var nSamples = Math.max(Math.round(nSamplesAllowed.max * weight), nSamplesAllowed.min);

                return shuffledSamples.filter(ee.Filter.eq('class', classId))
                    .limit(nSamples);  //limito el número maximo de muestras de acuerdo a la ponderación
            }
        );

        var weightedSamples = ee.FeatureCollection(weightedSamples).flatten();
        
      // Collect the spectral information to get the trained samples
        var additionalTrainedSamples = mosaicYear.reduceRegions({
            'collection': aditionalSamplesPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
        });
        

          additionalTrainedSamples = additionalTrainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        weightedSamples = weightedSamples.map(function(f) {
          return f.set('class', ee.Number(f.get('class')).toFloat());
        });
        additionalTrainedSamples = additionalTrainedSamples.map(function(f) {
          return f.set('class', ee.Number(f.get('class')).toFloat());
        });


        // merge stable and additional training samples
        var allTrainedSamples = weightedSamples
          .merge(additionalTrainedSamples)
          .merge(externalPoints);
          
        // Agrega una columna con números aleatorios entre 0 y 1
        var allSamplesRandom = allTrainedSamples.randomColumn('random');
        print(allSamplesRandom.limit(100));

        // Separa 80% para entrenamiento
        var trainingSamples = allSamplesRandom.filter(ee.Filter.lt('random', 0.8))
                                .map(function (feature) {
                                  return feature.set('sample_type', 'training');
                                        });

        // Separa 20% para validación
        var validationSamples = allSamplesRandom.filter(ee.Filter.gte('random', 0.8))
                                .map(function (feature) {
                                    return feature.set('sample_type', 'validation');
                                        });

         var allSamples = trainingSamples.merge(validationSamples);
          
        var numberOfClassRemaining = ee.Number(allSamples.aggregate_count_distinct('class'));
        
        print('Trained Samples:'+ year.toString(), trainingSamples.aggregate_histogram('class'));
        //print('Validation Samples:'+ year.toString(), validationSamples.aggregate_histogram('class'));
    
        //-----------------------------------------------------------------------------
        //Clasificador
        var classifier = ee.Classifier.smileRandomForest(rfParams)
            .train(trainingSamples, //podemos modificar por training point y dejar validation points aparte
            'class', 
            featureSpace  // es necesario definir el feature space
            ); 

        var classified = ee.Algorithms.If(
            allTrainedSamples.size().gt(0),
            ee.Algorithms.If(
                numberOfClassRemaining.gt(1),
                mosaicYear.classify(classifier),
                ee.Image(0)
            ),
            ee.Image(0)
        );

        classified = ee.Image(classified)
                      .clip(selectedRegionSimplified)
                       .rename('classification')
                         .set('year', year);

        classifiedList.push(classified);
        //---------------------------------------------------------------------------------
        // Obtener importancia relativa de las variables
        var explanation = classifier.explain();
        var importances = ee.Dictionary(explanation.get('importance'));
        //print('Coeficiente de Ginni:',importances);
        
        //Chart coeficiente de Ginni por año
       /* var keys = importances.keys().sort(importances.values()).reverse()
        var values = importances.values(keys);
        var rows = keys.zip(values).map(function(list) {
          return {c: ee.List(list).map(function(n) { return {v: n}; })}
        })
        var dataTable = {
          cols: [{id: 'band', label: 'Band', type: 'string'},
                 {id: 'importance', label: 'Importance', type: 'number'}],
          rows: rows
        };
       ee.Dictionary(dataTable).evaluate(function(result) {
          var chart = ui.Chart(result)
            .setChartType('ColumnChart')
            .setOptions({
              title: 'Importancia variables en RF',
              legend: {position: 'none'},
              hAxis: {title: 'Variable'},
              vAxis: {title: 'Índice de GINI'}
            });
          //print('Importancia variables - ' + year.toString(), chart);
        })*/
        //------------------------------------------------------------------------------
        // Validación interna 
        var validated = validationSamples.classify(classifier);

        // Generar matriz de confusión
        var confusionMatrix = validated.errorMatrix('class', 'classification');

        print('Matriz de confusión ' + year.toString(), confusionMatrix);
        //print('Consumers Accuracy ' + year.toString(), confusionMatrix.consumersAccuracy());
        //print('Producers Accuracy ' + year.toString(), confusionMatrix.producersAccuracy());
        //print('Matriz de confusión ' + year.toString(), confusionMatrix.accuracy());
       // print('Kappa ' + year.toString(), confusionMatrix.kappa());

//-----------------------------------------------------------------------------------------------------------
// Visualizar
      var classEX = getClassifiedImage(assetEX, year);
      var classE2 = getClassifiedImage(assetE2, year);
      var classE3 = getClassifiedImage(assetE3, year);
      var classE4 = getClassifiedImage(assetE4, year);
      var class01_img = ee.Image(class01).select('classification_2022');
     
      //print(class01_img)
     
     //Otras Clasificaciones
      Map.addLayer(classE4, visClass, year + '-class-E4', false);
      Map.addLayer(classE2, visClass, year + '-class-E2', false);
      Map.addLayer(classE3, visClass, year + '-class-E3', false);
      Map.addLayer(classEX, visClass, year + '-class-preliminar-'+ecoregionId.toString(), false);
      Map.addLayer(class01_img, visClass, 'Colección 01 2022', false);

      // Mosaico anual y classificación
      Map.addLayer(mosaicYear, visMos, year + '-Mosaico', false);
      Map.addLayer(classified, visClass, year + '-class-beta-'+ecoregionId.toString(), false);

    // visualize points using mapbiomas color palette
        var samplesPointsVis = weightedSamples.map(
            function (feature) {
                return feature.set('style', {
                    'color': ee.List(mapbiomasPalette).get(feature.get('class')),
                    'width': 1,
                });
            }
        );
   //puntos    
    Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'weighted samples - ' + year.toString(), false);

 //--------------------------------------------------------------------------------------------------  
 // Exportación
 //---------------------------------------------------------------------------------------------------
        // Export points to asset
        var pointsName = 'samples-points-beta-' + ecoregionId.toString()+'-' + year.toString() + '-aditional-' + version_output;

        Export.table.toAsset({
            "collection": allSamples,
            "description": pointsName,
            "assetId": assetSamples + '/' + pointsName
        });
     
        // Nombre de la capa clasificada
var classifiedImage = ee.Image(classified).set({
    'year': year,
    'territory': 'CHILE',
    'version': version_output,
    'ecoregion_id': ecoregionId
});

// Exportar imagen clasificada como una imagen separada por año
Export.image.toAsset({
    image: classifiedImage,
    description: 'classification-beta-' + ecoregionId + '-' + year + '-v' + version_output,
    assetId: assetClass + '/classification-beta-' + ecoregionId + '-' + year + '-v' + version_output,
    region: selectedRegionSimplified,
    scale: 30,
    maxPixels: 1e13,
    pyramidingPolicy: {'.default': 'mode'}
});
    }
);

var classifiedCollection = ee.ImageCollection(classifiedList); 
//Map.addLayer(classifiedCollection.select('classification'), visClass, 'Serie clasificación (Inspector)');

Map.addLayer(selectedRegion, {}, 'Ecoregión', false);
Map.addLayer(salares, {color:'#ff33f6'}, 'Inventario de Salares', false);
Map.addLayer(humedales, {color:'#3352ff'}, 'humedales', false);

//----------------------------------------------------------------------------------
