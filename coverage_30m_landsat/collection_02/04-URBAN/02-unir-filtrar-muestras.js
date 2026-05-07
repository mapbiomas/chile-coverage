//Este script toma las muestras base de una clase y ecorregión 
// Luego las filtra por la máscara de infrasestructura potencial

//------------------------------------------------------------------------------------------------------
// === PARÁMETROS ===
//Primero selecciono la clase de interés

var clases = [
   'c24',
  /* 'c59',
   'c60',
   'c67',
   'c66',
   'c11',
   'c12',
   'c18',
   'c15',
   'c79',
   'c80',
   'c23',
   'c25',
   'c29',
   'c63',
   'c61',   
   'c33', 
   'c34'*/
   ];
   
// Luego, defino todas las ecorregiones que contengan la clase definida
var ecorregiones = [
        'E1', 
        'E2',
        'E3', 
        'E4', 
        'E5', 
        'E6S1',
        'E6S2',
        'E6S3', 
        'E6S4',
        'E6S5',
        'E7',
        'E8',
        //'E9'
        ];

var assetBase = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/';  // defino el asset de entrada de polygonos
var mascara = ee.Image('projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/urban-mask-1');  //  y la máscara

//-------------------------------------------------------------------------------------------------------------------------------
//Función que llama los polygonos  de todas las ecorregiones de la clase definida y los intersecta con la máscara
function unirPorClase(clase) {
  var coleccionTotal = ee.FeatureCollection([]);

  ecorregiones.forEach(function(ecorregion) {
    var nombreAsset = assetBase + clase + '_col2MB_' + ecorregion;

    var fc = ee.FeatureCollection(nombreAsset)
      .map(function(f) {
        return f.set('ecorregion', ecorregion, 'clase', clase);
      });

    // Contar píxeles con valor 1 en la máscara dentro de cada polígono
    var zonasConMascara = mascara.eq(1).reduceRegions({
      collection: fc,
      reducer: ee.Reducer.sum(),
      scale: 30,
      crs: mascara.projection()
    });

    // Filtrar solo los polígonos que contienen al menos un píxel con valor 1
    var fcFiltrado = zonasConMascara.filter(ee.Filter.gt('sum', 0));

    // Mostrar el conteo por ecorregión
    print(clase + ' ecorregión ' + ecorregion + 
          ' polígonos con intersección en máscara:', fcFiltrado.size());

    coleccionTotal = coleccionTotal.merge(fcFiltrado);
  });

  return coleccionTotal;
}

// Se unen todos los poligonos filtrados para el territorio chileno
clases.forEach(function(clase) {
  var fcFinal = unirPorClase(clase);

//Visualización de los resultados en la consola y mapa
  print('Número de polígonos para clase ' + clase + ':', fcFinal.size());
    Map.addLayer(mascara, imageVisParam, 'mascara');
    Map.addLayer(fcFinal, {}, 'Clase ' + clase);


  // Exportar a asset
  Export.table.toAsset({
    collection: fcFinal,
    description: 'polygons-base-' + clase + '-chile',
    assetId: assetBase + 'INFRAESTRUCTURE/polygons-base-' + clase + '-chile'
  });
});

