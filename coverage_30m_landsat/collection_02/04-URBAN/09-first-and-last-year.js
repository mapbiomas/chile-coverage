//Script para corregir primero y ultimo año.
//--------------------------------------------------------------------------------------------------------------------------------
Map.setOptions("HYBRID");

//---------------------------------------------------------------------------------------------------------------------------------
//Defino los parámetros

var version = {         
    'output': '1',
    'input': '1',
}; // Versión Filtro temporal

//id area de interés
var ecorregionId = 'E5';
var ecorregionxregionId =1;


//año de visualziación 
var year = 1998;


//años que considera la classificación des T de i -> n 
var anos = [1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,
            2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,
            2019,2020,2021,2022, 2023,2024];
            
//Defino la equivalencia entre la clase nivel 3 y la clase nivel 0 
var fromClass= [68,24]; // clases originales
var toClass=   [ 1,10];  // natural = 1 vs antrópico = 10



//Defino Ti y Ti+1
var year_first = '1998';
var year_first_plus1 = '1999'; 

//Defino los años Tn y Tn-1
var year_last = '2024';
var year_last_minus1 = '2023';

//---------------------------------------------------------------------------------------------------------------------------------
//Defino los assets 
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'+ecorregionId.toString()//+'-region'; //Zonas
                   
var regiones = ee.FeatureCollection(assetRegions);

var region = regiones//.filter(ee.Filter.eq('id', ecorregionxregionId));


var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});


var selectedRegion = regionbuff.reduceToImage({
  properties: ['id'],            // atributo para convertir en raster
  reducer: ee.Reducer.first()       // cómo resolver solapes (first, mode, max, etc.)
}).rename('territory_id');                  // nuevo nombre de la propiedad


//Carga la clasificación de entrada sobre la que se aplicará el filtro 
var Filter_5years = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/urban-temporal-filter-5-'
                                    +ecorregionId.toString() 
                                    + '-'+ecorregionxregionId.toString() 
                                    +'-'+version.input.toString());

//---------------------------------------------------------------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------------------------------------------------------
// Función para corrección de primer y último año
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var class_ano = Filter_5years.select('classification_'+ano); //
  var class_nivel0_ano = class_ano.remap(fromClass, toClass).rename('classification_'+ano); // remapeo a clases nivel 0

  if (i_ano == 0){ var class_nivel0 = class_nivel0_ano }  
  else {class_nivel0 = class_nivel0.addBands(class_nivel0_ano); }
}

//Define t y t-1
var nivel0_tn = class_nivel0.select('classification_'+year_last.toString());
var nivel0_tnmenos1 = class_nivel0.select('classification_'+year_last_minus1.toString());
//-------------------------------------------------------------------------------------------------------------------------
// Perdida de Clases Naturales en Tn
//En los píxeles dónde en tn la clase es antrópica (10) y en tn-1 la clase era natural 


var desmat = nivel0_tn.eq(10).and(nivel0_tnmenos1.eq(1));
//Cuenta los píxeles conectados (hor, ver, diag) en una vecindad de 20 x 20 pixeles.
var conectedDesmat = desmat.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
//identifica aquellos que tengan < o = a 11 piexeles conectados (1 ha)
var desmat1ha = conectedDesmat.lte(11);
//y sobrepone T-1 en las zonas identificadas. 
var ruido_desmat_tnmenos1 = Filter_5years
                                  .select('classification_'+year_last_minus1.toString())
                                  .updateMask(desmat1ha);

//--------------------------------------------------------------------------------------------------------------------------
//Recuperación de Clases Naturales en Tn 
//Actua sobre los píxeles dónde en tn la clase es natural (1) y en tn-1 la clase era antrópica


var regen = nivel0_tn.eq(1).and(nivel0_tnmenos1.eq(10));
var conectedRegen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedRegen.lte(11);
var ruido_regen_tnmenos1 = Filter_5years
                              .select('classification_'+year_last_minus1.toString())
                              .updateMask(regen1ha);

//--------------------------------------------------------------------------------------------------------------------------


var nivel0_1998 = class_nivel0.select('classification_1998')
var nivel0_1999 = class_nivel0.select('classification_1999')

// corrige desmatamentos pequenos no primeiro ano
var desmat = nivel0_1998.eq(1).and(nivel0_1999.eq(10))
var conectedDesmat = desmat.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(11)
var ruido_desmat98 = Filter_5years.select('classification_1999').updateMask(desmat1ha)


// corrige REGEN pequenos no primeiro ano
var regen = nivel0_1998.eq(10).and(nivel0_1999.eq(1))
var conectedregen = regen.selfMask().connectedPixelCount(25,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedregen.lte(11)
var ruido_regen98 = Filter_5years.select('classification_1999').updateMask(regen1ha)


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_5years.select('classification_'+ano)

  if (ano == 1998) {  var class_corr = class_ano.blend(ruido_desmat98).blend(ruido_regen98)}
  else if (ano == 2022) {  
    class_corr = class_ano.blend(ruido_desmat_tnmenos1).blend(ruido_desmat_tnmenos1)  }
  else {class_corr = class_ano}

  if (i_ano == 0){ var class_final = class_corr}  
  else {class_final = class_final.addBands(class_corr)}

}


//------------------------------------------------------------------------------------------------------------------------

// ===============================================
// REMAPEO DENTRO DE POLÍGONOS (FC del panel)
// ===============================================

// 0) Imagen base
var prueba = class_final.toInt8();

// 1) Unir las colecciones definidas en el panel, y agregar en este paso
var fcList = [];
if (typeof urbanToOthers !== 'undefined') fcList.push(urbanToOthers);
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
remapped = remapped.toInt8();  // o .toUint8() si tus clases son 0–255

// Resultado final
prueba = remapped;


//-----------------------------------------------------------------------------------------------------------
// Visualizacion 
Map.addLayer(regiones, {}, 'regiones', false);
Map.addLayer(region, {color: 'red'}, 'region', false);

Map.addLayer(Filter_5years, visClass, 'Filter_5years-'+year, true);
Map.addLayer(prueba, visClass, 'class_final-'+year, true);

//------------------------------------------------------------------------------------------------------------------------
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-infrastructure/'; // output classifciación 

// (justo antes de Map.addLayer / Export)
prueba = prueba.toUint8();   // entero sin signo de 8 bits
print(prueba);

Export.image.toAsset({
    "image": prueba,
    "description": 'urban-first-last-filter-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "assetId": assetClass + 'urban-first-last-filter-'+ecorregionId.toString() + '-'+ ecorregionxregionId +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regionbuff.geometry()
});
