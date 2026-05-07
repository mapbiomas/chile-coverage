//------------------------------------------------------------------------------------------------------------------------------------------------
//script para aplicación de filtro temporal de 3 años
//este script debe aplicarse a nivel de ecorregión o  ecorregionxregion
// o  en pronvincias de acuerdo al criterio del classificador


Map.setOptions("HYBRID");
//-----------------------------------------------------------------------------------------------------------------------
//Parámetros a ajustar

var version = {         
    'output': '2',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E2';
var ecorregionxregionId =1;

//Codigos de las clases que serán revisados
var fromClass = [24, 68];
var toClass =   [24, 68];

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
var spatialFilter = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/classification-preliminar-infraestructure-'
                                                                            +ecorregionId.toString()+'-'+ecorregionxregionId.toString()+'-'+version.output)
                              .updateMask(selectedRegion); //filtro por el área de interés
                              //.clip(pol); // Opción #2 dibuja un poligono que abarque todas las áreas de la máscara 

//-------------------------------------------------------------------------------------------------------------
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


var filtered = window3years(spatialFilter, 24); //matorral
filtered = window3years(filtered, 68); //agua




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

/*
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

prueba = prueba.where(prueba.eq(imageFrom), imageTo);*/

//---------------------------------------------------------------------------------------------------------------------------------------------
// ===============================================
// REMAPEO DENTRO DE POLÍGONOS (FC del panel)
// ===============================================

// 0) Imagen base
var prueba = class_outTotal.toInt8();

// 1) Unir las colecciones definidas en el panel, y agregar en este paso
var fcList = [];
if (typeof InfraToOther !== 'undefined') fcList.push(InfraToOther);
if (typeof ptoX  !== 'undefined') fcList.push(ptoX);

var fcAll = ee.FeatureCollection([]);
fcList.forEach(function (fc) { fcAll = fcAll.merge(fc); });

// Asegurar props válidas y numéricas (from/to)
fcAll = fcAll
  .filter(ee.Filter.notNull(['from', 'to']))
  .map(function (f) {
    return f.set({
      from: ee.Number(f.get('from')),
      to:   ee.Number(f.get('to'))
    });
  });

// 2) Rasterizar reglas alineadas a la malla de 'prueba'
var proj    = prueba.projection();
var inside  = ee.Image().paint(fcAll, 1).selfMask().reproject(proj);
var fromImg = ee.Image().paint(fcAll, 'from').toInt16().reproject(proj);
var toImg   = ee.Image().paint(fcAll, 'to').toInt16().reproject(proj);

// 3) Máscara de cambio MULTIBANDA:
//    (a) píxel dentro de polígono, y (b) la banda actual == from
var changeMask = prueba.eq(fromImg).updateMask(inside);

// 4) Aplicar reemplazo a todas las bandas de una vez
var remapped = prueba.where(changeMask, toImg);

// 5) (opcional) castear tipo final
remapped = remapped.toUint8() //si tus clases son 0–255

// Resultado final
prueba = remapped;



//-----------------------------------------------------------------------------------------------------------------------------
//Visualización 

Map.addLayer(spatialFilter, {}, 'Classificación de entrada', false);
//Map.addLayer(class_outTotal, {}, 'Filtro Temporal de 3 ', false);
Map.addLayer(prueba,{},'filtro y remap',false);

Map.addLayer(spatialFilter.select('classification_2022'), visClass, 'spatialFilter 2022', true);
//Map.addLayer(class_outTotal.select('classification_2024'), visClass, 'temporalFilter 2019', true);
Map.addLayer(prueba.select("classification_2022"),visClass,"Filtro temporal y remap  2022",true);

//-----------------------------------------------------------------------------------------------------------------------------
 //Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/'; // output classifciación 

Export.image.toAsset({
    "image": prueba,
    "description": 'urban-temporal-filter-3-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + '/urban-temporal-filter-3-' +ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});
