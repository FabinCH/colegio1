# ============================================================
# backend/ml/scripts/entrenar_modelo.py
# ============================================================
#
# PROPÓSITO:
#   Lee el CSV generado por generar_dataset.js y entrena dos
#   modelos de Machine Learning:
#     1. RandomForestClassifier → predice riesgo_academico
#     2. RandomForestRegressor  → predice nota_final_estimada
#
# REQUISITOS:
#   pip install pandas scikit-learn joblib
#
# USO:
#   cd backend
#   python ml/scripts/entrenar_modelo.py
#
# SALIDA:
#   backend/ml/models/modelo_riesgo.pkl
#   backend/ml/models/modelo_nota_final.pkl
#   backend/ml/models/preprocesador.pkl
# ============================================================

import os
import sys
import warnings
warnings.filterwarnings('ignore')

# ── 1. Verificar dependencias ─────────────────────────────────
try:
    import pandas as pd
    import numpy  as np
    from sklearn.ensemble          import RandomForestClassifier, RandomForestRegressor
    from sklearn.linear_model      import LogisticRegression
    from sklearn.model_selection   import train_test_split, cross_val_score
    from sklearn.preprocessing     import LabelEncoder, StandardScaler
    from sklearn.pipeline          import Pipeline
    from sklearn.compose           import ColumnTransformer
    from sklearn.preprocessing     import OneHotEncoder
    from sklearn.metrics           import (
        accuracy_score, classification_report,
        confusion_matrix, mean_absolute_error,
        root_mean_squared_error
    )
    import joblib
except ImportError as e:
    print(f"\n❌ Dependencia faltante: {e}")
    print("   Instala las dependencias con:")
    print("   pip install pandas scikit-learn joblib\n")
    sys.exit(1)

# ── Rutas ─────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
ML_DIR      = os.path.join(SCRIPT_DIR, '..')
CSV_PATH    = os.path.join(ML_DIR, 'datasets', 'dataset_rendimiento_estudiantil.csv')
MODELS_DIR  = os.path.join(ML_DIR, 'models')

# ── 2. Cargar datos ───────────────────────────────────────────
print("\n" + "=" * 60)
print("🤖 ENTRENAMIENTO DE MODELOS ML — PREDICCIÓN ACADÉMICA")
print("=" * 60)

print(f"\n📂 Leyendo dataset: {CSV_PATH}")

if not os.path.exists(CSV_PATH):
    print(f"\n❌ No se encontró el archivo CSV.")
    print(f"   Primero ejecuta: node ml/scripts/generar_dataset.js")
    sys.exit(1)

df = pd.read_csv(CSV_PATH)
print(f"   → {len(df)} filas cargadas, {len(df.columns)} columnas")
print(f"   → Distribución de riesgo:\n{df['riesgo_academico'].value_counts().to_string()}")

# Verificar que hay suficientes datos
MIN_FILAS = 20
if len(df) < MIN_FILAS:
    print(f"\n⚠️  Solo hay {len(df)} filas. Se necesitan al menos {MIN_FILAS} para entrenar.")
    print("   Genera más datos con el script generar_dataset.js")
    sys.exit(1)

# ── 3. Preprocesamiento ───────────────────────────────────────
print("\n🔧 Preprocesando datos...")

# Rellenar valores nulos
df['promedio_anterior']  = df['promedio_anterior'].fillna(df['total_trimestre'])
df['variacion_promedio'] = df['variacion_promedio'].fillna(0)
df['promedio_parcial']   = df['promedio_parcial'].fillna(df['total_trimestre'])

# Columnas numéricas a usar como features
FEATURES_NUMERICAS = [
    'trimestre',
    'ser',
    'saber',
    'hacer',
    'autoevaluacion',
    'total_trimestre',
    'promedio_anterior',
    'promedio_parcial',
    'variacion_promedio',
    'asistencias',
    'faltas',
    'retrasos',
    'licencias',
    'porcentaje_asistencia',
    'materias_bajo_rendimiento',
]

# Columnas categóricas (opcional — se puede quitar si no agrega valor)
FEATURES_CATEG = ['materia']

# Target de clasificación
TARGET_CLASE  = 'riesgo_academico'

# Target de regresión
TARGET_REG    = 'nota_final_estimada'

# Seleccionar solo las columnas que existen
feat_num_ok   = [c for c in FEATURES_NUMERICAS if c in df.columns]
feat_cat_ok   = [c for c in FEATURES_CATEG     if c in df.columns]
all_features  = feat_num_ok + feat_cat_ok

X = df[all_features].copy()
y_clase = df[TARGET_CLASE].copy()
y_reg   = df[TARGET_REG].copy() if TARGET_REG in df.columns else None

print(f"   → Features numéricas  : {feat_num_ok}")
print(f"   → Features categóricas: {feat_cat_ok}")

# ── 4. Preprocesador ─────────────────────────────────────────
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), feat_num_ok),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), feat_cat_ok),
    ],
    remainder='drop'
)

# ── 5. MODELO 1: Clasificación de riesgo académico ───────────
print("\n" + "-" * 60)
print("📊 MODELO 1: RandomForestClassifier → riesgo_academico")
print("-" * 60)

# Codificar etiquetas
le = LabelEncoder()
y_enc = le.fit_transform(y_clase)
print(f"   Clases: {dict(zip(le.classes_, le.transform(le.classes_)))}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)
print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

clf_pipeline = Pipeline([
    ('pre', preprocessor),
    ('clf', RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'
    ))
])

clf_pipeline.fit(X_train, y_train)
y_pred = clf_pipeline.predict(X_test)

print(f"\n   ✅ Accuracy            : {accuracy_score(y_test, y_pred):.4f}")
print("\n   📋 Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print("   🧩 Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Importancia de variables
try:
    clf = clf_pipeline.named_steps['clf']
    feat_names_num = feat_num_ok
    feat_names_cat = list(clf_pipeline.named_steps['pre']
                          .named_transformers_['cat']
                          .get_feature_names_out(feat_cat_ok)) if feat_cat_ok else []
    feat_names_all = feat_names_num + feat_names_cat
    importancias   = sorted(
        zip(feat_names_all, clf.feature_importances_),
        key=lambda x: x[1], reverse=True
    )[:10]
    print("\n   🔑 Top 10 variables más importantes:")
    for nombre, imp in importancias:
        barra = '█' * int(imp * 40)
        print(f"      {nombre:<30} {imp:.4f} {barra}")
except Exception:
    pass

# Logistic Regression como línea base
print("\n   📐 Línea base — Logistic Regression:")
lr_pipeline = Pipeline([
    ('pre', preprocessor),
    ('clf', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
])
lr_pipeline.fit(X_train, y_train)
lr_pred = lr_pipeline.predict(X_test)
print(f"      Accuracy: {accuracy_score(y_test, lr_pred):.4f}")
print(f"      Random Forest {'SUPERA' if accuracy_score(y_test, y_pred) >= accuracy_score(y_test, lr_pred) else 'NO supera'} a Logistic Regression")

# ── 6. MODELO 2: Regresión nota final ────────────────────────
print("\n" + "-" * 60)
print("📈 MODELO 2: RandomForestRegressor → nota_final_estimada")
print("-" * 60)

if y_reg is not None:
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(
        X, y_reg, test_size=0.2, random_state=42
    )

    reg_pipeline = Pipeline([
        ('pre', preprocessor),
        ('reg', RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_leaf=2,
            random_state=42
        ))
    ])

    reg_pipeline.fit(X_tr2, y_tr2)
    y_pred_reg = reg_pipeline.predict(X_te2)

    mae  = mean_absolute_error(y_te2, y_pred_reg)
    rmse = root_mean_squared_error(y_te2, y_pred_reg)

    print(f"   ✅ MAE  (Error Absoluto Medio) : {mae:.2f} puntos")
    print(f"   ✅ RMSE (Raíz Error Cuadrático): {rmse:.2f} puntos")

    # Predicciones de ejemplo
    print("\n   📋 Comparación muestra (real vs. estimado):")
    for real, pred in list(zip(y_te2, y_pred_reg))[:5]:
        print(f"      Real: {real:.1f}  →  Predicho: {pred:.1f}  (diff: {abs(real-pred):.1f})")
else:
    print("   ⚠️  Columna nota_final_estimada no encontrada en el CSV.")
    reg_pipeline = None

# ── 7. Guardar modelos ────────────────────────────────────────
print("\n" + "-" * 60)
print("💾 Guardando modelos...")
os.makedirs(MODELS_DIR, exist_ok=True)

# Guardar clasificador
joblib.dump(clf_pipeline, os.path.join(MODELS_DIR, 'modelo_riesgo.pkl'))
print(f"   ✅ modelo_riesgo.pkl guardado")

# Guardar codificador de etiquetas junto con el clasificador info
joblib.dump({
    'pipeline': clf_pipeline,
    'label_encoder': le,
    'features': all_features,
    'feat_num': feat_num_ok,
    'feat_cat': feat_cat_ok,
}, os.path.join(MODELS_DIR, 'preprocesador.pkl'))
print(f"   ✅ preprocesador.pkl guardado")

if reg_pipeline is not None:
    joblib.dump(reg_pipeline, os.path.join(MODELS_DIR, 'modelo_nota_final.pkl'))
    print(f"   ✅ modelo_nota_final.pkl guardado")

# ── 8. Resumen final ─────────────────────────────────────────
print("\n" + "=" * 60)
print("🎉 ENTRENAMIENTO COMPLETADO")
print("=" * 60)
print(f"   Modelos guardados en: {MODELS_DIR}/")
print("""
   Para usar los modelos en Node.js, ejecuta los endpoints:
     GET /api/ml/predicciones/estudiantes
     GET /api/ml/predicciones/cursos
     GET /api/ml/resumen
""")
