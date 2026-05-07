//------------------------------------------------------------------------------------------------------------------------------------------------
//script para aplicación de filtro temporal de 3 años
//este script debe aplicarse a nivel de ecorregión o  ecorregionxregion
// o en pronvincias de acuerdo al criterio del classificador

Map.setOptions("HYBRID");
//-----------------------------------------------------------------------------------------------------------------------
//Parámetros a ajustar

var version = {         
    'output': '1',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E6S5';
var ecorregionxregionId =1;

//Codigos de las clases que serán revisados
var fromClass = [11,15,18,61,63,66,23,25,33,34,29,3,9];
var toClass =   [11,15,18,61,63,66,23,25,33,34,29,3,9];

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

var visClass = {
    'min': 0,
    'max': 80,
    'palette': mapbiomasPalette
};



//---------------------------------------------------------------------------------------------------------------------------------------------------                    
// Parámetros para aplicación del filtro temporal de 3 años

var anos = [ //Define los años en lo que se aplicará la corrección temporal
   2024,2023,2022, 2021, 2020,2019,2018,2017,2016,2015,2014,2013,
   2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,
   2000,1999
            ];
            //no se considera ni el primer ni el último año

//Construye la función que irá interando en la varianle "anos"
var window3years = function(imagem, classe){
   var class_final = imagem.select('classification_2025');  //2022 es el año o y finaliza en el año 1998 
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano);
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).neq(classe));
     mask_3 = imagem.select('classification_'+ (ano - 1)).updateMask(mask_3).remap(fromClass,toClass);
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ (ano)));
     class_final = class_final.addBands(class_corr);
   }
   class_final = class_final.addBands(imagem.select('classification_1998'));
   return class_final;
};


//Prioridad de la aplicación del filtro temporal por clase
//Ordene los códigos desde el más problemático al más estable


var filtered = window3years(spatialFilter, 34); //matorral
filtered = window3years(filtered, 33); //agua
filtered = window3years(filtered, 29); //roca
filtered = window3years(filtered, 3); // bosque
filtered = window3years(filtered, 11); //humedal
filtered = window3years(filtered, 18); //agricultura
filtered = window3years(filtered, 63); //Estepa 
filtered = window3years(filtered, 66);// Matorral
filtered = window3years(filtered, 23); //arena
filtered = window3years(filtered, 25); //suelo
filtered = window3years(filtered, 61); //salar



//--------------------------------------------------------------------------------------------------------------------
//Aplicar remap sobre la clasificación con filtro temporal 

var anos = ['1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022', '2023', '2024', '2025'];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var filtered_ano = filtered.select('classification_'+ano)
  if (i_ano == 0){ var class_outTotal = filtered_ano }  
  else {class_outTotal = class_outTotal.addBands(filtered_ano); }

}

var prueba = class_outTotal
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


//-----------------------------------------------------------------------------------------------------------------------------
//Visualización 

Map.addLayer(spatialFilter, {}, 'Classificación de entrada', false);
Map.addLayer(class_outTotal, {}, 'Filtro Temporal de 3 ', false);
Map.addLayer(prueba,{},'filtro y remap',false);

Map.addLayer(spatialFilter.select('classification_2024'), visClass, 'spatialFilter 2019', true);
Map.addLayer(class_outTotal.select('classification_2024'), visClass, 'temporalFilter 2019', true);
Map.addLayer(prueba.select("classification_2024"),visClass,"Filtro temporal y remap  2019",true);

//-----------------------------------------------------------------------------------------------------------------------------
 //Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso';

Export.image.toAsset({
    "image": prueba,
    "description": 'temporal-filter-3-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + '/temporal-filter-3-' +ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});
