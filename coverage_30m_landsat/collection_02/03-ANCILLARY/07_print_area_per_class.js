//Script para visualizar la variación de la superficie por región para una clase seleccionada y
//comparar entre la colección 01 y diferentes versiónes de la Colección 02
//este script funciona entre el año 2000 y 2022 y esta configura para mostrar los códigos de la colección 01

//-------------------------------------- Definir variables -----------------------------------------
var year = 2022;
//Parámetros a ajustar
var regionId = 13;// Selecciono una región de CHILE a analizar
var regionName = 'Arica' ; // Escribo el Nombre de la región (para visualización del gráfico)
/*Nombres y Codigos por región
Arica y Parinacota  13
Atacama 7
Antofagasta 2
Tarapacá 6 (Pampa del tamarugal)
Coquimbo 5
Valparaíso 12
Metropolitana de Santiago 4
Libertador bernardo O'higgins 15
Maule 8
Ñuble 14
Biobío 10
La Araucanía 16
Los Ríos 3
Los Lagos 17
Aysen 11
Magallanes 9
 */

//Defino la clase de interés 
var classID =  18;  //AQUÍ ELIJO LA CLASE QUE QUIERO REVISAR

/*Codigos de clases Col01                   
 3 = Bosques
 9 = Silvicultura
11 = Humedales
12 = Herbazales
21 = Mosaico de agricultura y pastura
23 = Arenas, playas y dunas
24 = Infraestructura (No disponible)
25 = Otras áreas sin vegetación
29 = Afloramiento Rocoso
33 = Rios, lagos y Oceanos
34 = Hielo y nieve
61 = Salares
66 = Matorrales*/


//--------------------------------------------------------------------------------------------------
//Asset
var regiones = ee.Image('projects/mapbiomas-chile/assets/ANCILLARY_DATA/STATISTICS/COLLECTION1/VERSION-1/nivel-politico-2-raster');
var region =  regiones.eq(regionId ).selfMask();
Map.addLayer(regiones, {min:2, max:17, palette:['#0000ff','#00ffff','#00ff00','#ffff00','#ff0000']}, 'Regiones', false);
//Map.addLayer(region, {min:2, max:17, palette:['#800080']}, 'aysen', true);



//Assets de la classificación 

//var integrado = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/chile-integracion-4')
                                                       //         .updateMask(region);
var coleccion02 = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-final/clasificacion-final-2')
                                                                ;


//------------------------------------------------------------------------------------------------------------------------

//2. Defino mi capa a revisar, esta debe ser de chile completo o solo entregará valores parciales

var classification = ee.Image('projects/mapbiomas-chile/assets/COLLECTION1/integraciones_finales/CHILE_COL1_2v5')
                                                                

                  


//Visualizo el último año
//Parámetros de Visualización
var palettes = require('users/mapbiomas/modules:Palettes.js');
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
  bands: 'classification_'+year.toString(),
  min:0,
  max:80,
  palette:mapbiomasPalette,
  format:'png'
};


//------------------------------ Creo una geométria simple ------------------------------------------


var geomReal = region.reduceToVectors({
  geometry: region.geometry(), // o tu AOI
  scale: 120,                      // coherente con tu análisis
  geometryType: 'polygon',
  maxPixels: 1e13,
  bestEffort: true,
  tileScale: 4
}).geometry(); // geometría final (unión de todos los polígonos)

// Opción 1) Rectángulo mínimo (extensión) — ¡súper simple!
var geomBox = geomReal.bounds();  // rectangular, poquísimos vértices
var selectedRegion = geomBox;
// Mostrar en el mapa
Map.addLayer(selectedRegion, {color: 'blue'}, 'Footprint raster', false);


// =================== remapear===================

//Reglas de integración especiales
var anos = [//'1998','1999',
              '2000','2001','2002','2003','2004','2005','2006',
            '2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017',
            '2018','2019','2020','2021','2022'
            //,'2023','2024', '2025'
            ];
            
var remapFrom = [24, 9, 3, 59,60,66,67,61,62,79,80,11,12,18,15,23,25,27,29,33,34,63,77,71];
//var remapTo =   [24, 9, 3,  3, 3,66, 3,61,61, 9, 9,11,12,21,21,23,25,27,29,33,34,12,66, 9];
var remapTo = [24,9, 3, 59,60,66,67,61,62,79,80,11,12,18,15,23,25,27,29,33,34,63,66,9]; // en caso de querer revisar clases de col 02 solamente
                    

//Cambio los codigos y homogenizo si es necesario
for (var i_ano=0;i_ano<anos.length; i_ano++){  
  var ano = anos[i_ano]; 
//cambiando el código de ciertas clases
  var integracion_out = coleccion02.select('classification_'+ano)
             .remap(remapFrom,
                    remapTo).rename('classification_'+ano);

  if (i_ano == 0){ var integracion_remap = integracion_out }  
  else {integracion_remap = integracion_remap.addBands(integracion_out); }
}





//-------------------------------- Cálculo de Superficies ----------------------------------------

var year_list = anos; 
// Defino la función para calcular el área en ha
var pixelArea = ee.Image.pixelArea().divide(10000);

// Lista para almacenar resultados
var areaList = [];

// Bucle por cada año
for (var i_year in year_list) {
    var year = year_list[i_year];

    // --- 1) Área Colección  2 Integrado ---
    var area_integrado = pixelArea
        .mask(integracion_remap.select('classification_' + year).eq(classID))
        .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: selectedRegion,
            scale: 150,
            maxPixels: 1e13
        })
        .get('area');
        
    // --- 3) Área desde Coleccion 1 ---
    var area_coleccion01 = pixelArea
        .mask(classification.select('classification_' + year).eq(classID))
        .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: selectedRegion,
            scale: 150,
            maxPixels: 1e13
        })
        .get('area');

    // Agregar año y ambas áreas como propiedades en el mismo Feature
    areaList.push(ee.Feature(null, {
        'year': year,
        'coleccion02': area_integrado,
        'coleccion01': area_coleccion01
    }));
}

// Convertir la lista en un FeatureCollection
var areaCollection = ee.FeatureCollection(areaList);

var title = 'Área por año clase ' + classID + ' región ' + regionId + ' ' + regionName;

// Generar gráfico con dos series
var areaChart = ui.Chart.feature.byFeature({
    features: areaCollection,
    xProperty: 'year',
    yProperties: [
       'coleccion02' ,
       'coleccion01'] // n series
}).setOptions({
    title: title,
    hAxis: { title: 'Año' },
    vAxis: {
        title: 'Área (ha²)',
        viewWindow: { min: 0 }
    },
    lineWidth: 2
});

// Mostrar gráfico
print(areaChart);



var coleccion01 = classification;
Map.addLayer(coleccion01.updateMask(region), visClass, 'COL01-'+year.toString(), true);
Map.addLayer(coleccion02.updateMask(region), visClass, 'COL02'+year.toString(), true);


Map.addLayer(coleccion01, visClass, 'COL01-Chile-LastVersion-'+year.toString(), false);
Map.addLayer(coleccion02, visClass, 'COL02-Chile-LastVersion-'+year.toString(), false);

