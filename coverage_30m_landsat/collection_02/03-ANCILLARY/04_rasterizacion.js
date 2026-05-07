var selectedRegion = ee.FeatureCollection("projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/E8"); //la geometría es muy compleja para procesar
// Se simplifica
var simplificationTolerance = 1000; // en metros (ajusta según necesidad)
var selectedRegionSimplified = selectedRegion.map(function(feature) {
  return feature.simplify(simplificationTolerance).buffer(5000); //el buffer se debe discutir
});

var rst = ee.Image(0).paint(selectedRegionSimplified,1).selfMask().toInt8();

Export.image.toAsset({
  image: rst,
  description: 'E8_rast',
  assetId: 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/ANCILLARY_DATA/GENERAL/ECORREGIONES/EC8_rast',
  region: geometry,
  scale: 30, // depende de la resolución de la imagen
  crs: 'EPSG:4326',
  maxPixels: 1e13 // aumenta este valor si necesitas
});

Map.addLayer(rst)
