// const { sequelize } = require('../config/db');
const { sequelize} = require('../models'); 
const ExcelJS = require('exceljs');
const {Categoria,ClaseSexual, DetalleBeneficio, ReporteDiario, Matadero, Origen, Subespecie, Especie } = require('../models');
const { Op,QueryTypes } = require('sequelize');

class EstadisticaService {




  static async exportarReporteSemanal(data, res) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Semanal');
  
    // Encabezados
    worksheet.columns = [
      { header: 'Semana', key: 'semana', width: 15 },
      { header: 'Especie', key: 'especie', width: 15 },
      { header: 'Total Canales', key: 'totalCanales', width: 15 },
      { header: 'Peso Total (kg)', key: 'totalPeso', width: 15 },
      { header: 'Beneficio Total', key: 'beneficioTotal', width: 20, style: { numFmt: '"$"#,##0.00' } }
    ];
  
    // Datos
    data.forEach(row => {
      worksheet.addRow({
        semana: new Date(row.semana).toLocaleDateString(),
        especie: row.especie,
        totalCanales: row.totalCanales,
        totalPeso: row.totalPeso,
        beneficioTotal: row.beneficioTotal
      });
    });
  
    // Totales
    const totalRow = worksheet.addRow({
      semana: 'TOTAL',
      totalCanales: { formula: `SUM(C2:C${data.length + 1})` },
      totalPeso: { formula: `SUM(D2:D${data.length + 1})` },
      beneficioTotal: { formula: `SUM(E2:E${data.length + 1})` }
    });
    totalRow.font = { bold: true };
  
    // Formato de respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reporte_semanal.xlsx'
    );
  
    return workbook.xlsx.write(res).then(() => {
      res.end();
    });
  }



  static async beneficiosPorPeriodo(filtros = {}) {
    const { fechaInicio, fechaFin, mataderoId } = filtros;
    try {
      return await DetalleBeneficio.findAll({
        attributes: [
          // Usamos el alias "reporte" en lugar de ReporteDiario
          [sequelize.fn(
             'DATE_TRUNC',
             'month',
             sequelize.col('"reporte"."fecha_reporte"')
           ),
           'periodo'
          ],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalCanales'],
          [sequelize.fn('SUM', sequelize.col('peso_canal')), 'totalPeso']
        ],
        include: [{
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          required: true,
          where: {
            fecha_reporte: {
              [Op.between]: [fechaInicio || '1970-01-01', fechaFin || new Date()]
            },
            ...(mataderoId && { matadero_id: mataderoId })
          }
        }],
        // Agrupamos por la misma función, usando el alias
        group: [
          sequelize.fn(
            'DATE_TRUNC',
            'month',
            sequelize.col('"reporte"."fecha_reporte"')
          )
        ],
        order: [[sequelize.literal('periodo'), 'ASC']],
        raw: true
      });
    } catch (error) {
      throw new Error(`Error beneficiosPorPeriodo: ${error.message}`);
    }
  }
  



  static async beneficiosPorEstado(filtros = {}) {
    try {
      const { fechaInicio, fechaFin } = filtros;
      
      // Validar y formatear fechas
      const fechaInicioValida = fechaInicio || '1970-01-01';
      const fechaFinValida = fechaFin || new Date().toISOString().split('T')[0];
      
      const query = `
        SELECT
          o.estado,
          SUM(CAST(o.cantidad_animales AS INTEGER)) AS "totalAnimales",
          COALESCE(SUM(CAST(db.peso_canal AS FLOAT)), 0) AS "totalKg",
          COALESCE(SUM(CAST(db.peso_canal * db.precio_canal AS FLOAT)), 0) AS "totalBeneficio"
        FROM "Origens" AS o
        INNER JOIN "ReporteDiarios" AS r ON o."reporteId" = r.id
        INNER JOIN "DetalleBeneficios" AS db ON db."reporteId" = r.id
        WHERE r."fecha_reporte" BETWEEN $1 AND $2
        GROUP BY o.estado
      `;
  
      const resultados = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
        bind: [fechaInicioValida, fechaFinValida]
      });
  
      return resultados;
    } catch (error) {
      throw new Error(`Error en beneficiosPorEstado: ${error.message}`);
    }
  }

 static async topMataderos(limite = 5) {
  try {
    const mataderos = await Matadero.findAll({
      attributes: ['id', 'nombre'],
      include: [{
        model: ReporteDiario,
        as: 'reportes',
        attributes: ['id'],
        include: [{
          model: DetalleBeneficio,
          as: 'detallesBeneficio',
          attributes: ['cantidad']
        }]
      }]
    });

    // Calcular total de canales por matadero en JS
    const conTotales = mataderos.map(m => {
      let total = 0;
      m.reportes?.forEach(r => {
        r.detallesBeneficio?.forEach(d => {
          total += Number(d.cantidad || 0);
        });
      });
      return {
        id: m.id,
        nombre: m.nombre,
        totalCanales: total
      };
    });

    // Ordenar y limitar
    return conTotales
      .sort((a, b) => b.totalCanales - a.totalCanales)
      .slice(0, limite);
  } catch (error) {
    throw new Error(`Error topMataderos: ${error.message}`);
  }
}



  static async beneficiosPorEspecie(filtros = {}) {
    return DetalleBeneficio.findAll({
      attributes: [
        [sequelize.literal('"subespecie"."nombre"'), 'subespecie'],
        [sequelize.fn('SUM', sequelize.col('peso_canal')), 'pesoTotal'],
        // CAMBIO CLAVE: Usar SUM en lugar de COUNT
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalCanales'], 
        [sequelize.fn('SUM', sequelize.literal('peso_canal * precio_canal')), 'beneficioTotalPesos'] //resultado en dinero
      ],
      include: [{
        model: Subespecie,
        as: 'subespecie',
        attributes: [],
        required: false
      }],
      group: ['subespecie.id', 'subespecie.nombre'],
      raw: true
    });
  }

  
  static async incidentesPorTipo(filtros = {}) {
    return Incidencia.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('AVG', sequelize.col('gravedad')), 'gravedad_promedio']
      ],
      group: ['tipo'],
      order: [[sequelize.literal('total'), 'DESC']],
      raw: true
    });
  }



  static async tiempoPromedioActividad() {
    return ReporteDiario.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (hora_fin - hora_inicio))')), 'tiempo_promedio']
      ],
      raw: true
    });
  }
  
  // Eficiencia por matadero
  static async eficienciaMataderos() {
    return Matadero.findAll({
      attributes: [
        'nombre',
        [sequelize.literal(
          '(SELECT AVG(EXTRACT(EPOCH FROM (hora_fin - hora_inicio))) ' +
          'FROM "ReporteDiarios" ' +
          'WHERE "matadero_id" = "Matadero"."id")'
        ), 'tiempo_promedio'],
        [sequelize.literal(
          '(SELECT SUM(cantidad) ' +
          'FROM "DetalleBeneficios" ' +
          'WHERE "reporteId" IN (' +
            'SELECT id FROM "ReporteDiarios" ' +
            'WHERE "matadero_id" = "Matadero"."id"' +
          '))'
        ), 'total_produccion']
      ],
      order: [[sequelize.literal('tiempo_promedio'), 'ASC']],
      raw: true
    });
  }
  
// En estaditicasService.js
// En estaditicasService.js
static async obtenerEstadisticasGenerales() {
  try {
    // 1. Consulta de Resumen (corregida)
    const resumen = await sequelize.query(`
      WITH resumen AS (
        SELECT 
          COUNT(DISTINCT r.id) as "totalReportes",
          COALESCE(SUM(d.cantidad), 0) as "totalCanales",
          COALESCE(SUM(CASE 
            WHEN cs.nombre = 'Hembra' THEN d.cantidad 
            ELSE 0 
          END), 0) as "totalHembras",
          COALESCE(SUM(CASE 
            WHEN cs.nombre = 'Macho' THEN d.cantidad 
            ELSE 0 
          END), 0) as "totalMachos",
          COALESCE(SUM(d.cantidad), 0) as "totalCanales",  -- Cantidad total de canales (1 por animal)
    COALESCE(SUM(d.peso_canal), 0) as "totalPesoCanal",  -- Peso total de canales
    COALESCE(SUM(d.cantidad * d.peso_pie), 0) as "totalPesoPie",
    COALESCE(SUM(d.cantidad * d.precio_pie), 0) as "totalPrecioPie",
    COALESCE(SUM(d.cantidad * d.precio_canal), 0) as "totalPrecioCanal"
        FROM "ReporteDiarios" r
        LEFT JOIN "DetalleBeneficios" d ON r.id = d."reporteId"
        LEFT JOIN "clases_sexuales" cs ON d."claseSexualNombre" = cs.id
      )
      SELECT * FROM resumen
    `, { type: QueryTypes.SELECT });

    // 2. Consulta por Especie (usando Origens)
    const porEspecie = await sequelize.query(`
      SELECT 
        e.nombre as "especie",
        COALESCE(SUM(o."cantidad_hembras"), 0) as "cantidadHembras",
        COALESCE(SUM(o."cantidad_machos"), 0) as "cantidadMachos",
        COALESCE(SUM(o."cantidad_hembras" + o."cantidad_machos"), 0) as "totalAnimales"
      FROM "Origens" o
      JOIN "especies" e ON o."especieId" = e.id
      GROUP BY e.nombre
    `, { type: QueryTypes.SELECT });


    // 3. Consulta por Matadero (corregida)
    const porMatadero = await sequelize.query(`
      SELECT 
        m.nombre as "matadero",
        COUNT(DISTINCT r.id) as "cantidad"
      FROM "ReporteDiarios" r
      JOIN "mataderos" m ON r."matadero_id" = m.id
      GROUP BY m.nombre
    `, { type: QueryTypes.SELECT });

    return {
      resumen: {
        totalReportes: resumen[0]?.totalReportes || 0,
        totalAnimales: resumen[0]?.totalAnimales || 0,
        totalHembras: resumen[0]?.totalHembras || 0,
        totalMachos: resumen[0]?.totalMachos || 0,
        totalCanales: resumen[0]?.totalCanales || 0,
        totalPesoCanal: parseFloat(resumen[0]?.totalPesoCanal) || 0,
        totalPesoPie: parseFloat(resumen[0]?.totalPesoPie) || 0,
        totalPrecioPie: parseFloat(resumen[0]?.totalPrecioPie) || 0,
        totalPrecioCanal: parseFloat(resumen[0]?.totalPrecioCanal) || 0
      },
      porEspecie: porEspecie.map(row => ({
        especie: row.especie,
        cantidadHembras: parseInt(row.cantidadHembras) || 0,
        cantidadMachos: parseInt(row.cantidadMachos) || 0,
        totalAnimales: parseInt(row.totalAnimales) || 0
      })),
      porMatadero: porMatadero.map(row => ({
        matadero: row.matadero,
        cantidad: parseInt(row.cantidad) || 0
      }))
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}




  static async estadisticasCompletas(filtros = {}) {
    return {
      porEspecie: await this.beneficiosPorEspecie(filtros),
      porTipoIncidente: await this.incidentesPorTipo(filtros),
      porPeriodo: await this.beneficiosPorPeriodo(filtros),
      porUbicacion: await this.beneficiosPorEstado(filtros)
    };
  }





  static async reporteSemanal(filtros = {}) {
    const { fechaInicio, fechaFin, mataderoId } = filtros;
    
    try {
      return await DetalleBeneficio.findAll({
        attributes: [
          // Extraer año y semana del año
          [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('"reporte"."fecha_reporte"')), 'semana'],
          [sequelize.literal('"subespecie"."nombre"'), 'especie'],
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalCanales'],
          [sequelize.fn('SUM', sequelize.col('peso_canal')), 'totalPeso'],
          [sequelize.fn('SUM', sequelize.literal('cantidad * precio_canal')), 'beneficioTotal']
        ],
        include: [{
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          required: true,
          where: {
            fecha_reporte: {
              [Op.between]: [fechaInicio || '1970-01-01', fechaFin || new Date()]
            },
            ...(mataderoId && { matadero_id: mataderoId })
          }
        }, {
          model: Subespecie,
          as: 'subespecie',
          attributes: [],
          required: true
        }],
        group: [
          sequelize.fn('DATE_TRUNC', 'week', sequelize.col('"reporte"."fecha_reporte"')),
          'subespecie.nombre'
        ],
        order: [[sequelize.literal('semana'), 'ASC']],
        raw: true
      });
    } catch (error) {
      throw new Error(`Error en reporteSemanal: ${error.message}`);
    }
  }






  static async generarReporteCompletoExcel(filtros) {
    const data = await this.estadisticasCompletas(filtros);
    const workbook = new ExcelJS.Workbook();
    
    // Hoja de especies
    const wsEspecies = workbook.addWorksheet('Especies');
    wsEspecies.columns = [
      { header: 'Especie', key: 'especie' },
      { header: 'Total Canales', key: 'canales' },
      { header: 'Peso Total (kg)', key: 'peso' }
    ];
    data.porEspecie.forEach(e => wsEspecies.addRow(e));
  
    // Hoja de incidentes
    const wsIncidentes = workbook.addWorksheet('Incidentes');
    wsIncidentes.columns = [
      { header: 'Tipo Incidente', key: 'tipo' },
      { header: 'Total Ocurrencias', key: 'total' },
      { header: 'Gravedad Promedio', key: 'gravedad' }
    ];
    data.porTipoIncidente.forEach(i => wsIncidentes.addRow(i));
  
    return workbook;
  }


  //por estados 
  static async  generarExcel  (res, datos)  {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Beneficios por Estado');

    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } },
        border: { top: { style: 'thin', color: { argb: '000000' } }, bottom: { style: 'thin', color: { argb: '000000' } } },
        alignment: { vertical: 'middle', horizontal: 'center' }
    };

    worksheet.columns = [
        { header: 'Estado', key: 'estado', width: 25, style: headerStyle },
        { header: 'Total Animales', key: 'totalAnimales', width: 18, style: { numFmt: '#,##0' } },
        { header: 'Peso Total (Kg)', key: 'totalKg', width: 18, style: { numFmt: '#,##0' } },
        { header: 'Beneficio Total', key: 'totalBeneficio', width: 20, style: { numFmt: '"$"#,##0.00;[Red]\-"$"#,##0.00' } }
    ];

    datos.forEach((item) => {
        worksheet.addRow({
            estado: item.estado || 'No especificado',
            totalAnimales: item.totalAnimales,
            totalKg: item.totalKg,
            totalBeneficio: item.totalBeneficio
        });
    });

    worksheet.getRow(1).eachCell((cell) => cell.style = headerStyle);
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=beneficios-por-estado.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
};


static async obtenerDatos() {
  return await Origen.findAll({
      attributes: [
          'estado',
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('reportes->detallesBeneficio.cantidad')), 0), 'totalAnimales'],
          [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('reportes->detallesBeneficio.peso_canal')), 0), 'totalKg'],
          [sequelize.literal(`COALESCE(SUM("reportes->detallesBeneficio"."peso_canal" * "reportes->detallesBeneficio"."precio_canal"), 0)`), 'totalBeneficio']
      ],
      include: [{
          model: ReporteDiario,
          as: 'reportes',
          attributes: [],
          required: false,
          include: [{
              model: DetalleBeneficio,
              as: 'detallesBeneficio',
              attributes: [],
              required: false
          }]
      }],
      group: ['Origen.estado'],
      order: [['estado', 'ASC']],
      raw: true
  });
};

//REPORTE CONSOLIDADO 



static async generarReporteConsolidado(filtros = {}) {
  const { fechaInicio, fechaFin, mataderoId } = filtros;
  
  try {
    // Validación de fechas
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    const fechaInicioFmt = parseDate(fechaInicio) || '1970-01-01';
    const fechaFinFmt = parseDate(fechaFin) || new Date().toISOString().split('T')[0];

    // 1. Obtener datos de orígenes con subespecie
    const origenes = await Origen.findAll({
      attributes: [
        'estado',
        [sequelize.fn('SUM', sequelize.col('cantidad_hembras')), 'total_hembras'],
        [sequelize.fn('SUM', sequelize.col('cantidad_machos')), 'total_machos'],
        [sequelize.fn('SUM', sequelize.col('cantidad_animales')), 'total_animales'],
        [sequelize.col('reporte.matadero.nombre'), 'matadero'],
        [sequelize.col('reporte.matadero.ubicacion'), 'entidad'],
        [sequelize.col('especie.nombre'), 'especie_nombre'],
        [sequelize.col('subespecie.nombre'), 'subespecie_nombre'],
        [sequelize.col('categoria.nombre'), 'categoria_nombre'],
        [sequelize.col('claseSexual.nombre'), 'clase_sexual_nombre']
      ],
      include: [
        {
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          where: {
            fecha_actividad: { [Op.between]: [fechaInicioFmt, fechaFinFmt] },
            ...(mataderoId && { matadero_id: mataderoId })
          },
          include: [{
            model: Matadero,
            as: 'matadero',
            attributes: []
          }]
        },
        {
          model: Especie,
          as: 'especie',
          attributes: []
        },
        {
          model: Subespecie, // Incluimos la subespecie
          as: 'subespecie',
          attributes: []
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: []
        },
        {
          model: ClaseSexual,
          as: 'claseSexual',
          attributes: []
        }
      ],
      group: [
        'Origen.estado',
        'reporte.matadero.nombre',
        'reporte.matadero.ubicacion',
        'especie.nombre',
        'subespecie.nombre',
        'categoria.nombre',
        'claseSexual.nombre' // Agrupar por clase sexual
      ],
      raw: true
    });


    // 2. Obtener datos de beneficios con subespecie
    const beneficios = await DetalleBeneficio.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'cantidad_total'],
        [sequelize.fn('SUM', sequelize.col('peso_canal')), 'peso_total'],
        [sequelize.fn('SUM', sequelize.literal('"DetalleBeneficio"."peso_canal" * "DetalleBeneficio"."precio_canal"')), 'beneficio_total'],
        [sequelize.col('reporte.matadero.nombre'), 'matadero'],
        [sequelize.col('reporte.matadero.ubicacion'), 'entidad'],
        [sequelize.col('subespecie.especie.nombre'), 'especie_nombre'],
        [sequelize.col('subespecie.nombre'), 'subespecie_nombre'],
        [sequelize.col('claseSexual.nombre'), 'clase_sexual_nombre'],
        [sequelize.col('categoria.nombre'), 'categoria_nombre']
      ],
      include: [
        {
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          required: true,
          where: {
            fecha_actividad: {
              [Op.between]: [fechaInicioFmt, fechaFinFmt]
            },
            ...(mataderoId && { matadero_id: mataderoId })
          },
          include: [{
            model: Matadero,
            as: 'matadero',
            attributes: []
          }]
        },
        {
          model: Subespecie,
          as: 'subespecie',
          attributes: [],
          include: [{
            model: Especie,
            as: 'especie',
            attributes: []
          }]
        },
        {
          model: ClaseSexual,
          as: 'claseSexual',
          attributes: []
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: []
        }
      ],
      group: [
        'reporte.matadero.nombre',
        'reporte.matadero.ubicacion',
        'subespecie.especie.nombre',
        'subespecie.nombre',   // Agrupamos por subespecie
        'claseSexual.nombre',
        'categoria.nombre',
        'subespecie.nombre',   // Agrupar por subespecie
        'claseSexual.nombre'   // Agrupar por clase sexual
      ],
      raw: true
    });

    // 3. Procesamiento combinado con solución para duplicados
    const reporteData = {};

    // Función para crear clave única
    const createKey = (item) => {
      return [
        item.matadero,
        item.entidad,
        item.especie_nombre,
        item.subespecie_nombre || 'N/A',
        item.estado || 'No especificado',
        item.categoria_nombre || 'Standard',
        item.clase_sexual_nombre || 'N/A'
      ].join('-');
    };
    // Procesar orígenes
    origenes.forEach(item => {
      const key = createKey(item);
      
      if (!reporteData[key]) {
        reporteData[key] = {
          matadero: item.matadero,
          entidad: item.entidad,
          especie: item.especie_nombre,
          subespecie: item.subespecie_nombre || 'N/A',
          clase_sexual: item.clase_sexual_nombre || 'N/A',
          origen: item.estado,
          categoria: item.categoria_nombre || 'Standard',
          total_animales: 0,
          hembras: 0,
          machos: 0,
          peso_hembras: 0,
          peso_machos: 0,
          peso_total: 0,
          cantidad_canales: 0,
          beneficio: 0
        };
      }
      reporteData[key].total_animales += parseInt(item.total_animales) || 0;
      reporteData[key].hembras += parseInt(item.total_hembras) || 0;
      reporteData[key].machos += parseInt(item.total_machos) || 0;
    });

    // Procesar beneficios - usar mismo origen cuando exista
    beneficios.forEach(item => {
      // Primero intentar con origen existente
      let key = Object.keys(reporteData).find(k => 
        k.startsWith(`${item.matadero}-${item.entidad}-${item.especie_nombre}-${item.subespecie_nombre || 'N/A'}`)
      );

      // Si no encuentra, crear con "No especificado"
      if (!key) {
        key = createKey({
          ...item,
          estado: 'No especificado'
        }, true);
      }
      if (!reporteData[key]) {
        reporteData[key] = {
          matadero: item.matadero,
          entidad: item.entidad,
          especie: item.especie_nombre,
          subespecie: item.subespecie_nombre || 'N/A',
          clase_sexual: item.clase_sexual_nombre || 'N/A',
          origen: 'No especificado',
          categoria: item.categoria_nombre || 'Standard',
          total_animales: 0,
          hembras: 0,
          machos: 0,
          peso_hembras: 0,
          peso_machos: 0,
          peso_total: 0,
          cantidad_canales: 0,
          beneficio: 0
        };
      }
      const esHembra = reporteData[key].hembras > 0;
      const esMachos = reporteData[key].machos > 0;
      if (esHembra) {
        reporteData[key].peso_hembras += parseFloat(item.peso_total) || 0;
      } 
      // Si hay machos reportados, asignar el peso a peso_machos
      else if (esMachos) {
        reporteData[key].peso_machos += parseFloat(item.peso_total) || 0;
      }
      // Si no hay información de sexo, usar la clase sexual del beneficio
      else {
        const esHembraBeneficio = item.clase_sexual_nombre?.toLowerCase().includes('hembra');
        if (esHembraBeneficio) {
          reporteData[key].peso_hembras += parseFloat(item.peso_total) || 0;
        } else {
          reporteData[key].peso_machos += parseFloat(item.peso_total) || 0;
        }
      }
      reporteData[key].peso_total += parseFloat(item.peso_total) || 0;
      reporteData[key].cantidad_canales += parseInt(item.cantidad_total) || 0;
      reporteData[key].beneficio += parseFloat(item.beneficio_total) || 0;
    });

    return Object.values(reporteData).map(item => {
      const peso_total = item.peso_hembras + item.peso_machos;
      return {
        ...item,
        peso_total,
        beneficio_por_kg: peso_total ? item.beneficio / peso_total : 0,
        beneficio_por_canal: item.cantidad_canales ? item.beneficio / item.cantidad_canales : 0
      };
    });
  } catch (error) {
    console.error('Error en generarReporteConsolidado:', error);
    throw new Error(`Error generando reporte: ${error.message}`);
  }
}



static async exportarReporteConsolidado(filtros, res) {
  try {
    const fechaInicio = filtros.fechaInicio || '1970-01-01';
    const fechaFin = filtros.fechaFin || new Date().toISOString().split('T')[0];
    
    const fechaInicioFmt = new Date(fechaInicio).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const fechaFinFmt = new Date(fechaFin).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const data = await this.generarReporteConsolidado({
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      mataderoId: filtros.mataderoId
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Consolidado');

    // 1. Título principal con fechas
    worksheet.mergeCells('A1:N1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `REPORTE CONSOLIDADO DE ACTIVIDADES\nDel ${fechaInicioFmt} al ${fechaFinFmt}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // 2. Encabezados de columna CORREGIDOS
    const headerRow = worksheet.addRow([
      'Matadero', 
      'Ubicación', 
      'Especie',
      'Subespecie',
      'Origen',
      'Categoría',
      'Clase Sexual',
      'Total Animales',
      'Hembras',
      'Machos',
      'Peso Canal Hembras (kg)', 
      'Peso Canal Machos (kg)',   
      'Peso Total Canales (kg)',  
      'Beneficio Promedio por Canal ($)'  
    ]);
    // Aplicar estilo a los encabezados
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C3E50' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Definir índices de columnas numéricas (1-based)
    const numericColumns = [8, 9, 10, 11, 12, 13, 14];
    const currencyColumn = 14; 

    // 3. Agregar datos
    if (data.length > 0) {
      // Procesar cada fila de datos
      data.forEach(item => {
        // Convertir ubicación a texto si es objeto
        let ubicacion = item.entidad;
        if (ubicacion && typeof ubicacion === 'object') {
          ubicacion = `${ubicacion.estado || 'N/A'}, ${ubicacion.municipio || 'N/A'}`;
        }
        
        const beneficioPromedio = item.cantidad_canales > 0 
        ? item.beneficio / item.cantidad_canales 
        : 0;
        // Crear fila con los datos CORREGIDOS
        const row = worksheet.addRow([
          item.matadero || 'N/A',
          ubicacion || 'N/A',
          item.especie || 'N/A',
          item.subespecie || 'N/A',
          item.origen || 'N/A',
          item.categoria || 'N/A',
          item.clase_sexual || 'N/A',
          item.total_animales || 0,
          item.hembras || 0,
          item.machos || 0,
          item.peso_hembras || 0, 
          item.peso_machos || 0, 
          item.peso_total || 0,   
          beneficioPromedio     
        ]);
        
        // Aplicar formatos numéricos CORREGIDOS
        numericColumns.forEach(colIndex => {
          const cell = row.getCell(colIndex);
          if (colIndex === currencyColumn) {
            cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
          } else {
            cell.numFmt = '#,##0';
          }
        });
      });
      
      // 4. Agregar totales generales CORREGIDOS
      const totals = {
        total_animales: 0,
        hembras: 0,
        machos: 0,
        peso_hembras: 0,
        peso_machos: 0,
        peso_total: 0,
        beneficio: 0,
        cantidad_canales: 0  
      };
      
      
      data.forEach(item => {
        totals.total_animales += item.total_animales || 0;
        totals.hembras += item.hembras || 0;
        totals.machos += item.machos || 0;
        totals.peso_hembras += item.peso_hembras || 0;
        totals.peso_machos += item.peso_machos || 0;
        totals.peso_total += item.peso_total || 0; 
        totals.beneficio += item.beneficio || 0;   
        totals.cantidad_canales += item.cantidad_canales || 0;  
      });
      const beneficioPromedioTotal = totals.cantidad_canales > 0 
      ? totals.beneficio / totals.cantidad_canales 
      : 0;
    

      const totalRow = worksheet.addRow([
        'TOTAL GENERAL',
        '', 
        '', 
        '', 
        '', 
        '', 
        '', 
        totals.total_animales,
        totals.hembras,
        totals.machos,
        totals.peso_hembras,
        totals.peso_machos,
        totals.peso_total,    
        beneficioPromedioTotal     
      ]);
      
      // Estilo para fila de totales
      totalRow.eachCell(cell => {
        if (cell.value) {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D3D3D3' }
          };
        }
      });
      
      // Aplicar formato numérico a totales CORREGIDO
      numericColumns.forEach(colIndex => {
        const cell = totalRow.getCell(colIndex);
        if (colIndex === currencyColumn) {
          cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
        } else {
          cell.numFmt = '#,##0';
        }
      });
    } else {
      const emptyRow = worksheet.addRow(['No se encontraron datos para el período seleccionado']);
      worksheet.mergeCells(`A${emptyRow.number}:N${emptyRow.number}`);
      emptyRow.getCell(1).alignment = { horizontal: 'center' };
    }

    // 5. Ajustar automáticamente el ancho de las columnas
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellValue = cell.value ? cell.value.toString() : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // 6. Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = `reporte_consolidado_${fechaInicio.replace(/-/g, '')}_${fechaFin.replace(/-/g, '')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error en exportarReporteConsolidado:', error);
    res.status(500).json({ 
      error: 'Error al generar el reporte',
      details: error.message
    });
  }
}



//Estadisticos que solicito el tecnico d ela carne 


// Servicio para generar el reporte estadístico por estado y especie
static async generarReporteEstadisticoFuncional(filtros = {}) {
  const { fechaInicio, fechaFin, especieId } = filtros;
  
  try {
    // Validación de fechas
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    const fechaInicioFmt = parseDate(fechaInicio) || '1970-01-01';
    const fechaFinFmt = parseDate(fechaFin) || new Date().toISOString().split('T')[0];

    // 1. Obtener datos de orígenes por estado y especie
    const origenes = await Origen.findAll({
      attributes: [
        'estado',
        [sequelize.fn('SUM', sequelize.col('cantidad_hembras')), 'total_hembras'],
        [sequelize.fn('SUM', sequelize.col('cantidad_machos')), 'total_machos'],
        [sequelize.fn('SUM', sequelize.col('cantidad_animales')), 'total_animales'],
        [sequelize.col('especie.nombre'), 'especie_nombre'],
        [sequelize.col('subespecie.nombre'), 'subespecie_nombre'],
        [sequelize.col('claseSexual.nombre'), 'clase_sexual_nombre']
      ],
      include: [
        {
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          where: {
            fecha_actividad: { [Op.between]: [fechaInicioFmt, fechaFinFmt] }
          }
        },
        {
          model: Especie,
          as: 'especie',
          attributes: []
        },
        {
          model: Subespecie,
          as: 'subespecie',
          attributes: []
        },
        {
          model: ClaseSexual,
          as: 'claseSexual',
          attributes: []
        }
      ],
      group: [
        'Origen.estado',
        'especie.id',
        'subespecie.id',
        'claseSexual.id'
      ],
      raw: true
    });

    // 2. Obtener datos de beneficios por estado y especie
    const beneficios = await DetalleBeneficio.findAll({
      attributes: [
        [sequelize.col('reporte.origenes.estado'), 'estado'],
        [sequelize.col('subespecie.especie.nombre'), 'especie_nombre'],
        [sequelize.col('subespecie.nombre'), 'subespecie_nombre'],
        [sequelize.col('claseSexual.nombre'), 'clase_sexual_nombre'],
        [sequelize.fn('SUM', sequelize.col('DetalleBeneficio.cantidad')), 'cantidad_total'],
        [sequelize.fn('SUM', sequelize.col('DetalleBeneficio.peso_canal')), 'peso_total'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.peso_canal')), 'peso_promedio'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.precio_pie')), 'precio_promedio_pie'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.precio_canal')), 'precio_promedio_canal']
      ],
      include: [
        {
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          required: true,
          where: {
            fecha_actividad: { [Op.between]: [fechaInicioFmt, fechaFinFmt] }
          },
          include: [{
            model: Origen,
            as: 'origenes',
            attributes: [],
            required: true
          }]
        },
        {
          model: Subespecie,
          as: 'subespecie',
          attributes: [],
          include: [{
            model: Especie,
            as: 'especie',
            attributes: []
          }]
        },
        {
          model: ClaseSexual,
          as: 'claseSexual',
          attributes: []
        }
      ],
      group: [
        'reporte.origenes.estado',
        'subespecie.especie.id',
        'subespecie.id',
        'claseSexual.id'
      ],
      raw: true
    });

    // 3. Combinar datos de orígenes y beneficios
    const reporteData = {};
    
    // Procesar orígenes
    origenes.forEach(item => {
      const key = `${item.estado}-${item.especie_nombre}`;
      
      if (!reporteData[key]) {
        reporteData[key] = {
          estado: item.estado,
          especie: item.especie_nombre,
          total_general: 0,
          total_vacunos: 0,
          hembras: 0,
          peso_prom_hembras: 0,
          precio_prom_hembras: 0,
          machos: 0,
          peso_prom_machos: 0,
          precio_prom_machos: 0,
          total_bufalos: 0,
          peso_prom_hembras_bufalinas: 0,
          precio_prom_hembras_bufalinas: 0,
          peso_prom_machos_bufalinos: 0,
          precio_prom_machos_bufalinos: 0,
          peso_total: 0,
          peso_promedio: 0,
          precio_pie_promedio: 0,
          precio_canal_promedio: 0
        };
      }
      
      // Clasificar por especie (Vacuno o Bufalo)
      if (item.especie_nombre.toLowerCase().includes('vacuno')) {
        reporteData[key].total_vacunos = parseInt(item.total_animales) || 0;
        reporteData[key].hembras = parseInt(item.total_hembras) || 0;
        reporteData[key].machos = parseInt(item.total_machos) || 0;
      } else if (item.especie_nombre.toLowerCase().includes('bufalo')) {
        reporteData[key].total_bufalos = parseInt(item.total_animales) || 0;
      }
    });
    
    // Procesar beneficios
    beneficios.forEach(item => {
      const key = `${item.estado}-${item.especie_nombre}`;
      
      if (!reporteData[key]) {
        reporteData[key] = {
          estado: item.estado,
          especie: item.especie_nombre,
          // ... inicializar todas las propiedades
        };
      }
      
      // Actualizar datos de beneficios
      reporteData[key].peso_total = parseFloat(item.peso_total) || 0;
      reporteData[key].peso_promedio = parseFloat(item.peso_promedio) || 0;
      reporteData[key].precio_pie_promedio = parseFloat(item.precio_promedio_pie) || 0;
      reporteData[key].precio_canal_promedio = parseFloat(item.precio_promedio_canal) || 0;
      
      // Actualizar promedios específicos por especie y sexo
      if (item.clase_sexual_nombre.toLowerCase().includes('hembra')) {
        if (item.especie_nombre.toLowerCase().includes('vacuno')) {
          reporteData[key].peso_prom_hembras = parseFloat(item.peso_promedio) || 0;
          reporteData[key].precio_prom_hembras = parseFloat(item.precio_promedio_pie) || 0;
        } else if (item.especie_nombre.toLowerCase().includes('bufalo')) {
          reporteData[key].peso_prom_hembras_bufalinas = parseFloat(item.peso_promedio) || 0;
          reporteData[key].precio_prom_hembras_bufalinas = parseFloat(item.precio_promedio_pie) || 0;
        }
      } else if (item.clase_sexual_nombre.toLowerCase().includes('macho')) {
        if (item.especie_nombre.toLowerCase().includes('vacuno')) {
          reporteData[key].peso_prom_machos = parseFloat(item.peso_promedio) || 0;
          reporteData[key].precio_prom_machos = parseFloat(item.precio_promedio_pie) || 0;
        } else if (item.especie_nombre.toLowerCase().includes('bufalo')) {
          reporteData[key].peso_prom_machos_bufalinos = parseFloat(item.peso_promedio) || 0;
          reporteData[key].precio_prom_machos_bufalinos = parseFloat(item.precio_promedio_pie) || 0;
        }
      }
    });
    
    // 4. Calcular totales generales por estado
    const estados = [...new Set(Object.values(reporteData).map(item => item.estado))];
    const reporteFinal = estados.map(estado => {
      const itemsEstado = Object.values(reporteData).filter(item => item.estado === estado);
      
      // Calcular promedios ponderados
      const totalPeso = itemsEstado.reduce((sum, item) => sum + item.peso_total, 0);
      const totalAnimales = itemsEstado.reduce((sum, item) => sum + item.total_general, 0);
      
      return {
        estado,
        especie: 'Todas',
        total_general: totalAnimales,
        total_vacunos: itemsEstado.reduce((sum, item) => sum + item.total_vacunos, 0),
        hembras: itemsEstado.reduce((sum, item) => sum + item.hembras, 0),
        peso_prom_hembras: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.peso_prom_hembras, 0) / itemsEstado.length : 0,
        precio_prom_hembras: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_prom_hembras, 0) / itemsEstado.length : 0,
        machos: itemsEstado.reduce((sum, item) => sum + item.machos, 0),
        peso_prom_machos: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.peso_prom_machos, 0) / itemsEstado.length : 0,
        precio_prom_machos: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_prom_machos, 0) / itemsEstado.length : 0,
        total_bufalos: itemsEstado.reduce((sum, item) => sum + item.total_bufalos, 0),
        peso_prom_hembras_bufalinas: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.peso_prom_hembras_bufalinas, 0) / itemsEstado.length : 0,
        precio_prom_hembras_bufalinas: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_prom_hembras_bufalinas, 0) / itemsEstado.length : 0,
        peso_prom_machos_bufalinos: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.peso_prom_machos_bufalinos, 0) / itemsEstado.length : 0,
        precio_prom_machos_bufalinos: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_prom_machos_bufalinos, 0) / itemsEstado.length : 0,
        peso_total: totalPeso,
        peso_promedio: totalAnimales ? totalPeso / totalAnimales : 0,
        precio_pie_promedio: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_pie_promedio, 0) / itemsEstado.length : 0,
        precio_canal_promedio: itemsEstado.length ? itemsEstado.reduce((sum, item) => sum + item.precio_canal_promedio, 0) / itemsEstado.length : 0
      };
    });

    // 5. Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estadísticas');

    // Definir encabezados
    const headers = [
      'Estados',
      'Especie',
      'Total General',
      'Total Vacunos',
      'Hembras',
      'Peso Promedio Hembras Vacunas',
      'Precio Promedio Hembras Vacunas',
      'Machos',
      'Peso Promedio Machos Vacunas',
      'Precio Promedio Machos Vacunas',
      'Total Bufalos',
      'Peso Promedio Hembras Bufalinas',
      'Precio Promedio Hembras Bufalinas',
      'Peso Promedio Machos Bufalinos',
      'Precio Promedio Machos Bufalinos',
      'Peso Total en KGR',
      'Peso Promedio',
      'Precio en Pie Total (Promedio)',
      'Precio en Canal Total (Promedio)'
    ];
    
    worksheet.addRow(headers);
    
    // Aplicar estilos a los encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C3E50' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Llenar con datos
    reporteFinal.forEach(item => {
      const row = worksheet.addRow([
        item.estado,
        item.especie,
        item.total_general,
        item.total_vacunos,
        item.hembras,
        item.peso_prom_hembras,
        item.precio_prom_hembras,
        item.machos,
        item.peso_prom_machos,
        item.precio_prom_machos,
        item.total_bufalos,
        item.peso_prom_hembras_bufalinas,
        item.precio_prom_hembras_bufalinas,
        item.peso_prom_machos_bufalinos,
        item.precio_prom_machos_bufalinos,
        item.peso_total,
        item.peso_promedio,
        item.precio_pie_promedio,
        item.precio_canal_promedio
      ]);
      
      // Aplicar formato numérico
      const numericColumns = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      numericColumns.forEach(colIndex => {
        const cell = row.getCell(colIndex);
        if (colIndex >= 6) {
          cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
        } else {
          cell.numFmt = '#,##0.00';
        }
      });
    });
    
    // Ajustar automáticamente el ancho de columnas
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellValue = cell.value ? cell.value.toString() : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = maxLength < 10 ? 15 : maxLength + 5;
    });
    
    return workbook;
    
  } catch (error) {
    console.error('Error en generarReporteEstadistico:', error);
    throw new Error(`Error generando reporte estadístico: ${error.message}`);
  }
}




static async generarReporteEstadistico(filtros = {}) {
  const { fechaInicio, fechaFin, especieId } = filtros;
  
  try {
    // 1. Validación de fechas mejorada
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    };

    const fechaInicioFmt = formatDate(fechaInicio) || '1970-01-01';
    const fechaFinFmt = formatDate(fechaFin) || new Date().toISOString().split('T')[0];

    // 2. Consulta de orígenes (optimizada)
    const origenes = await Origen.findAll({
      attributes: [
        'estado',
        [sequelize.fn('SUM', sequelize.col('cantidad_hembras')), 'total_hembras'],
        [sequelize.fn('SUM', sequelize.col('cantidad_machos')), 'total_machos'],
        [sequelize.fn('SUM', sequelize.literal('"cantidad_hembras" + "cantidad_machos"')), 'total_animales'],
        [sequelize.col('especie.nombre'), 'especie_nombre']
      ],
      include: [
        {
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          where: { fecha_actividad: { [Op.between]: [fechaInicioFmt, fechaFinFmt] } }
        },
        {
          model: Especie,
          as: 'especie',
          attributes: [],
          where: especieId ? { id: especieId } : {}
        }
      ],
      group: ['Origen.estado', 'especie.nombre'],
      raw: true
    });

    // 3. Consulta de beneficios CORREGIDA y OPTIMIZADA
    const beneficios = await DetalleBeneficio.findAll({
      attributes: [
        // Usar COALESCE para evitar estados nulos
        [sequelize.fn('COALESCE', sequelize.col('reporte.origenes.estado'), 'Sin Estado'), 'estado'],
        [sequelize.col('subespecie.especie.nombre'), 'especie_nombre'],
        [sequelize.fn('SUM', sequelize.col('DetalleBeneficio.cantidad')), 'cantidad_total'],
        [sequelize.fn('SUM', sequelize.col('DetalleBeneficio.peso_canal')), 'peso_total'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.peso_canal')), 'peso_promedio'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.precio_pie')), 'precio_promedio_pie'],
        [sequelize.fn('AVG', sequelize.col('DetalleBeneficio.precio_canal')), 'precio_promedio_canal'],
        [sequelize.col('claseSexual.nombre'), 'clase_sexual_nombre']
      ],
      include: [
        {   
          model: ReporteDiario,
          as: 'reporte',
          attributes: [],
          required: true,
          where: { fecha_actividad: { [Op.between]: [fechaInicioFmt, fechaFinFmt] } },
          include: [{
            model: Origen,
            as: 'origenes',
            attributes: [],
            required: false
          }]
        },
        {
          model: Subespecie,
          as: 'subespecie',
          attributes: [],
          required: true,
          include: [{
            model: Especie,
            as: 'especie',
            attributes: [],
            where: especieId ? { id: especieId } : {}
          }]
        },
        {
          model: ClaseSexual,
          as: 'claseSexual',
          attributes: [],
          required: true
        }
      ],
      group: [
        'reporte.origenes.estado',
        'subespecie.especie.nombre',
        'claseSexual.nombre'
      ],
      raw: true
    });

    console.log('Beneficios encontrados:', beneficios);

    // 4. Estructura para almacenar datos consolidados
    const reporteData = {};
    
    // Procesar orígenes
    origenes.forEach(item => {
      const key = `${item.estado || 'Sin Estado'}-${item.especie_nombre}`;
      
      if (!reporteData[key]) {
        reporteData[key] = crearEstructuraBase(item.estado, item.especie_nombre);
      }
      
      procesarOrigen(reporteData[key], item);
    });
    
    // Procesar beneficios
    beneficios.forEach(item => {
      const key = `${item.estado || 'Sin Estado'}-${item.especie_nombre}`;
      
      if (!reporteData[key]) {
        reporteData[key] = crearEstructuraBase(item.estado, item.especie_nombre);
      }
      
      procesarBeneficio(reporteData[key], item);
    });

    // 5. Convertir a array y filtrar filas sin datos
    const reporteFinal = Object.values(reporteData)
      .filter(item => item.total_general > 0 || item.peso_total > 0)
      .map(item => ({
        estado: item.estado,
        especie: item.especie,
        total_general: item.total_general || 0,
        total_vacunos: item.total_vacunos || 0,
        hembras: item.hembras || 0,
        peso_prom_hembras: item.peso_prom_hembras || 0,
        precio_prom_hembras: item.precio_prom_hembras || 0,
        machos: item.machos || 0,
        peso_prom_machos: item.peso_prom_machos || 0,
        precio_prom_machos: item.precio_prom_machos || 0,
        total_bufalos: item.total_bufalos || 0,
        peso_prom_hembras_bufalinas: item.peso_prom_hembras_bufalinas || 0,
        precio_prom_hembras_bufalinas: item.precio_prom_hembras_bufalinas || 0,
        peso_prom_machos_bufalinos: item.peso_prom_machos_bufalinos || 0,
        precio_prom_machos_bufalinos: item.precio_prom_machos_bufalinos || 0,
        peso_total: item.peso_total || 0,
        peso_promedio: item.peso_promedio || 0,
        precio_pie_promedio: item.precio_pie_promedio || 0,
        precio_canal_promedio: item.precio_canal_promedio || 0
      }));

    console.log('Reporte final:', reporteFinal);
    // 5. Crear el libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estadísticas');

    // Definir encabezados
    const headers = [
      'Estados',
      'Especie',
      'Total General',
      'Total Vacunos',
      'Hembras',
      'Peso Promedio Hembras Vacunas',
      'Precio Promedio Hembras Vacunas',
      'Machos',
      'Peso Promedio Machos Vacunas',
      'Precio Promedio Machos Vacunas',
      'Total Bufalos',
      'Peso Promedio Hembras Bufalinas',
      'Precio Promedio Hembras Bufalinas',
      'Peso Promedio Machos Bufalinos',
      'Precio Promedio Machos Bufalinos',
      'Peso Total en KGR',
      'Peso Promedio',
      'Precio en Pie Total (Promedio)',
      'Precio en Canal Total (Promedio)'
    ];
    
    worksheet.addRow(headers);
    
    // Aplicar estilos a los encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C3E50' }
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Llenar con datos
    reporteFinal.forEach(item => {
      const row = worksheet.addRow([
        item.estado,
        item.especie,
        item.total_general,
        item.total_vacunos,
        item.hembras,
        item.peso_prom_hembras,
        item.precio_prom_hembras,
        item.machos,
        item.peso_prom_machos,
        item.precio_prom_machos,
        item.total_bufalos,
        item.peso_prom_hembras_bufalinas,
        item.precio_prom_hembras_bufalinas,
        item.peso_prom_machos_bufalinos,
        item.precio_prom_machos_bufalinos,
        item.peso_total,
        item.peso_promedio,
        item.precio_pie_promedio,
        item.precio_canal_promedio
      ]);
      
      // Aplicar formato numérico
      const numericColumns = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
      numericColumns.forEach(colIndex => {
        const cell = row.getCell(colIndex);
        if (colIndex >= 6 && colIndex <= 18) {
          // Columnas de precio (6-18) con formato monetario
          cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
        } else {
          // Columnas de cantidad (2-5) con formato numérico
          cell.numFmt = '#,##0.00';
        }
      });
    });
    
    // Ajustar automáticamente el ancho de columnas
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const cellValue = cell.value ? cell.value.toString() : '';
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = maxLength < 10 ? 15 : maxLength + 5;
    });
    
    return workbook;
    
  } catch (error) {
    console.error('Error en generarReporteEstadistico:', error);
    throw new Error(`Error generando reporte estadístico: ${error.message}`);
  }
}





// Controlador para exportar el reporte
static async exportarReporteEstadistico(filtros, res) {
  try {
    const fechaInicio = filtros.fechaInicio || '1970-01-01';
    const fechaFin = filtros.fechaFin || new Date().toISOString().split('T')[0];
    
    // Generar el libro de Excel
    const workbook = await this.generarReporteEstadistico(filtros);
    
    // Configurar respuesta
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = `reporte_estadistico_${fechaInicio.replace(/-/g, '')}_${fechaFin.replace(/-/g, '')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error en exportarReporteEstadistico:', error);
    res.status(500).json({ 
      error: 'Error al generar el reporte estadístico',
      details: error.message
    });
  }
}



// Estadistica por estado semanas 
// En tu controlador del backend (Node.js/Express)
static exportarEstadisticasExcelEstados = async (filtros, res) => {
  try {
    const { fechaInicio, fechaFin } = filtros;  
    
    // 1. Obtener datos de la base de datos
    const datos = await this.beneficiosPorEstado({ fechaInicio, fechaFin });
    
    // 2. Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estadísticas');
    
    // 3. Configurar columnas con formatos numéricos
    worksheet.columns = [
      { header: 'Estado', key: 'estado', width: 30 },
      { 
        header: 'Total Animales', 
        key: 'totalAnimales', 
        width: 15,
        style: { numFmt: '#,##0' } 
      },
      { 
        header: 'Peso Total (kg)', 
        key: 'totalKg', 
        width: 15,
        style: { numFmt: '#,##0.00' } 
      },
      { 
        header: 'Beneficio Total', 
        key: 'totalBeneficio', 
        width: 20,
        style: { numFmt: '"$"#,##0.00' }  
      }
    ];
    
    // 4. Agregar datos
    datos.forEach(item => {
      // Asegurar que los valores sean numéricos
      worksheet.addRow({
        estado: item.estado,
        totalAnimales: Number(item.totalAnimales),
        totalKg: Number(item.totalKg),
        totalBeneficio: Number(item.totalBeneficio)
      });
    });
    
    // 5. Agregar fila de totales
    const totalRow = worksheet.addRow({
      estado: 'TOTAL',
      totalAnimales: datos.reduce((sum, item) => sum + Number(item.totalAnimales), 0),
      totalKg: datos.reduce((sum, item) => sum + Number(item.totalKg), 0),
      totalBeneficio: datos.reduce((sum, item) => sum + Number(item.totalBeneficio), 0)
    });
    
    // 6. Estilo para fila de totales
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' } 
    };
    
    // 7. Configurar respuesta
    const hoy = new Date();
    const offset = hoy.getTimezoneOffset();
    const hoyLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
    const fechaStr = hoyLocal.toISOString().split('T')[0];
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=estadisticas_${fechaStr}.xlsx`
    );
    
    // 8. Enviar archivo
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ error: 'Error al exportar datos' });
  }
};













}




function crearEstructuraBase(estado, especie) {
  return {
    estado: estado || 'Sin Estado',
    especie: especie || 'Sin Especie',
    total_general: 0,
    total_vacunos: 0,
    hembras: 0,
    peso_prom_hembras: 0,
    precio_prom_hembras: 0,
    machos: 0,
    peso_prom_machos: 0,
    precio_prom_machos: 0,
    total_bufalos: 0,
    peso_prom_hembras_bufalinas: 0,
    precio_prom_hembras_bufalinas: 0,
    peso_prom_machos_bufalinos: 0,
    precio_prom_machos_bufalinos: 0,
    peso_total: 0,
    peso_promedio: 0,
    precio_pie_promedio: 0,
    precio_canal_promedio: 0
  };
}

function procesarOrigen(reporteItem, origenItem) {
  if (!origenItem.especie_nombre) return;
  
  const especie = origenItem.especie_nombre.toLowerCase();
  const total = Number(origenItem.total_animales) || 0;
  const hembras = Number(origenItem.total_hembras) || 0;
  const machos = Number(origenItem.total_machos) || 0;
  
  reporteItem.total_general += total;
  
  if (especie.includes('vacuno') || especie.includes('bovino')) {
    reporteItem.total_vacunos += total;
    reporteItem.hembras += hembras;
    reporteItem.machos += machos;
  } else if (especie.includes('bufalo')) {
    reporteItem.total_bufalos += total;
  }
}

function procesarBeneficio(reporteItem, beneficioItem) {
  // Sumar pesos totales
  reporteItem.peso_total += Number(beneficioItem.peso_total) || 0;
  
  // Actualizar promedios generales
  reporteItem.peso_promedio = Number(beneficioItem.peso_promedio) || 0;
  reporteItem.precio_pie_promedio = Number(beneficioItem.precio_promedio_pie) || 0;
  reporteItem.precio_canal_promedio = Number(beneficioItem.precio_promedio_canal) || 0;
  
  // Procesar por sexo y especie
  if (!beneficioItem.clase_sexual_nombre || !beneficioItem.especie_nombre) return;
  
  const especie = beneficioItem.especie_nombre.toLowerCase();
  const sexo = beneficioItem.clase_sexual_nombre.toLowerCase();
  const pesoPromedio = Number(beneficioItem.peso_promedio) || 0;
  const precioPie = Number(beneficioItem.precio_promedio_pie) || 0;
  
  // Vacunos/Bovinos
  if (especie.includes('vacuno') || especie.includes('bovino')) {
    if (sexo.includes('hembra')) {
      reporteItem.peso_prom_hembras = pesoPromedio;
      reporteItem.precio_prom_hembras = precioPie;
    } else if (sexo.includes('macho')) {
      reporteItem.peso_prom_machos = pesoPromedio;
      reporteItem.precio_prom_machos = precioPie;
    }
  } 
  // Bufalos
  else if (especie.includes('bufalo')) {
    if (sexo.includes('hembra')) {
      reporteItem.peso_prom_hembras_bufalinas = pesoPromedio;
      reporteItem.precio_prom_hembras_bufalinas = precioPie;
    } else if (sexo.includes('macho')) {
      reporteItem.peso_prom_machos_bufalinos = pesoPromedio;
      reporteItem.precio_prom_machos_bufalinos = precioPie;
    }
  }
}

function generarExcel(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Estadísticas');

  // Definir encabezados
  const headers = [
    'Estados',
    'Especie',
    'Total General',
    'Total Vacunos',
    'Hembras',
    'Peso Promedio Hembras Vacunas',
    'Precio Promedio Hembras Vacunas',
    'Machos',
    'Peso Promedio Machos Vacunas',
    'Precio Promedio Machos Vacunas',
    'Total Bufalos',
    'Peso Promedio Hembras Bufalinas',
    'Precio Promedio Hembras Bufalinas',
    'Peso Promedio Machos Bufalinos',
    'Precio Promedio Machos Bufalinos',
    'Peso Total en KGR',
    'Peso Promedio',
    'Precio en Pie Total (Promedio)',
    'Precio en Canal Total (Promedio)'
  ];
  
  worksheet.addRow(headers);
  
  // Aplicar estilos a los encabezados
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C3E50' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  
  // Llenar con datos
  data.forEach(item => {
    const row = worksheet.addRow([
      item.estado,
      item.especie,
      item.total_general,
      item.total_vacunos,
      item.hembras,
      item.peso_prom_hembras,
      item.precio_prom_hembras,
      item.machos,
      item.peso_prom_machos,
      item.precio_prom_machos,
      item.total_bufalos,
      item.peso_prom_hembras_bufalinas,
      item.precio_prom_hembras_bufalinas,
      item.peso_prom_machos_bufalinos,
      item.precio_prom_machos_bufalinos,
      item.peso_total,
      item.peso_promedio,
      item.precio_pie_promedio,
      item.precio_canal_promedio
    ]);
  });
    
    // Aplicar formato numérico CORREGIDO
    row.eachCell((cell, colNumber) => {
      if (colNumber > 2) { // Todas las columnas después de "Especie"
        if (colNumber >= 6 && colNumber <= 18) {
          // Columnas de precio (6-18) con formato monetario
          cell.numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
        } else {
          // Columnas de cantidad (3-5, 11) con formato numérico
          cell.numFmt = '#,##0.00';
        }
      }
    });
  
  // Ajustar automáticamente el ancho de columnas
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellValue = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });
  
  return workbook;
} 




module.exports = EstadisticaService;


// EJEMPLO D EUSO 

/*
GET /api/estadisticas?tipo=periodo&fechaInicio=2023-01-01&fechaFin=2023-12-31
GET /api/estadisticas/excel?fechaInicio=2023-01-01&fechaFin=2023-12-31


*/


