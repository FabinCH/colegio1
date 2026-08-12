# Diff Details

Date : 2026-08-04 09:55:37

Directory c:\\Users\\favia\\OneDrive\\Desktop\\colegio1\\backend

Total : 80 files,  -7727 codes, 306 comments, -390 blanks, all -7811 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [backend/config/db.js](/backend/config/db.js) | JavaScript | 12 | 19 | 6 | 37 |
| [backend/controllers/asistenciaController.js](/backend/controllers/asistenciaController.js) | JavaScript | 124 | 9 | 18 | 151 |
| [backend/controllers/authController.js](/backend/controllers/authController.js) | JavaScript | 132 | 72 | 21 | 225 |
| [backend/controllers/cuadernoController.js](/backend/controllers/cuadernoController.js) | JavaScript | 104 | 10 | 15 | 129 |
| [backend/controllers/cursoController.js](/backend/controllers/cursoController.js) | JavaScript | 121 | 10 | 17 | 148 |
| [backend/controllers/evaluacionController.js](/backend/controllers/evaluacionController.js) | JavaScript | 179 | 17 | 26 | 222 |
| [backend/controllers/inscripcionController.js](/backend/controllers/inscripcionController.js) | JavaScript | 84 | 13 | 16 | 113 |
| [backend/controllers/materiaController.js](/backend/controllers/materiaController.js) | JavaScript | 86 | 10 | 9 | 105 |
| [backend/controllers/mlController.js](/backend/controllers/mlController.js) | JavaScript | 138 | 36 | 30 | 204 |
| [backend/controllers/notificacionController.js](/backend/controllers/notificacionController.js) | JavaScript | 225 | 60 | 36 | 321 |
| [backend/controllers/studentController.js](/backend/controllers/studentController.js) | JavaScript | 148 | 31 | 21 | 200 |
| [backend/middlewares/authMiddleware.js](/backend/middlewares/authMiddleware.js) | JavaScript | 70 | 61 | 16 | 147 |
| [backend/ml/datasets/dataset\_rendimiento\_estudiantil.csv](/backend/ml/datasets/dataset_rendimiento_estudiantil.csv) | CSV | 31 | 0 | 0 | 31 |
| [backend/ml/mlEngine.js](/backend/ml/mlEngine.js) | JavaScript | 298 | 80 | 57 | 435 |
| [backend/ml/scripts/entrenar\_modelo.py](/backend/ml/scripts/entrenar_modelo.py) | Python | 191 | 44 | 39 | 274 |
| [backend/ml/scripts/generar\_dataset.js](/backend/ml/scripts/generar_dataset.js) | JavaScript | 218 | 65 | 39 | 322 |
| [backend/models/Asistencia.js](/backend/models/Asistencia.js) | JavaScript | 51 | 18 | 8 | 77 |
| [backend/models/CuadernoPedagogico.js](/backend/models/CuadernoPedagogico.js) | JavaScript | 61 | 17 | 7 | 85 |
| [backend/models/Curso.js](/backend/models/Curso.js) | JavaScript | 56 | 16 | 8 | 80 |
| [backend/models/Evaluacion.js](/backend/models/Evaluacion.js) | JavaScript | 79 | 22 | 11 | 112 |
| [backend/models/Inscripcion.js](/backend/models/Inscripcion.js) | JavaScript | 29 | 15 | 6 | 50 |
| [backend/models/Materia.js](/backend/models/Materia.js) | JavaScript | 34 | 15 | 6 | 55 |
| [backend/models/Notificacion.js](/backend/models/Notificacion.js) | JavaScript | 59 | 17 | 12 | 88 |
| [backend/models/PushSubscripcion.js](/backend/models/PushSubscripcion.js) | JavaScript | 29 | 13 | 8 | 50 |
| [backend/models/Student.js](/backend/models/Student.js) | JavaScript | 78 | 19 | 8 | 105 |
| [backend/models/User.js](/backend/models/User.js) | JavaScript | 51 | 47 | 9 | 107 |
| [backend/package-lock.json](/backend/package-lock.json) | JSON | 1,696 | 0 | 1 | 1,697 |
| [backend/package.json](/backend/package.json) | JSON | 27 | 0 | 1 | 28 |
| [backend/routes/asistenciaRoutes.js](/backend/routes/asistenciaRoutes.js) | JavaScript | 19 | 12 | 7 | 38 |
| [backend/routes/authRoutes.js](/backend/routes/authRoutes.js) | JavaScript | 9 | 31 | 9 | 49 |
| [backend/routes/cuadernoRoutes.js](/backend/routes/cuadernoRoutes.js) | JavaScript | 19 | 10 | 6 | 35 |
| [backend/routes/cursoRoutes.js](/backend/routes/cursoRoutes.js) | JavaScript | 21 | 12 | 7 | 40 |
| [backend/routes/evaluacionRoutes.js](/backend/routes/evaluacionRoutes.js) | JavaScript | 21 | 12 | 7 | 40 |
| [backend/routes/inscripcionRoutes.js](/backend/routes/inscripcionRoutes.js) | JavaScript | 15 | 8 | 6 | 29 |
| [backend/routes/materiaRoutes.js](/backend/routes/materiaRoutes.js) | JavaScript | 19 | 10 | 6 | 35 |
| [backend/routes/mlRoutes.js](/backend/routes/mlRoutes.js) | JavaScript | 13 | 19 | 8 | 40 |
| [backend/routes/notificacionRoutes.js](/backend/routes/notificacionRoutes.js) | JavaScript | 19 | 10 | 7 | 36 |
| [backend/routes/studentRoutes.js](/backend/routes/studentRoutes.js) | JavaScript | 19 | 11 | 6 | 36 |
| [backend/server.js](/backend/server.js) | JavaScript | 46 | 51 | 17 | 114 |
| [frontend/README.md](/frontend/README.md) | Markdown | -9 | 0 | -8 | -17 |
| [frontend/eslint.config.js](/frontend/eslint.config.js) | JavaScript | -20 | 0 | -2 | -22 |
| [frontend/index.html](/frontend/index.html) | HTML | -46 | -7 | -9 | -62 |
| [frontend/package-lock.json](/frontend/package-lock.json) | JSON | -4,363 | 0 | -1 | -4,364 |
| [frontend/package.json](/frontend/package.json) | JSON | -36 | 0 | -1 | -37 |
| [frontend/postcss.config.js](/frontend/postcss.config.js) | JavaScript | -6 | 0 | -1 | -7 |
| [frontend/public/favicon.svg](/frontend/public/favicon.svg) | XML | -1 | 0 | 0 | -1 |
| [frontend/public/icons.svg](/frontend/public/icons.svg) | XML | -24 | 0 | -1 | -25 |
| [frontend/public/manifest.json](/frontend/public/manifest.json) | JSON | -67 | 0 | -1 | -68 |
| [frontend/public/sw.js](/frontend/public/sw.js) | JavaScript | -141 | -20 | -18 | -179 |
| [frontend/src/App.jsx](/frontend/src/App.jsx) | JavaScript JSX | -50 | -7 | -7 | -64 |
| [frontend/src/api/axiosConfig.js](/frontend/src/api/axiosConfig.js) | JavaScript | -12 | -19 | -5 | -36 |
| [frontend/src/api/offlineDB.js](/frontend/src/api/offlineDB.js) | JavaScript | -204 | -42 | -28 | -274 |
| [frontend/src/api/syncManager.js](/frontend/src/api/syncManager.js) | JavaScript | -141 | -22 | -28 | -191 |
| [frontend/src/assets/react.svg](/frontend/src/assets/react.svg) | XML | -1 | 0 | 0 | -1 |
| [frontend/src/assets/vite.svg](/frontend/src/assets/vite.svg) | XML | -1 | 0 | -1 | -2 |
| [frontend/src/components/Footer.jsx](/frontend/src/components/Footer.jsx) | JavaScript JSX | -40 | -6 | -7 | -53 |
| [frontend/src/components/Header.jsx](/frontend/src/components/Header.jsx) | JavaScript JSX | -66 | -12 | -14 | -92 |
| [frontend/src/components/Layout.jsx](/frontend/src/components/Layout.jsx) | JavaScript JSX | -53 | -9 | -10 | -72 |
| [frontend/src/components/NotificacionesPanel.jsx](/frontend/src/components/NotificacionesPanel.jsx) | JavaScript JSX | -189 | -23 | -20 | -232 |
| [frontend/src/components/ProtectedRoute.jsx](/frontend/src/components/ProtectedRoute.jsx) | JavaScript JSX | -36 | -6 | -7 | -49 |
| [frontend/src/components/Sidebar.jsx](/frontend/src/components/Sidebar.jsx) | JavaScript JSX | -101 | -9 | -12 | -122 |
| [frontend/src/context/AuthContext.jsx](/frontend/src/context/AuthContext.jsx) | JavaScript JSX | -159 | -31 | -20 | -210 |
| [frontend/src/context/NotificacionesContext.jsx](/frontend/src/context/NotificacionesContext.jsx) | JavaScript JSX | -183 | -26 | -36 | -245 |
| [frontend/src/context/OfflineContext.jsx](/frontend/src/context/OfflineContext.jsx) | JavaScript JSX | -211 | -16 | -27 | -254 |
| [frontend/src/context/ThemeContext.jsx](/frontend/src/context/ThemeContext.jsx) | JavaScript JSX | -72 | -23 | -13 | -108 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | -2,121 | -105 | -316 | -2,542 |
| [frontend/src/main.jsx](/frontend/src/main.jsx) | JavaScript JSX | -21 | -1 | -3 | -25 |
| [frontend/src/pages/Asistencia.jsx](/frontend/src/pages/Asistencia.jsx) | JavaScript JSX | -623 | -30 | -28 | -681 |
| [frontend/src/pages/Cuadernos.jsx](/frontend/src/pages/Cuadernos.jsx) | JavaScript JSX | -283 | -14 | -36 | -333 |
| [frontend/src/pages/Cursos.jsx](/frontend/src/pages/Cursos.jsx) | JavaScript JSX | -159 | -3 | -14 | -176 |
| [frontend/src/pages/Dashboard.jsx](/frontend/src/pages/Dashboard.jsx) | JavaScript JSX | -197 | -12 | -16 | -225 |
| [frontend/src/pages/Estudiantes.jsx](/frontend/src/pages/Estudiantes.jsx) | JavaScript JSX | -361 | -18 | -29 | -408 |
| [frontend/src/pages/Evaluaciones.jsx](/frontend/src/pages/Evaluaciones.jsx) | JavaScript JSX | -315 | -32 | -31 | -378 |
| [frontend/src/pages/Login.jsx](/frontend/src/pages/Login.jsx) | JavaScript JSX | -148 | -8 | -16 | -172 |
| [frontend/src/pages/Materias.jsx](/frontend/src/pages/Materias.jsx) | JavaScript JSX | -387 | -26 | -36 | -449 |
| [frontend/src/pages/Predicciones.jsx](/frontend/src/pages/Predicciones.jsx) | JavaScript JSX | -830 | -43 | -51 | -924 |
| [frontend/src/pages/Register.jsx](/frontend/src/pages/Register.jsx) | JavaScript JSX | -190 | -6 | -20 | -216 |
| [frontend/src/pages/Reportes.jsx](/frontend/src/pages/Reportes.jsx) | JavaScript JSX | -464 | -38 | -51 | -553 |
| [frontend/tailwind.config.js](/frontend/tailwind.config.js) | JavaScript | -22 | -1 | -1 | -24 |
| [frontend/vite.config.js](/frontend/vite.config.js) | JavaScript | -5 | -1 | -2 | -8 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details