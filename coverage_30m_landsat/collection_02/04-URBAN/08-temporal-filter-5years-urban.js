//--------------------------------------------------------------------------------------------------------
//script para aplicación de filtro temporal de 5 años
//este script debe aplicarse a nivel de ecorregión o  ecorregionxregion

Map.setOptions("HYBRID");
//-------------------------------
//-----------------------------------------------------------------------------------------------------------------------
//Parámetros a ajustar

var version = {         
    'output': '1',
    'input': '1',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E2';
var ecorregionxregionId =2;

//Codigos de las clases que serán revisados
var fromClass = [68,24];
var toClass =   [68,24];

//año de visualziación 
var year = 2024;
//---------------------------------------------------------------------------------------------------------------------

var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString()+'-region'; //Zonas
                   
var regiones = ee.FeatureCollection(assetRegions);

var region = regiones.filter(ee.Filter.eq('id', ecorregionxregionId));


var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});


var selectedRegion = regionbuff.reduceToImage({
  properties: ['id'],            // atributo para convertir en raster
  reducer: ee.Reducer.first()       // cómo resolver solapes (first, mode, max, etc.)
}).rename('territory_id');                  // nuevo nombre de la propiedad

//Carga la clasificación de entrada sobre la que se aplicará el filtro 

var Filter_4years = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/urban-temporal-filter-4-'
                                    +ecorregionId.toString() 
                                    + '-'+ecorregionxregionId.toString() 
                                    +'-'+version.input.toString());

var LCLU = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/chile-integracion-temporal-5y-2')
                              //.updateMask(selectedRegion); //filtro por el área de interés
                              //.clip(regionbuff);

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
print('imagen con filtro de 4 años_', Filter_4years);

//--------------------------------------------------------------------------------------------------------------------------------------------------
// Este filtro se aplica en 3 grupos de años. Defino los parámetros para el primer grupo

//corrige antrópico 
var anos = [
   2023, 2020,2017,2014,
   2011,2008,2005,2002
            ];

var window5years = function(imagem, classe){
   var class_final = imagem.select('classification_2025') 
   class_final = class_final.addBands(imagem.select('classification_2024')) 
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap(fromClass,toClass).updateMask(mask_3) //Defino a que clases aplciaré el filtro
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final = class_final.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final = class_final.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final = class_final.addBands(class_corr3)
   }
   class_final = class_final.addBands(imagem.select('classification_1999'))
   class_final = class_final.addBands(imagem.select('classification_1998'))
  
   return class_final
}

var filtered = window5years(Filter_4years,  68)
filtered = window5years(filtered, 24)


//reviso que se aplique correctamente e incluya todos los años deseados 
print('Primera pasada',filtered)

//---------------------------------------------------------------------------------------------------------------------------------------------
////Defino parámetros para segundo grupo 
//corrige antrópico 
var anos = [
   2022, 2019,2016,2013,
   2010,2007,2004,2001,
            ];


var window5years = function(imagem, classe){
   var class_final2 = imagem.select('classification_2025')
   class_final2 = class_final2.addBands(imagem.select('classification_2024'))
   class_final2 = class_final2.addBands(imagem.select('classification_2023'))
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap(fromClass,toClass).updateMask(mask_3) //aplico solo a mis clases de interés
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final2 = class_final2.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final2 = class_final2.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final2 = class_final2.addBands(class_corr3)
   }
   class_final2 = class_final2.addBands(imagem.select('classification_1998'))
   return class_final2
}

filtered = window5years(filtered,  68)
filtered = window5years(filtered, 24)


print('Segunda Pasada',filtered)

//---------------------------------------------------------------------------------------------------------------------------------------------
////Defino parámetros para tercer grupo

//corrige antrópico 
var anos = [
    2024, 2021,2018,2015,2012,
   2009,2006,2003
            ];


var window5years = function(imagem, classe){
   var class_final3 = imagem.select('classification_2025')
   
   for (var i_ano=0;i_ano<anos.length; i_ano++){
     var ano = anos[i_ano];
     var class_ano = imagem.select('classification_'+ano)
     var mask_3 = imagem.select('classification_'+ (ano + 1)).neq(classe)
                .and(imagem.select('classification_'+ (ano)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 1)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 2)).eq(classe))
                .and(imagem.select('classification_'+ (ano - 3)).neq(classe))
     mask_3 = imagem.select('classification_'+ (ano - 3)).remap(fromClass,toClass).updateMask(mask_3)
     var class_corr = class_ano.blend(mask_3.rename('classification_'+ ano))
     class_final3 = class_final3.addBands(class_corr)
     var class_corr2 = imagem.select('classification_'+ (ano - 1)).blend(mask_3.rename('classification_'+ (ano - 1)))
     class_final3 = class_final3.addBands(class_corr2)
     var class_corr3 = imagem.select('classification_'+ (ano - 2)).blend(mask_3.rename('classification_'+ (ano - 2)))
     class_final3 = class_final3.addBands(class_corr3)
   }
   class_final3 = class_final3.addBands(imagem.select('classification_2000'))
   class_final3 = class_final3.addBands(imagem.select('classification_1999'))
   class_final3 = class_final3.addBands(imagem.select('classification_1998'))
   return class_final3
}

filtered = window5years(filtered,  68)
filtered = window5years(filtered, 24)


print('Tercera Pasada',filtered)


//--------------------------------------------------------------------------------------------------------------------
//Reuno los grupos 

var anos = ['1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022','2023','2024','2025'
            ];

for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var filtered_ano = filtered.select('classification_'+ano)
  if (i_ano == 0){ var class_outTotal = filtered_ano }  
  else {class_outTotal = class_outTotal.addBands(filtered_ano); }

}

print('Clasificación total:', class_outTotal);

//---------------------------------------------------------------------------------------------------------------------

/*
//Función para remapear
// A la variable Classificación total puedo aplciarle un remap si veo problemas persistentes mediante un poligono dibujado

var prueba = class_outTotal;
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

*/
// ===============================================
// REMAPEO DENTRO DE POLÍGONOS (FC del panel)
// ===============================================

// 0) Imagen base
var prueba = class_outTotal.toInt8();

// 1) Unir las colecciones definidas en el panel, y agregar en este paso
var fcList = [];
if (typeof urbanToOther !== 'undefined') fcList.push(urbanToOther);
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
remapped = remapped.toInt16();  // o .toUint8() si tus clases son 0–255

// Resultado final
prueba = remapped;



//--------------------------------------------------------------------------------------------------------------------
//Despliego en el mapa

//Visualizo
Map.addLayer(regiones, {}, 'regiones', false);
Map.addLayer(region, {color: 'red'}, 'region', false);

Map.addLayer(LCLU, visClass, 'LCLU', false);
Map.addLayer(Filter_4years, visClass, 'Filter_4years', false);
Map.addLayer(class_outTotal, visClass, 'filtered_ 5years', false);
Map.addLayer(prueba, visClass, 'filtered_ 5years_remap', true);


var imgSinCeros = prueba.updateMask(prueba.neq(68));  // píxeles == 0 quedan transparentes
Map.addLayer(imgSinCeros, visClass, 'solo infraestructura', false);


//-----------------------------------------------------------------------------------------------------------------------------
 //Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/'; // output classifciación 

Export.image.toAsset({
    "image": prueba,
    "description": 'urban-temporal-filter-5-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + 'urban-temporal-filter-5-' +ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});
