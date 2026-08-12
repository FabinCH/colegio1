// ============================================
// pages/Reportes.jsx — Reportes PDF y Excel
// ============================================
// Fase 6: Sistema de reportes exigidos por el Ministerio
// - Boletín de notas PDF (jsPDF + jspdf-autotable)
// - Centralizador de notas Excel (SheetJS/xlsx)
//
// ESCALA RM 01/2026:
//   SER(10) + SABER(45) + HACER(40) + AUTO(5) = 100

import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Reportes = () => {
  const [cuadernos, setCuadernos] = useState([]);
  const [cuadernoSeleccionado, setCuadernoSeleccionado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [activeTab, setActiveTab] = useState('boletin');

  // Datos para generar reportes
  const [cuadernoDetalle, setCuadernoDetalle] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [centralizadorData, setCentralizadorData] = useState([]);

  useEffect(() => {
    const fetchCuadernos = async () => {
      try {
        const { data } = await API.get('/cuadernos');
        setCuadernos(data.data || []);
      } catch (err) {
        console.error('Error al cargar cuadernos:', err);
      }
    };
    fetchCuadernos();
  }, []);

  // Cargar datos cuando se selecciona un cuaderno
  useEffect(() => {
    if (cuadernoSeleccionado) {
      const fetchDatos = async () => {
        try {
          setCargando(true);
          const [detRes, centRes] = await Promise.all([
            API.get(`/cuadernos/${cuadernoSeleccionado}`),
            API.get(`/evaluaciones/centralizador?cuaderno=${cuadernoSeleccionado}`),
          ]);
          setCuadernoDetalle(detRes.data.data);
          setCentralizadorData(centRes.data.data || []);

          // Cargar evaluaciones de los 3 trimestres
          const [t1, t2, t3] = await Promise.all([
            API.get(`/evaluaciones?cuaderno=${cuadernoSeleccionado}&trimestre=1`),
            API.get(`/evaluaciones?cuaderno=${cuadernoSeleccionado}&trimestre=2`),
            API.get(`/evaluaciones?cuaderno=${cuadernoSeleccionado}&trimestre=3`),
          ]);
          setEvaluaciones({
            1: t1.data.data || [],
            2: t2.data.data || [],
            3: t3.data.data || [],
          });
        } catch (err) {
          console.error('Error al cargar datos:', err);
        } finally {
          setCargando(false);
        }
      };
      fetchDatos();
    }
  }, [cuadernoSeleccionado]);

  // =======================================
  // GENERAR BOLETÍN PDF (para padres)
  // =======================================
  const generarBoletinPDF = (estudianteData) => {
    const doc = new jsPDF();
    const est = estudianteData.estudiante;
    const trimestres = estudianteData.trimestres;
    const cuad = cuadernoDetalle;

    // ── ENCABEZADO ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTADO PLURINACIONAL DE BOLIVIA', 105, 15, { align: 'center' });
    doc.text('MINISTERIO DE EDUCACIÓN', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETÍN DE CALIFICACIONES', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gestión: ${cuad?.gestion || new Date().getFullYear()}`, 105, 36, { align: 'center' });
    doc.text('RM 01/2026', 105, 41, { align: 'center' });

    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(15, 44, 195, 44);

    // ── DATOS DEL ESTUDIANTE ──
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL ESTUDIANTE', 15, 52);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nombre: ${est?.apellidos || ''}, ${est?.nombres || ''}`, 15, 59);
    doc.text(`RUDE: ${est?.rude || 'N/A'}`, 130, 59);
    doc.text(`Unidad Educativa: ${cuad?.unidadEducativa || ''}`, 15, 65);
    doc.text(`Materia: ${cuad?.materia?.nombre || ''}`, 15, 71);
    doc.text(`Curso: ${cuad?.curso?.grado || ''} "${cuad?.curso?.paralelo || ''}"`, 130, 71);

    doc.line(15, 75, 195, 75);

    // ── TABLA DE NOTAS POR TRIMESTRE ──
    const filas = [];
    let sumaTotal = 0;
    let cantTrimestres = 0;

    [1, 2, 3].forEach((trim) => {
      const t = trimestres[trim];
      if (t) {
        filas.push([
          `${trim}° Trimestre`,
          t.ser ?? '-',
          t.saber ?? '-',
          t.hacer ?? '-',
          t.autoevaluacion ?? '-',
          t.total ?? '-',
        ]);
        sumaTotal += (t.total || 0);
        cantTrimestres++;
      } else {
        filas.push([`${trim}° Trimestre`, '-', '-', '-', '-', '-']);
      }
    });

    const promedioFinal = cantTrimestres > 0 ? Math.round(sumaTotal / cantTrimestres) : 0;
    filas.push(['PROMEDIO FINAL', '', '', '', '', promedioFinal]);

    autoTable(doc, {
      startY: 80,
      head: [['Período', 'SER (10)', 'SABER (45)', 'HACER (40)', 'AUTO (5)', 'TOTAL (100)']],
      body: filas,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
      },
      foot: [],
      didParseCell: function (data) {
        // Resaltar fila de promedio final
        if (data.row.index === filas.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 248, 255];
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // ── RESULTADO ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const aprobado = promedioFinal >= 51;
    doc.setTextColor(aprobado ? 0 : 200, aprobado ? 128 : 0, 0);
    doc.text(`Resultado: ${aprobado ? 'APROBADO' : 'REPROBADO'} — ${promedioFinal}/100`, 105, finalY, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // ── PIE ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Nota: La escala de evaluación es de 1 a 100. La nota mínima de aprobación es 51 puntos.', 15, finalY + 10);
    
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    // Firmas
    doc.line(25, finalY + 35, 85, finalY + 35);
    doc.line(120, finalY + 35, 180, finalY + 35);
    doc.setFontSize(8);
    doc.text('Firma del Docente', 55, finalY + 40, { align: 'center' });
    doc.text('Firma del Director/a', 150, finalY + 40, { align: 'center' });

    doc.text(`Docente: ${cuad?.docente?.nombre || ''}`, 55, finalY + 46, { align: 'center' });
    doc.text(`Director/a: ${cuad?.director || ''}`, 150, finalY + 46, { align: 'center' });

    // Guardar
    const nombreArchivo = `Boletin_${est?.apellidos || 'Estudiante'}_${est?.nombres || ''}_${cuad?.gestion || ''}.pdf`;
    doc.save(nombreArchivo);
  };

  // Generar boletín para TODOS los estudiantes (un archivo)
  const generarBoletinTodos = () => {
    if (centralizadorData.length === 0) return alert('No hay datos de evaluaciones para generar boletines');
    centralizadorData.forEach(est => generarBoletinPDF(est));
  };

  // =======================================
  // GENERAR CENTRALIZADOR EXCEL (para director)
  // =======================================
  const generarCentralizadorExcel = () => {
    if (centralizadorData.length === 0) return alert('No hay datos para exportar');

    const cuad = cuadernoDetalle;
    const wb = XLSX.utils.book_new();

    // ── HOJA 1: Centralizador de Notas ──
    const encabezados = [
      ['CENTRALIZADOR DE NOTAS — CUADERNO PEDAGÓGICO'],
      [`Unidad Educativa: ${cuad?.unidadEducativa || ''}`],
      [`Materia: ${cuad?.materia?.nombre || ''} | Curso: ${cuad?.curso?.grado || ''} "${cuad?.curso?.paralelo || ''}" | Gestión: ${cuad?.gestion || ''}`],
      [`Distrito Educativo: ${cuad?.distritoEducativo || ''} | Departamento: ${cuad?.departamento || ''}`],
      [], // Fila vacía
      [
        'Nº', 'Apellidos y Nombres', 'RUDE',
        '1°T SER', '1°T SAB', '1°T HAC', '1°T AUT', '1°T TOTAL',
        '2°T SER', '2°T SAB', '2°T HAC', '2°T AUT', '2°T TOTAL',
        '3°T SER', '3°T SAB', '3°T HAC', '3°T AUT', '3°T TOTAL',
        'PROMEDIO ANUAL', 'RESULTADO',
      ],
    ];

    const filas = centralizadorData.map((item, idx) => {
      const est = item.estudiante;
      const t1 = item.trimestres[1] || {};
      const t2 = item.trimestres[2] || {};
      const t3 = item.trimestres[3] || {};
      const promedio = item.promedioAnual || 0;

      return [
        idx + 1,
        `${est?.apellidos || ''}, ${est?.nombres || ''}`,
        est?.rude || '',
        t1.ser ?? '', t1.saber ?? '', t1.hacer ?? '', t1.autoevaluacion ?? '', t1.total ?? '',
        t2.ser ?? '', t2.saber ?? '', t2.hacer ?? '', t2.autoevaluacion ?? '', t2.total ?? '',
        t3.ser ?? '', t3.saber ?? '', t3.hacer ?? '', t3.autoevaluacion ?? '', t3.total ?? '',
        promedio,
        promedio >= 51 ? 'APROBADO' : 'REPROBADO',
      ];
    });

    const wsData = [...encabezados, ...filas];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas
    ws['!cols'] = [
      { wch: 4 },   // Nº
      { wch: 30 },  // Nombre
      { wch: 15 },  // RUDE
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, // 1T
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, // 2T
      { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, // 3T
      { wch: 12 }, // Promedio
      { wch: 12 }, // Resultado
    ];

    // Merge para el título
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 19 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 19 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 19 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 19 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Centralizador');

    // ── HOJA 2: Resumen por trimestre ──
    const resumenData = [
      ['RESUMEN POR TRIMESTRE'],
      [],
      ['Trimestre', 'Aprobados', 'Reprobados', 'Total', '% Aprobación'],
    ];

    [1, 2, 3].forEach(trim => {
      let aprobados = 0, reprobados = 0;
      centralizadorData.forEach(item => {
        const t = item.trimestres[trim];
        if (t) {
          if (t.total >= 51) aprobados++;
          else reprobados++;
        }
      });
      const total = aprobados + reprobados;
      const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;
      resumenData.push([`${trim}° Trimestre`, aprobados, reprobados, total, `${porcentaje}%`]);
    });

    // Resumen anual
    const aprobadosAnual = centralizadorData.filter(i => (i.promedioAnual || 0) >= 51).length;
    const reprobadosAnual = centralizadorData.length - aprobadosAnual;
    const porcentajeAnual = centralizadorData.length > 0 ? Math.round((aprobadosAnual / centralizadorData.length) * 100) : 0;
    resumenData.push([]);
    resumenData.push(['ANUAL', aprobadosAnual, reprobadosAnual, centralizadorData.length, `${porcentajeAnual}%`]);

    const ws2 = XLSX.utils.aoa_to_sheet(resumenData);
    ws2['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
    ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

    const nombreArchivo = `Centralizador_${cuad?.materia?.nombre || 'Materia'}_${cuad?.curso?.grado || ''}${cuad?.curso?.paralelo || ''}_${cuad?.gestion || ''}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Boletines PDF y Centralizador Excel — RM 01/2026</p>
        </div>
      </div>

      {/* Selector de Cuaderno */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-2">📚 Seleccionar Cuaderno / Materia</label>
        <select 
          value={cuadernoSeleccionado} 
          onChange={(e) => setCuadernoSeleccionado(e.target.value)}
          className="w-full border border-slate-200 p-3 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-colors"
        >
          <option value="">-- Seleccione un cuaderno para generar reportes --</option>
          {cuadernos.map(c => (
            <option key={c._id} value={c._id}>
              {c.materia?.nombre} - {c.curso?.grado} "{c.curso?.paralelo}" ({c.curso?.turno})
            </option>
          ))}
        </select>
      </div>

      {cuadernoSeleccionado && !cargando && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('boletin')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'boletin'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              📄 Boletín PDF
            </button>
            <button
              onClick={() => setActiveTab('centralizador')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'centralizador'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              📊 Centralizador Excel
            </button>
          </div>

          {/* ═══ TAB 1: BOLETÍN PDF ═══ */}
          {activeTab === 'boletin' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">📄 Boletín de Calificaciones</h2>
                  <p className="text-sm text-slate-500">Genera un PDF para entregar a los padres con las notas por trimestre y promedio final.</p>
                </div>
                <button
                  onClick={generarBoletinTodos}
                  disabled={centralizadorData.length === 0}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  📥 Descargar Todos los Boletines
                </button>
              </div>

              {/* Lista de estudiantes con opción individual */}
              {centralizadorData.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-white text-sm">
                          <th className="p-4 w-12">Nº</th>
                          <th className="p-4">Estudiante</th>
                          <th className="p-4 text-center">1°T</th>
                          <th className="p-4 text-center">2°T</th>
                          <th className="p-4 text-center">3°T</th>
                          <th className="p-4 text-center bg-blue-700">Promedio</th>
                          <th className="p-4 text-center">Resultado</th>
                          <th className="p-4 text-center">PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {centralizadorData.map((item, idx) => {
                          const prom = item.promedioAnual || 0;
                          const aprobado = prom >= 51;
                          return (
                            <tr key={item.estudiante?._id || idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-400 font-semibold">{idx + 1}</td>
                              <td className="p-4 font-bold text-slate-800">
                                {item.estudiante?.apellidos}, {item.estudiante?.nombres}
                                <div className="text-xs text-slate-400 font-normal">RUDE: {item.estudiante?.rude}</div>
                              </td>
                              <td className="p-4 text-center font-semibold">{item.trimestres[1]?.total ?? '-'}</td>
                              <td className="p-4 text-center font-semibold">{item.trimestres[2]?.total ?? '-'}</td>
                              <td className="p-4 text-center font-semibold">{item.trimestres[3]?.total ?? '-'}</td>
                              <td className={`p-4 text-center font-extrabold text-lg ${aprobado ? 'text-blue-700 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                {prom}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${aprobado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                  {aprobado ? 'APROBADO' : 'REPROBADO'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => generarBoletinPDF(item)}
                                  className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                >
                                  📄 PDF
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-600 p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                  <span className="text-4xl mb-3 block">📭</span>
                  <p className="font-bold text-lg">Sin evaluaciones registradas</p>
                  <p className="text-sm text-slate-500 mt-1">Registre notas en al menos un trimestre para poder generar boletines.</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB 2: CENTRALIZADOR EXCEL ═══ */}
          {activeTab === 'centralizador' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">📊 Centralizador de Notas</h2>
                  <p className="text-sm text-slate-500">Exporta un archivo Excel con el resumen por curso y todas las materias — formato RM 01/2026.</p>
                </div>
                <button
                  onClick={generarCentralizadorExcel}
                  disabled={centralizadorData.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  📥 Descargar Excel
                </button>
              </div>

              {/* Preview del centralizador */}
              {centralizadorData.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Vista previa del centralizador</p>
                    <p className="text-sm text-emerald-800 font-medium mt-1">
                      {cuadernoDetalle?.materia?.nombre} — {cuadernoDetalle?.curso?.grado} "{cuadernoDetalle?.curso?.paralelo}" — Gestión {cuadernoDetalle?.gestion}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-sm min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-800 text-white text-xs">
                          <th className="p-2 border-r border-slate-700" rowSpan="2">Nº</th>
                          <th className="p-2 border-r border-slate-700 text-left" rowSpan="2">Estudiante</th>
                          <th className="p-2 border-r border-slate-700" colSpan="5">1° Trimestre</th>
                          <th className="p-2 border-r border-slate-700" colSpan="5">2° Trimestre</th>
                          <th className="p-2 border-r border-slate-700" colSpan="5">3° Trimestre</th>
                          <th className="p-2 bg-blue-700" rowSpan="2">Prom.</th>
                        </tr>
                        <tr className="bg-slate-700 text-white text-[10px]">
                          {[1,2,3].map(t => (
                            <React.Fragment key={t}>
                              <th className="p-1 border-r border-slate-600">S</th>
                              <th className="p-1 border-r border-slate-600">Sb</th>
                              <th className="p-1 border-r border-slate-600">H</th>
                              <th className="p-1 border-r border-slate-600">A</th>
                              <th className="p-1 border-r border-slate-600 bg-slate-600">T</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {centralizadorData.map((item, idx) => {
                          const prom = item.promedioAnual || 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 border-r border-slate-100 text-slate-400">{idx+1}</td>
                              <td className="p-2 border-r border-slate-100 text-left font-medium text-slate-800 whitespace-nowrap">
                                {item.estudiante?.apellidos}, {item.estudiante?.nombres}
                              </td>
                              {[1,2,3].map(t => {
                                const tr = item.trimestres[t] || {};
                                return (
                                  <React.Fragment key={t}>
                                    <td className="p-1 border-r border-slate-100 text-xs">{tr.ser ?? '-'}</td>
                                    <td className="p-1 border-r border-slate-100 text-xs">{tr.saber ?? '-'}</td>
                                    <td className="p-1 border-r border-slate-100 text-xs">{tr.hacer ?? '-'}</td>
                                    <td className="p-1 border-r border-slate-100 text-xs">{tr.autoevaluacion ?? '-'}</td>
                                    <td className="p-1 border-r border-slate-100 text-xs font-bold bg-slate-50">{tr.total ?? '-'}</td>
                                  </React.Fragment>
                                );
                              })}
                              <td className={`p-2 font-extrabold ${prom >= 51 ? 'text-blue-700 bg-blue-50' : 'text-red-600 bg-red-50'}`}>
                                {prom}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 text-slate-600 p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                  <span className="text-4xl mb-3 block">📊</span>
                  <p className="font-bold text-lg">Sin datos para el centralizador</p>
                  <p className="text-sm text-slate-500 mt-1">Registre evaluaciones para generar el centralizador de notas.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {cuadernoSeleccionado && cargando && (
        <div className="bg-white p-12 rounded-2xl border text-center text-slate-500">
          Cargando datos para los reportes...
        </div>
      )}

      {!cuadernoSeleccionado && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-12 rounded-2xl text-center shadow-sm">
          <span className="text-5xl mb-4 block">📊</span>
          <h2 className="text-xl font-bold mb-1">Módulo de Reportes</h2>
          <p className="text-sm text-blue-700 max-w-md mx-auto">
            Selecciona un cuaderno pedagógico para generar boletines PDF individuales o el centralizador Excel para la dirección.
          </p>
        </div>
      )}
    </div>
  );
};


export default Reportes;
