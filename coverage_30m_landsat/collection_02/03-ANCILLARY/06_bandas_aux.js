//Script para llenar vaciós en la clasificación y crear variables auxiliares para aplicar filtro espacial.

var ecorregionId = 'E1'; //define la ecorregión de trabajo
var version = {         
    'output': '1',  //define la versión de salida de la clasificación 
}; 

//--------------------------------------------------------------------------------------------------------------
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
  bands: 'classification_2022',
  min:0,
  max:80,
  palette:mapbiomasPalette,
  format:'png'
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
//---------------------------------------------------------------------------------------------------------------------------------

//Defino los assets
var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2'; // el mosaico
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString();


//La ecorregión de trabajo
var regions = ee.FeatureCollection(assetRegions);
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = regions.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

//Mosaico para visualizar
var mosaics = ee.ImageCollection(assetMosaics);
var mosaic2 = mosaics
            .filter(ee.Filter.bounds(selectedRegionSimplified))
            .mosaic()
            .clip(selectedRegionSimplified);

//Subregiones
var EC = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E1'+ecorregionId.toString());
/*var E7 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E7').filter(ee.Filter.eq('version', 3));
*/ // ejemplo de filtro de versión

// ====== 2) Construir imagen multibanda (classification_YYYY) ======
var years = ee.List.sequence(1997, 2025); // defino años para la función 
var allMerged = EC; 

var img = ee.Image(
  years.iterate(function(y, acc) {
    y = ee.Number(y);
    acc = ee.Image(acc);

    // Filtra todas las imágenes del año y mosaico
    var perYear = allMerged.filter(ee.Filter.eq('year', y));
    var mosaic = perYear.mosaic();

    // Nombre de salida
    var bandName = ee.String('classification_').cat(y.format('%d'));

    // Selección robusta de banda:
    // 1) Si existe 'classification', úsala.
    // 2) Si existe 'classification_YYYY', úsala.
    // 3) Si no, toma la primera banda como fallback.
    var out = ee.Image(
      ee.Algorithms.If(
        mosaic.bandNames().contains('classification'),
        mosaic.select('classification').rename(bandName),
        ee.Algorithms.If(
          mosaic.bandNames().contains(bandName),
          mosaic.select(bandName),
          mosaic.select([0]).rename(bandName)
        )
      )
    ).toUint8(); // clasificaciones discretas => 0..255

    return acc.addBands(out);
  }, ee.Image([]))
);

print(img, 'img multibanda Ecorregión');

//Clasifiaciones Colección 01            
var col01 = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE_COL1_2v5').clip(selectedRegionSimplified);
print(col01, 'Colección 01');    

//Agrego los límites de la Integración con un poligono para cada segmento del mapa
var img = img//.clip(limite);
var col01  = col01// .clip(limite);

//DESPLEGAR EN EL MAPA
Map.addLayer(col01, visClass, 'Colleción 01', false);
Map.addLayer(img, visClass, 'img multibanda Ecorregión', false);
Map.addLayer(mosaic2, visMos, 'mosaico', false );
Map.addLayer(regions, {color: 'blue'}, 'Regions V5', false);

var visualizar = ee.ImageCollection.fromImages([img]);

visualizar = visualizar.mosaic();

Map.addLayer(visualizar, visClass, 'Col 02 Ecorregion', false);
print('integracion',visualizar);

//-----------------------------------------------------------------------------------------------------------
//Crea función para convertir el valor de pixel n de i-> j
var anos = ['1997','1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022','2023','2024','2025'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 

//En estas linea podemos convertir valores de los pixeles 
  var integracion_ano = visualizar.select('classification_'+ano)
             .remap([59,60,66,67,61,79,80,11,12,18,15,23,25,27,29,33,34,63,73,71],
                    [59,60,66,67,61, 9, 9,11,12,18,15,23,25,27,29,33,34,63,73,71]).rename('classification_'+ano);

  var integracion_out  = integracion_ano;//.blend(renova_SR2_ano).blend(renova_z3_ano)

  if (i_ano == 0){ var class_outTotal = integracion_out }  
  else {class_outTotal = class_outTotal.addBands(integracion_out); }
}

//-----------------------------------------------------------------------------------------------------------
// Aplicando fución de relleno de GAPS

var image = class_outTotal;
var years = [
    1997,
    1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006,
    2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 
    2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 
    2025
    ];

/**
 * User defined functions
 */
var applyGapFill = function (image) {
   
    // apply the gap fill form t0 until tn
    var imageFilledt0tn = bandNames.slice(1)
        .iterate(
            function (bandName, previousImage) {
                var currentImage = image.select(ee.String(bandName));
                previousImage = ee.Image(previousImage);
                currentImage = currentImage.unmask(
                    previousImage.select([0]));
                return currentImage.addBands(previousImage);
            }, ee.Image(imageAllBands.select([bandNames.get(0)]))
        );
    imageFilledt0tn = ee.Image(imageFilledt0tn);

    // apply the gap fill form tn until t0
    var bandNamesReversed = bandNames.reverse();
    var imageFilledtnt0 = bandNamesReversed.slice(1)
        .iterate(
            function (bandName, previousImage) {
                var currentImage = imageFilledt0tn.select(ee.String(bandName));
                previousImage = ee.Image(previousImage);
                currentImage = currentImage.unmask(
                    previousImage.select(previousImage.bandNames().length().subtract(1)));
                return previousImage.addBands(currentImage);
            }, ee.Image(imageFilledt0tn.select([bandNamesReversed.get(0)]))
        );


    imageFilledtnt0 = ee.Image(imageFilledtnt0).select(bandNames);
    return imageFilledtnt0;
};


// get band names list 
var bandNames = ee.List(
    years.map(
        function (year) {
            return 'classification_' + String(year);
        }
    )
);

// generate a histogram dictionary of [bandNames, image.bandNames()]
var bandsOccurrence = ee.Dictionary(
    bandNames.cat(image.bandNames()).reduce(ee.Reducer.frequencyHistogram())
);

print(bandsOccurrence, 'bands Ocurrence');

// insert a masked band 
var bandsDictionary = bandsOccurrence.map(
    function (key, value) {
        return ee.Image(
            ee.Algorithms.If(
                ee.Number(value).eq(2),
                image.select([key]).byte(),
                ee.Image().rename([key]).byte().updateMask(image.select(0))
            )
        );
    }
);

// convert dictionary to image
var imageAllBands = ee.Image(
    bandNames.iterate(
        function (band, image) {
            return ee.Image(image).addBands(bandsDictionary.get(ee.String(band)));
        },
        ee.Image().select()
    )
);
//-------------------------------------------------------------------------------------------------------
//Función para generar bandas auxiliares con píxeles conectados

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);
// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);
// add connected pixels bands
var imageConnected = class_outTotal.addBands( //cambiar class_outTotal por imageFilledtnt0 para aplicar filtro de gaps 
    image
        .connectedPixelCount(100, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);


//--------------------------------------------------------------------------------------------------------
//Revisión de resultados
print(imageConnected, 'Imagen con píxeles conectados');
Map.addLayer(imageConnected, visClass, 'Imagen con píxeles conectados', true);
Map.addLayer(imageFilledtnt0, visClass, 'Classificación sin Gaps', true);
//--------------------------------------------------------------------------------------------------------
//Proceso de exportación

//Asigno directorio de salida
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso-'+ecorregionId.toString(); 

//Exporto
Export.image.toAsset({
    "image": imageConnected,
    "description": 'multiband-fill-conected-'+ecorregionId.toString()+'-' + version.output,
    "assetId": assetClass + '/multiband-fill-conected-'+ecorregionId.toString()+'-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": selectedRegionSimplified
}); 
