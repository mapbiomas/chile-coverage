//Script para filtro espacial de collección

//------------------------------------------------------------------------------------------------------------------------

var version = {         
    'output': '3',
    'input' : '3',
};

var min_connect_pixel = 6 ;//area minima 6pixels = 0,5ha  
                          //11pixels = 1ha

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



var class4GAP = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/chile-integracion-'+ version.input.toString());

print(class4GAP, 'coleccion con bandas auxiliares');

Map.addLayer(class4GAP, visClass, 'Clasificación sin Filtro');


var anos = ['1998','1999','2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022', '2023', '2024', '2025'];


for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
  
  var moda = class4GAP.select('classification_'+ano).focal_mode(3, 'square', 'pixels');
  moda = moda.mask(class4GAP.select('classification_'+ano+'_conn').lte(min_connect_pixel));
  var class_out = class4GAP.select('classification_'+ano).blend(moda);
  
  if (i_ano == 0){ var class_outTotal = class_out }  
  else {class_outTotal = class_outTotal.addBands(class_out); }
}
var class_final = class_outTotal;


var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/';
print(class_final, 'filtrado');
Map.addLayer(class_final, visClass, 'Clasificación con filtro');



Export.image.toAsset({
    "image": class_final,
    "description": 'spatial-filter-' + version.output,
    "assetId": assetClass + '/spatial-Filter-' + version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": geometry
}); 
