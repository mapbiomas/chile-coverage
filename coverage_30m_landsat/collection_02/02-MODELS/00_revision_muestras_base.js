// =================== DATOS GENERALES ===================
// CLASE A REVISAR:  
// NOMBRE DEL REVISOR: 
// ULTIMO ASSET ID REVISAO:

// ================== DATOS GENERALES ==================
var clase = 24;
var añoFondo = 2020;
var bufferActivo = null;
var ecoregion= 'e1';

// ================== CARGA DE POLÍGONOS ==================
var basePoligonos = ee.FeatureCollection("projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c59_col1MB");

// ================== CONSTRUIR MUESTRAS UNIFICADAS ==================
function prepararColeccion(fc, idclass) {
  fc = ee.FeatureCollection(fc);
  var count = fc.size();
  var indices = ee.List.sequence(0, count.subtract(1));
  return ee.FeatureCollection(indices.zip(fc.toList(count)).map(function(pair) {
    var i = ee.List(pair).get(0);
    var f = ee.Feature(ee.List(pair).get(1));
    return f.set({
      'id': ee.Number(i).add(1),
      'idclass': idclass
    });
  }));
}

var Muestras = ee.FeatureCollection([]);
var nombresIdclass = {};

var capas = [
  {varName: B_primario,        idclass: 59, nombre: 'Bosque Primario'},
  {varName: B_secundario,      idclass: 60, nombre: 'Bosque Secundario'},
  {varName: B_achaparrado,     idclass: 67, nombre: 'Bosque Achaparrado'},
  {varName: Humedal,           idclass: 11, nombre: 'Humedal'},
  {varName: Pastizal,          idclass: 12, nombre: 'Pastizal'},
  {varName: Matorral,          idclass: 66, nombre: 'Matorral'},
  {varName: Afloramiento_rocoso, idclass: 29, nombre: 'Afloramiento Rocoso'},
  {varName: Coniferas,         idclass: 79, nombre: 'Plantación Coníferas'},
  {varName: Latifoliadas,      idclass: 80, nombre: 'Plantación Latifoliadas'},
  {varName: Agricultura,       idclass: 18, nombre: 'Agricultura'},
  {varName: Pastura,           idclass: 15, nombre: 'Pastura'},
  {varName: Infraestructura,   idclass: 24, nombre: 'Infraestructura'},
  {varName: Arena_Playa_Duna,  idclass: 23, nombre: 'Arena, Playa y Duna'},
  {varName: Salar,             idclass: 61, nombre: 'Salar'},
  {varName: Otra_area_sin_vegetacion, idclass: 25, nombre: 'Otra área sin vegetación'},
  {varName: Rio_Lago_Oceano,   idclass: 33, nombre: 'Río, lago u océano'},
  {varName: Hielo_Nieve,       idclass: 34, nombre: 'Hielo y nieve'}
];

capas.forEach(function(capa) {
  var fc = ee.FeatureCollection(capa.varName);
  var size = fc.size().getInfo();
  if (size > 0) {
    Muestras = Muestras.merge(prepararColeccion(fc, capa.idclass));
    nombresIdclass[capa.idclass] = capa.nombre;
  }
});

Map.addLayer(basePoligonos, {color: 'green'}, 'Polígonos Asset',0);
Map.addLayer(Muestras, {color: 'orange'}, 'Muestras Dibujadas');
Map.centerObject(basePoligonos, 6);
Map.setOptions('SATELLITE');

// ================== FUNCIONES DE CAPAS ==================
function limpiarCapa(nombre) {
  var capas = Map.layers();
  var cantidad = capas.length();
  for (var i = cantidad - 1; i >= 0; i--) {
    var capa = capas.get(i);
    if (capa.getName() === nombre) {
      Map.layers().remove(capa);
    }
  }
}

function limpiarVariasCapas(nombres) {
  nombres.forEach(function(nombre) {
    limpiarCapa(nombre);
  });
}

function mostrarImagenNDVI(poligonoBuffer, año) {
  limpiarCapa('NDVI');

  var start = ee.Date.fromYMD(año - 1, 11, 1);
  var end = ee.Date.fromYMD(año, 3, 31);

  var imagenNDVI = ee.ImageCollection('LANDSAT/COMPOSITES/C02/T1_L2_32DAY_NDVI')
    .filterBounds(poligonoBuffer.geometry())
    .filterDate(start, end)
    .select('NDVI')
    .median()
    .clip(poligonoBuffer);

  Map.addLayer(imagenNDVI, {min: 0, max: 1, palette: ['beige', 'green']}, 'NDVI');
}

var mapbiomas = ee.Image('projects/mapbiomas-public/assets/chile/collection1/mapbiomas_chile_collection1_integration_v1');

var clasesValidas = [3, 11, 12, 66, 29, 9, 21, 24, 23, 61, 25, 33, 34, 27];
var mapbiomasPalette = [
  '#1f8d49', '#519799', '#d6bc74', '#a89358', '#ffaa5f', '#7a5900', '#ffefc3', '#d4271e',
  '#ffa07a', '#f5d5d5', '#db4d4f', '#2532e4', '#93dfe6', '#ffffff'
];

function mostrarMapbiomas(buffer, año) {
  limpiarCapa('MapBiomas');

  var banda = 'classification_' + año;
  var lulc = mapbiomas.select(banda).clip(buffer);
  var lulcRemap = lulc
    .remap(clasesValidas, ee.List.sequence(0, clasesValidas.length - 1))
    .updateMask(lulc.remap(clasesValidas, ee.List.repeat(1, clasesValidas.length)));

  Map.addLayer(lulcRemap, {
    min: 0,
    max: clasesValidas.length - 1,
    palette: mapbiomasPalette
  }, 'MapBiomas');
}

var Mosaico = ee.ImageCollection('projects/mapbiomas-chile/assets/MOSAICS/mosaics-2');

var featureSpace = [
  "blue_median",
  "green_median",
  "red_median",
  "nir_median",
  "swir1_median",
  "swir2_median"
];

function mostrarMosaico(buffer, año) {
  limpiarCapa('Mosaico ' + año);

  var mosaicoAnual = Mosaico
    .filter(ee.Filter.eq('year', año))
    .mosaic()
    .select(featureSpace)
    .clip(buffer);

  var visMos = {
    bands: [selectRed.getValue(), selectGreen.getValue(), selectBlue.getValue()],
    min: 70,
    max: 1500,
    gamma: 0.85
  };

  Map.addLayer(mosaicoAnual, visMos, 'Mosaico ' + año, true);
}

function generarGraficos(poligono, id, panel) {
  var datasetNDVI = ee.ImageCollection('LANDSAT/COMPOSITES/C02/T1_L2_32DAY_NDVI')
    .filterBounds(poligono.geometry())
    .select('NDVI');

  var datasetNBR = ee.ImageCollection('LANDSAT/COMPOSITES/C02/T1_L2_32DAY_NBR')
    .filterBounds(poligono.geometry())
    .select('NBR');

  var años = ee.List.sequence(2001, 2024);

  var ndviVerano = ee.ImageCollection(años.map(function(anio) {
    var start = ee.Date.fromYMD(ee.Number(anio).subtract(1), 11, 1);
    var end = ee.Date.fromYMD(anio, 3, 31);
    return datasetNDVI
      .filterDate(start, end)
      .median()
      .rename('NDVI')
      .set('system:time_start', ee.Date.fromYMD(anio, 1, 1).millis());
  }));

  var chartNDVI = ui.Chart.image.series({
    imageCollection: ndviVerano,
    region: poligono.geometry(),
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NDVI Verano (Nov–Mar) - ID: ' + id,
    hAxis: {title: 'Año'},
    vAxis: {title: 'NDVI', viewWindow: {min: 0, max: 1}},
    lineWidth: 2,
    pointSize: 4
  });

  var meses = ee.List.sequence(1, 12);
  var ndviMensual = ee.ImageCollection(meses.map(function(mes) {
    return datasetNDVI
      .filter(ee.Filter.calendarRange(mes, mes, 'month'))
      .median()
      .rename('NDVI')
      .set('month', mes)
      .set('system:time_start', ee.Date.fromYMD(2000, mes, 15).millis());
  }));

  var chartMensual = ui.Chart.image.series({
    imageCollection: ndviMensual,
    region: poligono.geometry(),
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NDVI Promedio mensual (2000–2024)',
    hAxis: {title: 'Mes', format: 'MMM'},
    vAxis: {title: 'NDVI'},
    lineWidth: 2,
    pointSize: 4
  });

  var nbrVerano = ee.ImageCollection(años.map(function(anio) {
    var start = ee.Date.fromYMD(ee.Number(anio).subtract(1), 11, 1);
    var end = ee.Date.fromYMD(anio, 3, 31);
    return datasetNBR
      .filterDate(start, end)
      .median()
      .rename('NBR')
      .set('system:time_start', ee.Date.fromYMD(anio, 1, 1).millis());
  }));

  var chartNBR = ui.Chart.image.series({
    imageCollection: nbrVerano,
    region: poligono.geometry(),
    reducer: ee.Reducer.mean(),
    scale: 30
  }).setOptions({
    title: 'NBR Verano (Nov–Mar) - ID: ' + id,
    hAxis: {title: 'Año'},
    vAxis: {title: 'NBR', viewWindow: {min: -1, max: 1}},
    lineWidth: 2,
    pointSize: 4,
    series: {0: {color: '#d62728'}}
  });

// Elimina solo los gráficos anteriores (tipo ui.Chart)
var nuevosWidgets = [];
for (var i = 0; i < panel.widgets().length(); i++) {
  var widget = panel.widgets().get(i);
  if (!(widget instanceof ui.Chart)) {
    nuevosWidgets.push(widget);
  }
}
panel.clear();
nuevosWidgets.forEach(function(w) {
  panel.add(w);
});

panel.add(chartNDVI);
panel.add(chartMensual);
panel.add(chartNBR);

}

var sliderPanel = ui.Panel({
  style: {width: '400px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.9)'},
  layout: ui.Panel.Layout.flow('vertical')
});
sliderPanel.add(ui.Label({value: 'Año de análisis (NDVI Verano + MapBiomas)', style: {fontWeight: 'bold', fontSize: '14px'}}));

var sliderAnio = ui.Slider({
  min: 2001, max: 2022, step: 1, value: añoFondo,
  style: {stretch: 'horizontal'},
  onChange: function(val) {
    añoFondo = val;
    if (bufferActivo !== null) {
      mostrarImagenNDVI(bufferActivo, añoFondo);
      mostrarMapbiomas(bufferActivo, añoFondo);
      mostrarMosaico(bufferActivo, añoFondo);
    }
  }
});
sliderPanel.add(sliderAnio);

// ================== PANEL DIBUJADOS CON CLASE + ID ==================
var panelDibujados = ui.Panel({style: {width: '400px'}});
var selectClase = ui.Select({placeholder: 'Selecciona una clase', style: {stretch: 'horizontal'}});
var selectID = ui.Select({placeholder: 'Selecciona un ID', style: {stretch: 'horizontal'}});
panelDibujados.add(ui.Label('Selecciona una clase de polígono:'));
panelDibujados.add(selectClase);
panelDibujados.add(ui.Label('Selecciona un ID del polígono:'));
panelDibujados.add(selectID);

Object.keys(nombresIdclass).sort(function(a, b) {
  return parseInt(a) - parseInt(b);
}).forEach(function(idclass) {
  selectClase.items().add({
    label: nombresIdclass[idclass] + ' (' + idclass + ')',
    value: parseInt(idclass)
  });
});

selectClase.onChange(function(claseSeleccionada) {
  var subgrupo = Muestras.filter(ee.Filter.eq('idclass', parseInt(claseSeleccionada)));
  subgrupo.aggregate_array('id').distinct().getInfo(function(idList) {
    idList.sort();
    selectID.items().reset();
    selectID.setValue(null);
    idList.forEach(function(id) {
      selectID.items().add(id.toString());
    });
  });
});

selectID.onChange(function(idSeleccionado) {
  if (!idSeleccionado || !selectClase.getValue()) return;
  var claseActual = parseInt(selectClase.getValue());
  var f = ee.Feature(Muestras
    .filter(ee.Filter.eq('idclass', claseActual))
    .filter(ee.Filter.eq('id', parseInt(idSeleccionado)))
    .first());
  var fBuffer = f.buffer(4000);
  bufferActivo = fBuffer;
  Map.centerObject(fBuffer, 13);
  limpiarCapa('Buffer 4km');
  limpiarCapa('Seleccionado (Dibujado)');
  Map.addLayer(fBuffer, {color: 'gray'}, 'Buffer 4km', false);
  Map.addLayer(f, {color: 'purple'}, 'Seleccionado (Dibujado)');
  mostrarImagenNDVI(fBuffer, añoFondo);
  mostrarMapbiomas(fBuffer, añoFondo);
  mostrarMosaico(fBuffer, añoFondo);
  generarGraficos(f, idSeleccionado, panelDibujados);
});

// ================== PANEL ASSET ==================
var panelAsset = ui.Panel({style: {width: '400px'}});
basePoligonos.aggregate_array('id').distinct().getInfo(function(idListRaw) {
  var idList = idListRaw.filter(function(v) { return v !== null && v !== undefined; }).map(function(v) { return v.toString(); });
  var select = ui.Select({
    items: idList,
    onChange: function(id) {
      var f = ee.Feature(basePoligonos.filter(ee.Filter.eq('id', ee.Number.parse(id))).first());
      var fBuffer = f.buffer(4000);
      bufferActivo = fBuffer;
      Map.centerObject(fBuffer, 13);
      limpiarCapa('Buffer 4km');
      limpiarCapa('Seleccionado (Asset)');
      limpiarCapa('Seleccionado (Dibujado)');
      Map.addLayer(fBuffer, {color: 'gray'}, 'Buffer 4km', false);
      Map.addLayer(f, {color: 'blue'}, 'Seleccionado (Asset)');
      mostrarImagenNDVI(fBuffer, añoFondo);
      mostrarMapbiomas(fBuffer, añoFondo);
      mostrarMosaico(fBuffer, añoFondo);
      generarGraficos(f, id, panelAsset);
    }
  });
  panelAsset.add(ui.Label('Selecciona un polígono del asset:'));
  panelAsset.add(select);
});

// ================== LEYENDA ==================
sliderPanel.add(ui.Label({value: 'Leyenda MapBiomas (ES)', style: {fontWeight: 'bold', fontSize: '13px', margin: '12px 0 4px 0'}}));
var clasesLeyenda = [
  ['Bosque', '#1f8d49'], ['Humedal', '#519799'], ['Pastizal', '#d6bc74'], ['Matorral', '#a89358'],
  ['Afloramiento rocoso', '#ffaa5f'], ['Plantación forestal', '#7a5900'], ['Mosaico agropastoril', '#ffefc3'],
  ['Infraestructura', '#d4271e'], ['Arena, playa, duna', '#ffa07a'], ['Salar', '#f5d5d5'],
  ['Otra sin vegetación', '#db4d4f'], ['Cuerpo de agua', '#2532e4'], ['Hielo/nieve', '#93dfe6'], ['No observado', '#ffffff']
];
clasesLeyenda.forEach(function(clase) {
  var entrada = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'), style: {margin: '0 0 4px 0'}});
  entrada.add(ui.Label({style: {backgroundColor: clase[1], padding: '6px', margin: '0 8px 0 0', border: '1px solid #999'}}));
  entrada.add(ui.Label({value: clase[0], style: {fontSize: '12px'}}));
  sliderPanel.add(entrada);
});

// ================== PANEL DE SELECCIÓN DE BANDAS ==================
var bandasDisponibles = [
  "blue_median",
  "green_median",
  "red_median",
  "nir_median",
  "swir1_median",
  "swir2_median"
];

var labelBandas = ui.Label('Composición RGB del mosaico:', {fontWeight: 'bold', fontSize: '13px', margin: '12px 0 4px 0'});
var selectRed = ui.Select({items: bandasDisponibles, value: 'red_median', style: {stretch: 'horizontal'}});
var selectGreen = ui.Select({items: bandasDisponibles, value: 'green_median', style: {stretch: 'horizontal'}});
var selectBlue = ui.Select({items: bandasDisponibles, value: 'blue_median', style: {stretch: 'horizontal'}});

var panelBandas = ui.Panel({
  widgets: [
    labelBandas,
    ui.Label('Banda Roja:'), selectRed,
    ui.Label('Banda Verde:'), selectGreen,
    ui.Label('Banda Azul:'), selectBlue
  ],
  style: {margin: '8px 0'}
});

// ================== EXPORTACIÓN ==================
var exportarBtn = ui.Button({
  label: 'Exportar polígonos dibujados',
  style: {stretch: 'horizontal', margin: '12px 0 0 0'},
  onClick: function() {
    var muestrasfiltradas = Muestras.filter(ee.Filter.eq('idclass', clase));
    muestrasfiltradas.size().evaluate(function(cantidad) {
      if (cantidad === 0) {
        print('⚠️ No hay polígonos válidos para exportar.');
      } else {
        Export.table.toAsset({
          collection: muestrasfiltradas,
          description: 'Exportar_Muestras',
          assetId: 'projects/mapbiomas-chile/assets/LULC/COLLECTION-02/SAMPLES/BASE/c' + clase + '_col2MB'  
        });
        print('✅ Exportación iniciada. Revisa la pestaña "Tasks".');
      }
    });
  }
});

// ================== DASHBOARD ==================
var dashboard = ui.Panel({layout: ui.Panel.Layout.flow('vertical'), style: {width: '420px'}});
dashboard.add(sliderPanel);
dashboard.add(panelBandas);
dashboard.add(panelAsset);
dashboard.add(panelDibujados);
dashboard.add(exportarBtn);
ui.root.add(dashboard);

// ================== BOTÓN TOGGLE ==================
var panelVisible = true;
var toggleButton = ui.Button({
  label: 'Ocultar dashboard',
  style: {position: 'top-left'},
  onClick: function() {
    panelVisible = !panelVisible;
    dashboard.style().set('shown', panelVisible);
    toggleButton.setLabel(panelVisible ? 'Ocultar dashboard' : 'Mostrar dashboard');
  }
});

var botonRefrescar = ui.Button({
  label: '🔄 Refrescar capas',
  style: {position: 'top-left', margin: '40px 0 0 0'},
  onClick: function() {
    if (bufferActivo !== null) {
      mostrarImagenNDVI(bufferActivo, añoFondo);
      mostrarMapbiomas(bufferActivo, añoFondo);
      mostrarMosaico(bufferActivo, añoFondo);
    } else {
      print('⚠️ No hay una selección activa para refrescar.');
    }
  }
});

Map.add(toggleButton);  // Botón de ocultar dashboard

Map.add(botonRefrescar);  // 🔄 Aquí agregas el botón de refrescar capas
