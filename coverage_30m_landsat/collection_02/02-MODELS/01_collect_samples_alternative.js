// Este Script colecta la información espectral de las bandas en cada una de las muestras puntuales que se crean 
// aletoriamente dentro de los polígonos recopilados en la fase 1 (colecta de áreas de entrenamiento)

// Este script debe ser guardado con el código de la ecoregión '01-collect-samples-ec1'

var ecoregionId = 'E1'; // Define a ecoregion id
var aoiId = '1';
//Ecoregiones 
            //[E1,E2,E3,E4,E5,
            //E6S1,E6S2,E6S3,E6S4,E6S5,
            //E7,E8,E9]

var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecoregionId; //defino la ecoregión
var assetSamples = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/'+ecoregionId; //Directorio de salida para las muestras
var versionOutput = 1; // Versión de las muestras a guardar

var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2'; //Defino el mosaico a utilizar (Disponible entre 2013-2024)
var mosaics = ee.ImageCollection(assetMosaics); 

////si tengo puntos externos editar, para agregar más se debe agregar en líneas separadas por coma
var assetExternalPoints = [];
//
//// Función para cargar cada FeatureCollection
var colecciones = assetExternalPoints.map(function(asset) {
 var FC = ee.FeatureCollection(asset)
  return FC;
});
//
//// Une todas las colecciones en un solo FeatureCollection
var assetExternalPoints = ee.FeatureCollection(colecciones).flatten();

//Agrego el limite de la ecoregión y lo simplifico
var selectedRegion = ee.FeatureCollection(assetRegions); //la geometría es muy compleja para procesar
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = selectedRegion.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

// Convierto en raster los limites
var ecorregion = ee.Image().byte().paint({
  featureCollection: selectedRegionSimplified,
  color: 1
});
Map.addLayer(ecorregion, null, 'Ecorregión'+ecoregionId.toString(), false); //Visualizo la máscara

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Años del mosaico para considerar en la toma de muestras
var years = [ 
    1997, 1999, //1999, 2000, 2001,
    2002, 2003, //2004, 2005,
    //2006, 2007, 2008, 2009, 2010,
   // 2011, 2012, 2013, 2014, 2015, 2016, 
    2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
];

// En 'featureSpace' se puede modificar las bandas que se utilizan para entrenar el modelo y clasificar
//La lista completa de variables se encuentra en el protocolo de toma de muestras 
// Enlace: https://docs.google.com/document/d/12_jvbKhMwRdDGI7N_bWx0_iyv_4kUOZqeFqJ98zwhdE/edit?tab=t.0
var featureSpace = [
    'slope',
    'green_median_texture',
    'gcvi_median_wet',
    'gcvi_median',
    'gcvi_median_dry',
    "blue_median",
    "evi2_median",
    "green_median",
    "red_median",
    "nir_median",
    "swir1_median",
    "swir2_median",
    "gv_median",
    "gvs_median",
    "npv_median",
    "soil_median",
    "shade_median",
    "ndfi_median",
    "ndfi_median_wet",
    "ndvi_median",
    "ndvi_median_dry",
    "ndvi_median_wet",
    "ndwi_median",
    "ndwi_median_wet",
    "savi_median",
    "sefi_median",
    "ndfi_stdDev",
    "sefi_stdDev",
    "soil_stdDev",
    "npv_stdDev",
    "ndwi_amp"
];

//Número de puntos a generar en el total de las áreas de entrenamiento.

//Esto lo podemos discutir. 
var nTrainingPoints = 2000 ;  // Number of points to training


//Limitar los puntos externos
// Paso 1: Añadir una columna aleatoria
var randomizedExternalPoints = assetExternalPoints.randomColumn('random');
//// Paso 2: Limitar el número de puntos de forma aleatoria
var externalPoints = randomizedExternalPoints
  .sort('random')            // ordena por la columna aleatoria
  .limit(nTrainingPoints);   // selecciona n puntos aleatorios
print(externalPoints, 'Puntos complementarios'); //Revisar si tiene propiedad class 

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Parámetros de visalización de las capas
//Clasificación
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
mapbiomasPalette[80] = '000000';
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
//Si no corre la muestra, agregar la dirección manual 'proyect/mapbiomas' 

var region = typeof (userRegion) !== 'undefined' ? userRegion : 'aoi'+aoiId.toString();
var samplesList = [
    typeof (c59) !== 'undefined' ? c59 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c59_col2MB_'+ecoregionId), // Bosque Nativo Primario
  //  typeof (c60) !== 'undefined' ? c60 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c60_col2MB_'+ecoregionId), // Bosque Nativo Secundario
  //  typeof (c67) !== 'undefined' ? c67 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c67_col2MB_'+ecoregionId), // Bosque Achaparrado
    typeof (c66) !== 'undefined' ? c66 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c66_col2MB_'+ecoregionId), // Matorrales
    typeof (c11) !== 'undefined' ? c11 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c11_col2MB_'+ecoregionId), // humedales
  //  typeof (c79) !== 'undefined' ? c79 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c79_col2MB_'+ecoregionId), // Coniferas
  //  typeof (c80) !== 'undefined' ? c80 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c80_col2MB_'+ecoregionId), // Latifoliadas
  //  typeof (c23) !== 'undefined' ? c23 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c23_col2MB_'+ecoregionId), // Arenas, Playas y Dunas      
  //  typeof (c15) !== 'undefined' ? c15 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c15_col2MB_'+ecoregionId), // Praderas
    typeof (c18) !== 'undefined' ? c18 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c18_col2MB_'+ecoregionId), // Agricultura
  //  typeof (c12) !== 'undefined' ? c12 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c12_col2MB_'+ecoregionId), // Herbazales
    typeof (c63) !== 'undefined' ? c63 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c63_col2MB_'+ecoregionId), // Estepa 
  //  typeof (c21) !== 'undefined' ? c21 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c21_col2MB_'+ecoregionId), // Mosaico Agricultura Pastura
    typeof (c25) !== 'undefined' ? c25 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c25_col2MB_'+ecoregionId), // Otras Areas sin Vegetacion
    typeof (c34) !== 'undefined' ? c34 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c34_col2MB_'+ecoregionId), // Nieve y Hielo
    typeof (c29) !== 'undefined' ? c29 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c29_col2MB_'+ecoregionId), // Afloramiento Rocosos
    typeof (c24) !== 'undefined' ? c24 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c24_col2MB_'+ecoregionId), // Infraestructura Urbana
    typeof (c61) !== 'undefined' ? c61 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c61_col2MB_'+ecoregionId), // Salares
  //  typeof (c62) !== 'undefined' ? c62 : ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c62_col2MB_'+ecoregionId), // Salares cubiertos **
  //  typeof (c09) !== 'undefined' ? c09 : ee.FeatureCollection([]), // Silvicultura
  //  typeof (c03) !== 'undefined' ? c09 : ee.FeatureCollection([]), // Bosque 
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
    .filter(ee.Filter.bounds(aoi1));

// avoid geodesic operation error
samplesPolygons = samplesPolygons.map(
    function (polygon) {
        return polygon.buffer(1, 10);
    }
);

// Generar puntos de entrenamiento desde los polígonos de muestra
var generatedPoints = generatePoints(samplesPolygons, nTrainingPoints);
// Unir los puntos generados con los puntos externos
var allPoints = generatedPoints.merge(externalPoints); //COMENTAR SI ES QUE NO SE TIENEN PUNTOS COMPLEMENTARIOS

//print('TOTAL POINTS GENERATED', allPoints.aggregate_histogram('class'));

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
            //.filter(ee.Filter.bounds(aoi2))
            .mosaic()
            ;

        mosaicYear = mosaicYear
                      //.select(featureSpace)
                     // .clip(aoi1) 
                      .updateMask(ecorregion);
                      Map.addLayer(mosaicYear, visMos, year.toString()+'-mosaico', false); //y agregar el mosaico al mapa

        // Collect the spectral information to get the trained samples
        var trainedSamples = mosaicYear.reduceRegions({
            'collection': samplesPoints,
            'reducer': ee.Reducer.first(),
            'scale': 30,
            'maxPixelsPerRegion': 1e13
        });

        trainedSamples = trainedSamples.filter(ee.Filter.notNull(['green_median_texture']));

        // Export points to asset
        var pointsName = 'samples-points-' + ecoregionId +'-'+aoiId.toString() + '-' + year.toString() + '-' + versionOutput;

        Export.table.toAsset({
            "collection": trainedSamples,
            "description": pointsName,
            "assetId": assetSamples + '/' + pointsName
        });
    });

//Visualizamos algunas capas en el mapa
//Map.addLayer(selectedRegion, {color: 'red'}, 'region original' + ecoregionId+subecoregionId.toString(), true);
Map.addLayer(selectedRegionSimplified, {}, 'region simplificada' + ecoregionId, false);
Map.addLayer(samplesPointsVis.style({ 'styleProperty': 'style' }), {}, 'samples - points');

// Export polygons to asset
var polygonsName = 'samples-polygons-' + ecoregionId + '-' + versionOutput;

Export.table.toAsset({
    "collection": samplesPolygons,
    "description": polygonsName,
    "assetId": assetSamples + '/' + polygonsName
});
