# MapBiomas Chile — LULC Collection 02

Scripts and tools for generating **Land Use and Land Cover (LULC)** maps for MapBiomas Chile — Collection 02, developed primarily in Google Earth Engine.

The repository is organized by workflow stage.

---

## 📁 Repository layout

### 00-BORRADORES
Scripts under development, function tests, and prototypes.

### 01-MOSAIC
Generation of multi-temporal mosaics (Landsat / Sentinel) used as classification inputs.

### 02-MODELS
Scripts for classification models, training, filtering, and post-processing.

### 03-ANCILLARY
Auxiliary layers and utilities (masks, statistics, area summaries, tables, etc.).

---

## 🔗 Product resources

- 🌐 [MapBiomas Chile platform — LULC results](https://plataforma.mapbiomas.org/coverage/coverage_lclu?t[regionKey]=chile&t[ids][]=20-1-1&t[divisionCategoryId]=2&tl[id]=1&tl[themeKey]=coverage&tl[subthemeKey]=coverage_lclu&tl[pixelValues][]=59&tl[pixelValues][]=60&tl[pixelValues][]=67&tl[pixelValues][]=11&tl[pixelValues][]=12&tl[pixelValues][]=29&tl[pixelValues][]=63&tl[pixelValues][]=66&tl[pixelValues][]=9&tl[pixelValues][]=15&tl[pixelValues][]=18&tl[pixelValues][]=33&tl[pixelValues][]=34&tl[pixelValues][]=27&tl[pixelValues][]=23&tl[pixelValues][]=24&tl[pixelValues][]=25&tl[pixelValues][]=61&tl[legendKey]=default&tl[year]=2024)

- 📘 [ATBD LULC Collection 02](https://chile.mapbiomas.org/wp-content/uploads/sites/13/2025/10/ATBD_Chile_Coll_2.docx.pdf)

- 🌎 [MapBiomas Chile](https://chile.mapbiomas.org/)

---

## 🧪 Technologies

- Google Earth Engine (JavaScript)
- Landsat Collection

---

## ⚠️ Notes

- Scripts are intended to run from the Google Earth Engine Code Editor.
- Asset paths may need to be adjusted for your user or project.
