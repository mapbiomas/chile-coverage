//Script para integración y exportación de la classificación para todo Chile. 
//Permite aplicar filtro de gaps y adición de bandas auxiliares para filtro espacial. 
//Permite unir regiones por proioridad, superponer clases, y reclasificar códigos
// de acuerdo a diferentes límites grográficos que el usuario decide


//--------------------------------------------------------------------------------------------
//Parametros generales
var version = {         // versión de la salida
    'output': '1',
};

//-------------------------------------------------------------------------------------------
//parámetros de visualziación
var palettes =
require('users/mapbiomas/modules:Palettes.js');
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
mapbiomasPalette[77] = 'E727F5';
mapbiomasPalette[78] = '000000';
mapbiomasPalette[79] = '69601e';  //Coniferas
mapbiomasPalette[80] = '7a6c00';   //Latifoliadas

var visClass = {
  bands: 'classification_'+year.toString(),
  min:0,
  max:80,
  palette:mapbiomasPalette,
  format:'png'
};


var visClassLC = {
  bands: 'remapped',
  min:0,
  max:67,
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

//Assets 

//var assetRegions = 'projects/mapbiomas-chile/assets/ANCILLARY_DATA/classification-regionsV5';
//var assetProvincias = 'projects/mapbiomas-chile/assets/ANCILLARY_DATA/DPA_Prov_Chile_simpl_OGC84';
//var regions = ee.FeatureCollection(assetRegions);
//var provincias = ee.FeatureCollection(assetProvincias);
//var selectedRegion = regions.filter(ee.Filter.eq('region_id', regionId));

var year = 2022;
var assetMosaics = 'projects/mapbiomas-chile/assets/MOSAICS/mosaico-c2';

var mosaics = ee.ImageCollection(assetMosaics);
var mosaic2 = mosaics
            .filter(ee.Filter.eq('year', year))
            //.filter(ee.Filter.bounds(selectedRegions))
            .mosaic();
            //.clip(selectedsubRegions);
            
            
//mascara de altitud  para clases 63 y 12
//límites geográficos
var chile = ee.Image('projects/mapbiomas-chile/assets/ANCILLARY_DATA/STATISTICS/COLLECTION1/VERSION-1/nivel-politico-1-raster');
var DPA2 = ee.Image('projects/mapbiomas-chile/assets/ANCILLARY_DATA/STATISTICS/COLLECTION1/VERSION-1/nivel-politico-2-raster');

//dem
var dem = ee.Image('USGS/SRTMGL1_003') ;
var aysen = DPA2.eq(11).selfMask();
var magallanes = DPA2.eq(9).selfMask();
var dem_magallanes = dem.updateMask(magallanes);
var dem_aysen = dem.updateMask(aysen);

//máscara norte
var mask_gte3200 = dem.updateMask(chile).gte(3200).selfMask(); // selfMask deja sólo los píxeles > 3200
var mask_lt3200 = dem.updateMask(chile).lt(3200).selfMask(); // selfMask deja sólo los píxeles > 3200

//máscara magallanes
var mask_0_200  = dem_magallanes.gte(0).and(dem_magallanes.lte(200)).selfMask();
var mask_mayor200 = dem_magallanes.gt(200).selfMask();

//máscara aysen
var mask_300_900  = dem_aysen.gte(300).and(dem_aysen.lte(900)).selfMask();
var mask_l

//Visualizo
//Map.addLayer(dem, {min:0, max:6000, palette:['#0000ff','#00ffff','#00ff00','#ffff00','#ff0000']}, 'DEM (SRTM 30 m)', false);
//Map.addLayer(DPA2, {min:2, max:17, palette:['#0000ff','#00ffff','#00ff00','#ffff00','#ff0000']}, 'Regiones', false);
//Map.addLayer(aysen, {min:2, max:17, palette:['#800080']}, 'aysen', true);
//Map.addLayer(mask_gte3200, {palette:['#800080']}, 'Máscara > 3200 m', false);  // morado
//Map.addLayer(mask_0_200, {palette:['#00ff00']}, 'mask_0_200', true);  // morado
//Map.addLayer(mask_mayor200, {palette:['#800080']}, 'Máscara > 200 m', true);  // morado

//---------------------------------------------------------------------------------------------
//Classificaciónes ee.ImageCollection()

var E1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E1');
var E2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E2');
var E3 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E3');
var E4 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E4');
var E5S1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E5S1');
var E5S2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E5S2');
var E6S1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E6S1');
var E6S2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S2');
var E6S3_1 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S3_1');
var E6S3_2 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S3_2');
var E6S4 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S4_2');
var E6S5 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S5_2');
var E7 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E7').filter(ee.Filter.eq('version', 5));
var E8 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E8').filter(ee.Filter.eq('version', 4));
var E9 = ee.ImageCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-beta-E9').filter(ee.Filter.eq('version', 1));

//Reviso
/*print('E1',E1);
print('E2',E2);
print('E3',E3);
print('E4',E4);
print('E6S2', E6S2);*/


//convierto en ee.Image()
function toMultiBandClassification(col, years) {
  return ee.Image(
    years.iterate(function(y, acc) {
      y   = ee.Number(y);
      acc = ee.Image(acc);
      var perYear = col.filter(ee.Filter.eq('year', y)).mosaic();
      var bname   = ee.String('classification_').cat(y.format('%d'));
      var out = ee.Image(
        ee.Algorithms.If(
          perYear.bandNames().contains('classification'),
          perYear.select('classification').rename(bname),
          ee.Algorithms.If(
            perYear.bandNames().contains(bname),
            perYear.select(bname),
            perYear.select([0]).rename(bname)
          )
        )
      ).toUint8();
      return acc.addBands(out);
    }, ee.Image([]))
  );
}

var years = ee.List.sequence(1998, 2025); // modificar de acuerdo a la diponibilidad de años de todos los años

var E1_img = toMultiBandClassification(E1, years);
var E2_img = toMultiBandClassification(E2, years);
var E3_img = toMultiBandClassification(E3, years);
var E4_img = toMultiBandClassification(E4, years);
var E5S1_img = toMultiBandClassification(E5S1, years);
var E5S2_img = toMultiBandClassification(E5S2, years);
var E6S1_img = toMultiBandClassification(E6S1, years);
var E6S2_img = toMultiBandClassification(E6S2, years);
var E6S3_1_img = toMultiBandClassification(E6S3_1, years);
var E6S3_2_img = toMultiBandClassification(E6S3_2, years);
var E6S4_img = toMultiBandClassification(E6S4, years);
var E6S5_img = toMultiBandClassification(E6S5, years);
var E7_img = toMultiBandClassification(E7, years);
var E8_img = toMultiBandClassification(E8, years);
var E9_img = toMultiBandClassification(E9, years);

//reviso x2
//print('E1_img',E1_img);
//print('E2_img',E2_img);
//print('E3_img',E3_img);
//print('E4_img',E4_img);
//print('E5S1_img',E5S1_img);
//print('E5S2_img',E5S2_img);
//print('E6S1_img',E6S1_img);
//print('E6S2_img',E6S2_img);
//print('E6S3_1_img',E6S3_1_img);
//print('E6S3_2_img',E6S3_2_img);
print('E6S4_img',E6S4_img);
print('E6S5_img',E6S5_img);
print('E7_img',E7_img);
print('E8_img',E8_img);
print('E9_img',E9_img);

//-------------------------------------------------------------------------------------------------
//Integración 
//var limite_z2_buf = limite_z2.buffer(15)
//E2_img = E2_img.clip(limite_z2.map(function(feat){return feat.buffer(30)}))
//var limite_z4_buf = limite_z4.buffer(15)
//E4 = E4.clip(limite_z4.map(function(feat){return feat.buffer(15)}))
//Map.addLayer(limite_z4_buf,{},'limite_z4_buf')

//Orden de las ecorregiones, la última es la que queda más arriba
var integracion = ee.ImageCollection.fromImages([E4_img, E1_img, E2_img,  E3_img,  E5S1_img,
                                                E6S1_img, E6S2_img, E6S3_1_img,  E6S4_img,  E6S3_2_img, 
                                                E5S2_img, E6S5_img, E7_img,  E9_img, E8_img, ])
                                                .mosaic();


print('integracion:', integracion);

Map.addLayer(mosaic2, visMos, 'mosaico',false);
Map.addLayer(E4_img, visClass, 'E4', false);
Map.addLayer(E1_img, visClass, 'E1', false);
Map.addLayer(E2_img, visClass, 'E2', false);
Map.addLayer(E3_img, visClass, 'E3', false);
Map.addLayer(E5S1_img, visClass, 'E5S1', false);
Map.addLayer(E5S2_img, visClass, 'E5S2', false);
Map.addLayer(E6S1_img, visClass, 'E6S1', false);
Map.addLayer(E6S2_img, visClass, 'E6S2', false);
Map.addLayer(E6S3_1_img, visClass, 'E6S3_1', false);
Map.addLayer(E6S3_2_img, visClass, 'E6S3_2', false);
Map.addLayer(E6S4_img, visClass, 'E6S4', false);
Map.addLayer(E6S5_img, visClass, 'E6S5', false);
Map.addLayer(E7_img, visClass, 'E7', false);
Map.addLayer(E8_img, visClass, 'E8', false);
Map.addLayer(E9_img, visClass, 'E9', false);


Map.addLayer(integracion, visClass, 'integracion 1', false);
print('integracion',integracion);

//Reglas de integración especiales
var anos = ['1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022','2023','2024', '2025'];

//Cambio los codigos y homogenizo si es necesario
for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
//cambiando el código de ciertas clases
  var integracion_ano = integracion.select('classification_'+ano)
             .remap([59,60,66,67,61,62,79,80,11,12,18,15,23,25,27,29,33,34,63,77,71],
                    [59,60,66,67,61,61, 9, 9,11,12,18,15,23,25,27,29,33,34,63,77, 9]).rename('classification_'+ano);

//Sobrepongo clases seleccioandas a la integración por ecorregion
  var secfor_E2_ano = E2_img.select('classification_'+ano).remap([60, 59],[3, 3])
      .rename('classification_'+ano);//
  var secfor_E1_ano = E1_img.select('classification_'+ano).remap([60, 59],[3, 3])
      .rename('classification_'+ano);//
  var secfor_E3_ano = E3_img.select('classification_'+ano).remap([60, 59],[3, 3])
      .rename('classification_'+ano);//
  var secfor_E5S1_ano = E5S1_img.select('classification_'+ano).remap([60, 59],[60, 59])
      .rename('classification_'+ano)
      //.clip(ee.FeatureCollection('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/E5S1'))
      ;
  var bareSoil_E1 = E1_img.select('classification_'+ano).remap([25],[25])
      .rename('classification_'+ano);//
  var iceSnow_E4 = E4_img.select('classification_'+ano).remap([34],[34])
      .rename('classification_'+ano).clip(limitSnowE4);//
  var grass_E6S5 = E6S5_img.select('classification_'+ano).remap([12],[12])
      .rename('classification_'+ano);//
 
//  Map.addLayer(matorales_z4, {}, 'matorales_z4', true);
// El problema es que se generan píxeles extraños luego del blend

  var integracion_out  = integracion_ano
                                .blend(secfor_E2_ano)
                                .blend(secfor_E1_ano)
                                .blend(secfor_E3_ano)
                                .blend(secfor_E5S1_ano)
                                .blend(bareSoil_E1)
                                .blend(iceSnow_E4)
                                .blend(grass_E6S5)
                                ;


// Remapeo sobre clases espécificas en todo el terriotiro usando máscara DEM
  var bOut = integracion_out.select('classification_' + ano);
  var herbToStep = bOut.where(mask_gte3200.and(bOut.eq(12)), 63)
                     .rename('classification_' + ano);
  var stepToherb = bOut.where(mask_lt3200.and(bOut.eq(63)), 12)
                     .rename('classification_' + ano);
  var herbToStep2 = bOut.where(mask_0_200.and(bOut.eq(12)), 63)
                     .rename('classification_' + ano);
  var stepToherb2 = bOut.where(mask_mayor200.and(bOut.eq(63)), 12)
                     .rename('classification_' + ano);
  var herbToStep3 = bOut.where(mask_300_900.and(bOut.eq(12)), 63)
                     .rename('classification_' + ano);
  var stepToherb3 = bOut.where(mask_lt300_gt900.and(bOut.eq(63)), 12)
                     .rename('classification_' + ano);


  var integracion_out2 = integracion_out
                     .blend(herbToStep)
                     .blend(stepToherb)
                     .blend(herbToStep2)
                     .blend(stepToherb2)
                     .blend(herbToStep3)
                     .blend(stepToherb3);


/*

  var herbToStep= integracion_out.select('classification_'+ano).remap([12],[63])
      .rename('classification_'+ano).updateMask(mask_gte3200);//
    var stepToherb= integracion_out.select('classification_'+ano).remap([63],[12])
      .rename('classification_'+ano).updateMask(mask_lt3200);//

  var integracion_out2 = integracion_out
                                  .blend(herbToStep)
                                  .blend(stepToherb);*/

// genero mi classificación class_outTotal 

  if (i_ano == 0){ var class_outTotal = integracion_out2 }  
  else {class_outTotal = class_outTotal.addBands(integracion_out2); }
}

print('Integracion con blend:',class_outTotal);
Map.addLayer(class_outTotal, visClass, 'Integracion con blend:', false);

//--------------------------------------------------------------------------------------
//Primer filtro 'Relleno de Gaps'
var image = class_outTotal;

var years = [
    1998, 1999, 2000, 2001, 2002, 2003, 2004, 
    2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024, 2025
    ];


//Función de relleno de GAPS 
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

print(bandsOccurrence);

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

// generate image pixel years
var imagePixelYear = ee.Image.constant(years)
    .updateMask(imageAllBands)
    .rename(bandNames);


// apply the gap fill
var imageFilledtnt0 = applyGapFill(imageAllBands);

//Map.addLayer(imageFilledtnt0, visClass, 'imageFilledtnt0', true);

//-------------------------------------------------------------------------------------------
// Segundo postproceso, agrego bandas auxiliares de píxeles conectados 

// add connected pixels bands
var imageFilledConnected = class_outTotal .addBands( // cambiar por imageFilledtnt0
    image
        .connectedPixelCount(100, true)
        .rename(bandNames.map(
            function (band) {
                return ee.String(band).cat('_conn');
            }
        ))
);

print('variable a exportar:', imageFilledConnected);

//---------------------------------------------------------------------------------------------
//Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/';


Export.image.toAsset({
    "image": imageFilledConnected,
    "description": 'chile-integracion-' + version.output,
    "assetId": assetClass + 'chile-integracion-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": geometry
}); 
