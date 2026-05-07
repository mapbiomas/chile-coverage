//------------------------------------------------------------------------------------------------------------------------------------------------
//script para aplicación de filtro temporal de 4 años
//este script debe aplicarse a nivel de ecorregión o  ecorregionxregion


Map.setOptions("HYBRID");
//-----------------------------------------------------------------------------------------------------------------------
//Parámetros a ajustar

var version = {         
    'output': '1',
    'input': '1',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E1';
var ecorregionxregionId =1;

//Codigos de las clases que serán revisados
var fromClass = [12,11,15,18,61,63,66,23,25,33,34,29,3,9, 77, 71, 79, 80, 59, 60];
var toClass =   [12,11,15,18,61,63,66,23,25,33,34,29,3,9, 77, 71, 79, 80, 59, 60];

//año de visualziación 
var year = 2019;
//-------------------------------------------------------------------------------------------------------------------------

var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString()+'-region'; //Zonas
                   
var regiones = ee.FeatureCollection(assetRegions);

var region = regiones.filter(ee.Filter.eq('id', ecorregionxregionId));

//Visualizo
Map.addLayer(regiones, {}, 'regiones', false);
Map.addLayer(region, {color: 'red'}, 'region', false);


var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});


var selectedRegion = regionbuff.reduceToImage({
  properties: ['id'],            // atributo para convertir en raster
  reducer: ee.Reducer.first()       // cómo resolver solapes (first, mode, max, etc.)
}).rename('territory_id');                  // nuevo nombre de la propiedad

//Carga la clasificación de entrada sobre la que se aplicará el filtro 
var Filter_3years = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso/temporal-filter-3-'
                                                      +ecorregionId.toString()+'-'+ecorregionxregionId.toString()+'-'+version.input.toString());
var spatialFilter = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/spatial-Filter-1')
                              .updateMask(selectedRegion); //filtro por el área de interés

//-------------------------------------------------------------------------------------------------------------
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

var visClass = {     //parámetros de visualización
  bands: 'classification_'+year.toString(),
  min:0,
  max:80,
  palette:mapbiomasPalette,
  format:'png'
};

//---------------------------------------------------------------------------------------------------------------------------------------------------                    
// Parámetros para aplicación del filtro temporal de 3 años
//visualizo imagen de entrada 
//print(Filter_3years);

//---------------------------------------------------------------------------------------------------------------------------------------------------
//Defino parámetros para años pares
var anos = [
   2024,2022,2020,2018,2016,2014,
   2012,2010,2008,2006,2004,2002,
   2000,
            ];

var window4years = function(imagem, classe){
   var class_final = imagem.select('classification_2025')
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).updateMask(mask_3).remap(fromClass,toClass)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final = class_final.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final = class_final.addBands(class_corr2)
   }
    class_final = class_final.addBands(imagem.select('classification_1998'))
   return class_final
}

//Orden de prioridad (mas problematico al principio)
var filtered = window4years(Filter_3years, 9); 
filtered = window4years(filtered, 3);
filtered = window4years(filtered, 66);
filtered = window4years(filtered, 23); 
filtered = window4years(filtered, 11);
filtered = window4years(filtered, 12);
filtered = window4years(filtered, 61); 
filtered = window4years(filtered, 29); 
filtered = window4years(filtered, 25);
filtered = window4years(filtered, 33); 
filtered = window4years(filtered, 34); 
filtered = window4years(filtered, 18);

//reviso que se aplique correctamente e incluya todos los años deseados 
print('pares',filtered);

//---------------------------------------------------------------------------------------------------------------------------------------------
////Defino parámetros para años impares

var anos = [
    2023, 2021,2019,2017,2015,2013,
   2011,2009,2007,2005,2003,2001
            ];

var window4years = function(imagem, classe){
    var class_final2 = imagem.select('classification_2025')
      class_final2 = class_final2.addBands(imagem.select('classification_2024'))
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 2)).updateMask(mask_3).remap(fromClass,toClass)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)))
     class_final2 = class_final2.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final2 = class_final2.addBands(class_corr2)
   }
   class_final2 = class_final2.addBands(imagem.select('classification_1999'))
   class_final2 = class_final2.addBands(imagem.select('classification_1998'))
   return class_final2
}

filtered = window4years(filtered, 9); 
filtered = window4years(filtered, 3);
filtered = window4years(filtered, 18);
filtered = window4years(filtered, 23); 
filtered = window4years(filtered, 11);
filtered = window4years(filtered, 12);
filtered = window4years(filtered, 66);
filtered = window4years(filtered, 34); 
filtered = window4years(filtered, 61); 
filtered = window4years(filtered, 29); 
filtered = window4years(filtered, 33); 
filtered = window4years(filtered, 25);


print('impares',filtered);

//--------------------------------------------------------------------------------------------------------------------
//Junto años pares e impares
var anos = ['1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022','2023','2024', '2025'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var filtered_ano = filtered.select('classification_'+ano)
  if (i_ano == 0){ var class_outTotal = filtered_ano }  
  else {class_outTotal = class_outTotal.addBands(filtered_ano); }

}

//Visualizo 
print('filtered', class_outTotal);

//---------------------------------------------------------------------------------------------------------------------
//remap

var prueba = class_outTotal ;
var drawinfTools = Map.drawingTools();

var geometryList = drawinfTools.layers().map(
    function (obj) {

        var eeObject = obj.getEeObject();

        return ee.Algorithms.If(
            ee.String(ee.Algorithms.ObjectType(eeObject)).equals('FeatureCollection'),
            eeObject,
            ee.FeatureCollection(eeObject)
        );

    }
);

var featCollection = ee.FeatureCollection(geometryList);

// flatten collection of collections into a single collection and
// removes non-standard data
featCollection = featCollection.flatten()
    .filter(ee.Filter.neq('from', null))
    .filter(ee.Filter.neq('to', null));

print(featCollection);

var imageFrom = ee.Image().paint(featCollection, 'from');
var imageTo = ee.Image().paint(featCollection, 'to');

prueba = prueba.where(prueba.eq(imageFrom), imageTo);

//Visualizo 
print(prueba, 'remap');

//--------------------------------------------------------------------------------------------------------------------
//Despliego en el mapa

Map.addLayer(spatialFilter, visClass, 'spatialFilter', true);
Map.addLayer(Filter_3years, visClass, 'Filter_3years', true);
Map.addLayer(class_outTotal, visClass, 'filtered_ 4years', true);
Map.addLayer(prueba, visClass, 'filtered_ 4years_remap', true);

//-----------------------------------------------------------------------------------------------------------------------------
 //Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso';

Export.image.toAsset({
    "image": prueba,
    "description": 'temporal-filter-4-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + '/temporal-filter-4-' +ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});
