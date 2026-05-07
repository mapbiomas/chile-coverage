//Script para corregir primero y ultimo año.
//--------------------------------------------------------------------------------------------------------------------------------
Map.setOptions("HYBRID");

//---------------------------------------------------------------------------------------------------------------------------------
//Defino los parámetros

var version = {         
    'output': '1',
}; // Versión de la salida y entrada

//años que considera la classificación des T de i -> n 
var anos = [1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,
            2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,
            2019,2020,2021,2022, 2023,2024,2025];
            
//Defino la equivalencia entre la clase nivel 3 y la clase nivel 0 
var fromClass= [3,11,12,66,23,25,29,33,34,18,9]; // clases originales
var ToClass= [1,1, 1, 1, 1, 1,1,1,1,10,10];  // natural = 1 vs antrópico = 10

//defino el año para visualización de la classificación
var year = '2024' ; // año para visualización

//Defino Ti y Ti+1
var year_first = '1998';
var year_first_plus1 = '1999'; 

//Defino los años Tn y Tn-1
var year_last = '2025';
var year_last_minus1 = '2024';

//---------------------------------------------------------------------------------------------------------------------------------
//Defino los assets 
//Carga la clasificación con filtro espacial 
//var Filter_5years = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE-INTEGRACION-Spatial_Filter-5')
var Filter_5years = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/filtro_temporal_R4/CHILE-Temporal_Filter-5-4-1')

//---------------------------------------------------------------------------------------------------------------------------------

//Paleta 
var palette = require('users/mapbiomas/modules:Palettes.js').get('classification7');

palette[60] = '#5cb85d';   
palette[63] = '000000';
palette[64] = '000000';
palette[65] = '000000';
palette[66] = '91ff36';
palette[67] = 'c8ffb4';

var visClass = {
  bands: 'classification_'+year.toString(),
  min:0,
  max:67,
  palette:palette,
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
var conectedDesmat = desmat.selfMask().connectedPixelCount(20,true).reproject('epsg:4326', null, 30);
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
var regen1ha = conectedRegen.lte(22);
var ruido_regen_tnmenos1 = Filter_5years
                              .select('classification_'+year_last_minus1.toString())
                              .updateMask(regen1ha);

//--------------------------------------------------------------------------------------------------------------------------


var nivel0_1998 = class_nivel0.select('classification_1998')
var nivel0_1999 = class_nivel0.select('classification_1999')

// corrige desmatamentos pequenos no primeiro ano
var desmat = nivel0_1998.eq(1).and(nivel0_1999.eq(10))
var conectedDesmat = desmat.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var desmat1ha = conectedDesmat.lte(22)
var ruido_desmat98 = Filter_5years.select('classification_1999').updateMask(desmat1ha)


// corrige REGEN pequenos no primeiro ano
var regen = nivel0_1998.eq(10).and(nivel0_1999.eq(1))
var conectedregen = regen.selfMask().connectedPixelCount(30,true).reproject('epsg:4326', null, 30);
var regen1ha = conectedregen.lte(11)
var ruido_regen98 = Filter_5years.select('classification_1999').updateMask(regen1ha)


for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  
  var class_ano = Filter_5years.select('classification_'+ano)

  if (ano == 1998) {  var class_corr = class_ano.blend(ruido_desmat98).blend(ruido_regen98)}
  else if (ano == 2022) {  
    class_corr = class_ano.blend(ruido_desmat21).blend(ruido_regen21)  }
  else {class_corr = class_ano}

  if (i_ano == 0){ var class_final = class_corr}  
  else {class_final = class_final.addBands(class_corr)}

}

Map.addLayer(Filter_5years, visClass, 'Filter_5years', true);
Map.addLayer(class_final, visClass, 'class_final', true);

var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/';


Export.image.toAsset({
    "image": class_final,
    "description": 'Temporal_Filter-firstylast-Region-4-' + version.output,
    "assetId": assetClass + 'Temporal_Filter-firstylast-Region-4-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": geometry
}); 
