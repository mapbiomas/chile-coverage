//Filtro de moda
//este scrip aplica filtro de moda en todos los píxeles de la clase definida como mascara
//luego calcula la moda de las clases que yo defina

Map.setOptions("HYBRID");
//----------------------------------------------------------------------------------------------------------------------------------------------
//Parámetros
//var codClass = 'c18'; // clase de interés a mejorar 

var ecorregionId = 'E5';
var ecorregionxregionId = 2;
var year= 2024; // año de visualziación 

var anos = ['1998','1999','2000',
            '2001','2002','2003','2004','2005','2006','2007','2008','2009','2010',
            '2011','2012','2013','2014','2015','2016','2017','2018','2019','2020',
            '2021','2022', '2023','2024'];


//Clase sobre la que deseo se aplique el filtro (clase 1)
 var clase_1 = [11];

//Clases a las que se puede cambiar la clase 1 (clases alternativas)
var fromClass = [11, 18]; 
var toClass = [11, 18];

//-----------------------------------------------------------------------------------------------------------------------------------------------
//Assets
//Region
var assetRegions = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/'
                                    +ecorregionId.toString()//+'-region'; //Zonas
                   
var regiones = ee.FeatureCollection(assetRegions);
var region = regiones//.filter(ee.Filter.eq('id', ecorregionxregionId));

var regionbuff = region.map(function(feature) {
  return feature.buffer(1000); // 100 metros de buffer
});

var selectedRegion = regionbuff.reduceToImage({
  properties: ['id'],            // atributo para convertir en raster
  reducer: ee.Reducer.first()       // cómo resolver solapes (first, mode, max, etc.)
}).rename('territory_id');                  // nuevo nombre de la propiedad

//Area de interés para la aplicación del filtro
 var mascara = ('');  //puede ser ee.Image()  o un ee.FeatureCollection()   

//clasificación de entrada
var spatialFilter = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/chile-integracion-general-1')
                                                .updateMask(selectedRegion)
                                                ; 

//-------------------------------------------------------------------------------------------------------------------------------------------
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

//-------------------------------------------------------------------------------------------------------------------------------------------------------------------
//Defino función

var countNaturais = anos.map(function (ano) {
        var image = spatialFilter.select('classification_'+ano).remap(
                 fromClass,toClass); // clases alternativas
        return image.int8();
    }
);
var moda_natural = ee.ImageCollection.fromImages(countNaturais).mode();
for (var i_ano=0;i_ano<anos.length; i_ano++){
  var ano = anos[i_ano];
  var mask_nat_ano = spatialFilter.select('classification_'+ano).remap(
                  clase_1,[1]); //clase 1
  var moda_natural_ano = moda_natural.mask(mask_nat_ano);
  var corrige_ano = spatialFilter.select('classification_'+ano).blend(moda_natural_ano);
  

  if (i_ano == 0){ var corrige = corrige_ano.rename('classification_'+ano) }  
  else {corrige = corrige.addBands(corrige_ano.rename('classification_'+ano)); }
  
}


//---------------------------------------------------------------------------------------------------------------------------------------------------------------
//Inspección

print(spatialFilter, 'Original');
print(corrige, 'corregida');

Map.addLayer(spatialFilter, visClass, 'clasificación de entrada', false);
Map.addLayer(corrige, visClass, 'clasificación corrigida', false);

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
//Exportación
var assetClass = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/postproceso/';

var ecorregionID =  'E1';
var ecorregionxregionID = ''; 

var version = { 
    'output': '1',
};

//Usted puede cambiar el nombre del asset de salida

Export.image.toAsset({
    "image": corrige,
    "description": 'mode-filter-' +ecorregionID.toString()+'-'+ecorregionxregionID.toString() +'-'+version.output,
    "assetId": assetClass + 'mode-filter-' +ecorregionID.toString()+'-'+ecorregionxregionID.toString() +'-'+version.output,
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": geometry
});
