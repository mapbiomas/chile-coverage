//Script auxiliar para unir muestras parciales y exportarlas
// Parámetros
var version = '1';
var suffixes = ['1', '2','3'];  // Ajusta según los sufijos que tengas
var startYear = 2011;
var endYear = 2025;

var assetSamples = 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/INFRAESTRUCTURE/'; //Directorio de salida para las muestras

// Función para construir assetId y cargar con metadatos
var loadCollection = function(year, suffix) {
  var assetId = assetSamples + 'samples-points-infraestructura-' + year + '-' + version +  '-'+ suffix  ;
  return ee.FeatureCollection(assetId)
           .map(function(f) { return f.set('year', year); });
};

// Bucle por año
for (var year = startYear; year <= endYear; year++) {
  
  // Inicializa el merged para el año
  var merged = ee.FeatureCollection([]);
  
  for (var i = 0; i < suffixes.length; i++) {
    var suffix = suffixes[i];
    var fc = loadCollection(year, suffix);
    merged = merged.merge(fc);
  }
  
    // 👉 Visualización en la consola
  print('Muestra combinada para ' + year, merged.limit(1000));
  
  // 👉 Visualización en el mapa (opcional)
  Map.addLayer(merged, {}, 'Muestras ' + year);
  // Exportar el archivo del año
  Export.table.toAsset({
    collection: merged,
    description: 'samples-points-infraestructura-' + year + '-' + version,
    assetId: assetSamples + 'samples-points-infraestructura-' + year + '-' + version
  });
}
