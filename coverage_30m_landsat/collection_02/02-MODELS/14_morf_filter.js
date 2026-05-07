// ====================
// FILTRO MORFOLOGICO
// ====================

// -------------------------------
// 1. Definir clasificación a usar
// -------------------------------
// Aquí debes cambiar el asset de clasificación según la región/colección
// que quieras utilizar. Ejemplo: E6S4, E6S5, etc.
var clasi = ee.ImageCollection(
  "projects/mapbiomas-chile/assets/LULC/COLLECTION-02/CLASSIFICATIONS/classification-preliminar-E6S4_2"
);


// -------------------------------
// 2. Definir paleta de colores
// -------------------------------

//Paleta
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
    'min': 0,
    'max': 80,
    'palette': mapbiomasPalette
};

// -------------------------------
// 3. Lista de años a visualizar
// -------------------------------
// Puedes activar o desactivar años comentando las líneas.
// Ahora solo se muestran 2004, 2014 y 2024.
var years = [
  //1997, 1998, 1999,
  //2000, 2001, 2002, 2003,
  2004,
  //2005, 2006, 2007, 2008, 2009, 2010,
  //2011, 2012, 2013,
  2014,
  //2015, 2016, 2017, 2018, 2019, 2020,
  //2021, 2022, 2023, 2025
  2024
];


// -------------------------------
// 4. Procesamiento por cada año
// -------------------------------
years.forEach(function (year) {
  
  // a) Filtrar la clasificación del año correspondiente
  var clasianual = clasi
    .filter(ee.Filter.eq('year', year))
    .mosaic();
  
  // b) Detectar píxeles de plantaciones (79 = Coníferas, 80 = Latifoliadas), u otras clases
  var plantacion = clasianual.eq(79).or(clasianual.eq(80));
  
  // c) Aplicar operación de “closing” (rellenar huecos pequeños)
  //    con filtros morfológicos (focal_max y focal_min)
  var closing = plantacion
    .focal_max(1, 'diamond', 'pixels') //Aqui se puden utilizar otras formas 'circle', 'square', 'cross', 'plus', 'octagon'y 'diamond'.
    .focal_min(1, 'diamond', 'pixels');//Aqui se puden utilizar otras formas 'circle', 'square', 'cross', 'plus', 'octagon'y 'diamond'.

  // d) Reproyectar para asegurar resolución de 30 m
  var closing_fixed = closing.reproject({
    crs: closing.projection(),   // o puedes forzar 'EPSG:32719'
    scale: 30                    // tamaño de píxel
  });

  // e) Combinar la clasificación original con la corrección
  //    Los píxeles corregidos se asignan a la clase 9
  var corrected = clasianual.blend(
    closing_fixed.where(closing_fixed, 9).selfMask()
  );

  // f) Visualizar en el mapa
  Map.addLayer(clasianual, visClass, year + ' - class original', false);
  Map.addLayer(corrected, visClass, year + ' - class corregida', false);
});

