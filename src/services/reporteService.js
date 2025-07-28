const { Op } = require('sequelize'); 
const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');
const { Matadero,User,DetalleBeneficio, Origen, Incidencia, Especie, Subespecie, ClaseSexual, Categoria, ReporteDiario} = require('../models');
const cloudinary = require('../utils/cloudinary');
const getNotificationService = require('./NotificactionServicesIntances');
class ReporteService {


/**
 * The function `crearReporteCompleto` creates a complete report by processing various data elements
 * within a transaction in JavaScript using Sequelize.
 * @param reporteData - The `reporteData` parameter seems to contain the data needed to create a
 * complete report. It likely includes information such as the report details, benefits, origins, and
 * incidences.
 * @param usuarioId - The `usuarioId` parameter in the `crearReporteCompleto` function is the ID of the
 * user who is creating the report. This ID is used to associate the report with the specific user in
 * the database.
 * @returns The `crearReporteCompleto` method returns the `reporte` object that was created during the
 * process of creating a complete report.
 */


static async crearReporteCompleto(reporteData, usuarioId) {
  const transaction = await sequelize.transaction();
  try {


    const reporte = await this.crearReporteBase(reporteData, usuarioId, transaction);
console.log("REPORT",reporte)
    // Procesar solo si hay actividad y los datos existen
    if (reporteData.hubo_actividad) {
      if (reporteData.beneficio) {
        const beneficios = Array.isArray(reporteData.beneficio) 
          ? reporteData.beneficio 
          : [reporteData.beneficio];
        for (const beneficio of beneficios) {
          await this.procesarBeneficio(beneficio, reporte.id, transaction);
        }
      }

      if (reporteData.origen) {
        const origenes = Array.isArray(reporteData.origen)
          ? reporteData.origen
          : [reporteData.origen];
        for (const origen of origenes) {
          await this.procesarOrigen(origen, reporte.id, transaction);
        }
      }

      if (reporteData.incidencias) {
        await this.procesarIncidencias(reporteData.incidencias, reporte.id, transaction);
      }
    }
    const user = await User.findByPk(usuarioId, {
      attributes: ['id', 'name', 'lastName', 'email'] // Solo los campos necesarios
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await transaction.commit();
    
    // Notificar con el objeto de usuario completo
    const notificationService = getNotificationService();
    await notificationService.notifyNewReport(reporte, user);
    
    return reporte;
  } catch (error) {
    await transaction.rollback();
    console.error("Error en crearReporteCompleto:", error);
    throw new Error(`Error creando reporte: ${error.message}`);
  }
}





static async crearReporteBase(data, usuarioId, transaction) {
  return await ReporteDiario.create({
    matadero_id: data.matadero_id,
    veterinario_id: usuarioId, // Asegurar que se guarde el ID del veterinario
    fecha_actividad: data.fecha_actividad,
    hubo_actividad: data.hubo_actividad,
    observaciones: data.observaciones || 'Sin actividad registrada'
  }, { transaction });
}


static async procesarBeneficio(beneficioData, reporteId, transaction) {
  try {
    console.log("[DEBUG] Creando beneficio para reporteId:", reporteId);
    console.log("BENEFICIO DATA",beneficioData)
    const nuevoBeneficio = await DetalleBeneficio.create({
      reporteId: reporteId, // ← ¡Este campo es crítico!
      especie_id: beneficioData.especie_id,
      subespecie_id: beneficioData.subespecie_id,
      claseSexualId: beneficioData.clase_sexual_id,
      categoriaId: beneficioData.categoria_id,
      cantidad: beneficioData.cantidad,
      //peso_pie: beneficioData.peso_pie,
      precio_pie: beneficioData.precio_pie,
      peso_canal: beneficioData.peso_canal,
      precio_canal: beneficioData.precio_canal
    }, { transaction });

    return nuevoBeneficio;
  } catch (error) {
    console.error("[ERROR] DetalleBeneficio.create:", error);
    throw new Error(`Error procesando beneficio: ${error.message}`);
  }
}


static async procesarOrigen(origenData, reporteId, transaction) {
  console.log("ORIGEN DATA", origenData);
  console.log("EN ORIGEN  PRO",reporteId)
  const categoria = await Categoria.findByPk(origenData.categoria_id, { transaction });
  if (!categoria) throw new Error('Categoría no encontrada');
  const subespecie = await Subespecie.findByPk(origenData.subespecie_id, { 
    attributes: ['nombre', 'especie_id'], 
    transaction 
  });

if (!subespecie) {
  throw new Error('Subespecie no encontrada');
}

const claseSexual = await ClaseSexual.findByPk(origenData.clase_sexual_id, {
  attributes: ['nombre'],
  transaction
});
if (!claseSexual) throw new Error('Clase sexual no encontrada');


  const nombreSubespecie = subespecie.nombre;

  for (const entidad of origenData.entidadesOrigen) {
    // Validar campos requeridos
    if (typeof entidad.cantidad_hembras === 'undefined' || 
        typeof entidad.cantidad_machos === 'undefined') {
      throw new Error('Datos incompletos en origen');
    }

    // Convertir a números
    const hembras = Number(entidad.cantidad_hembras);
    const machos = Number(entidad.cantidad_machos);
    const total = hembras + machos;

    // Validaciones
    if (isNaN(hembras)) throw new Error('Cantidad hembras inválida');
    if (isNaN(machos)) throw new Error('Cantidad machos inválida');
    if (hembras < 0 || machos < 0) throw new Error('Cantidades no pueden ser negativas');

    await Origen.create({
      reporteId,
      estado: entidad.estado,
      cantidad_animales: total,
      cantidad_hembras: hembras,
      cantidad_machos: machos,
      especieNombre: subespecie.nombre,
      especieId: subespecie.especie_id, 
      subespecie_id: origenData.subespecie_id,
      categoria_id: origenData.categoria_id,
      claseSexualNombre: claseSexual.nombre,
    }, { transaction });
  }
}

/* The `static async procesarIncidencias` function is responsible for processing incidence data by
creating new incidence records in the database within a transaction. Here's a breakdown of what this
function does: */
static async procesarIncidencias(incidenciasData, reporteId, transaction) {
  console.log("PROCESANDO INCIDENCIAS", reporteId);
  if (!incidenciasData || !Array.isArray(incidenciasData)) return;

  for (const incidencia of incidenciasData) {
    const afectaBeneficiados = ['Vacas preñadas', 'Comiso'].includes(incidencia.tipo);
    
    // Validar que las incidencias críticas tengan cantidad
    if (afectaBeneficiados && (!incidencia.cantidad_afectados || incidencia.cantidad_afectados <= 0)) {
      throw new Error(
        `La incidencia "${incidencia.tipo}" requiere una cantidad afectada válida (mayor que 0)`
      );
    }

    const fotosUrls = [];
    if (incidencia.fotos && incidencia.fotos.length > 0) {
      for (const fotoBase64 of incidencia.fotos) {
        try {
          // Eliminar el prefijo data:image/...;base64,
          const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, '');
          
          const result = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${base64Data}`, {
              folder: `incidencias/${reporteId}`,
              resource_type: 'image',
              transformation: [
                { quality: 'auto:good' },  // Compresión automática
                { width: 1200, crop: 'scale' }  // Redimensionar
              ]
            }
          );
          fotosUrls.push(result.secure_url);
        } catch (error) {
          console.error('Error subiendo imagen a Cloudinary:', error);
          // Puedes decidir si quieres fallar o continuar
          fotosUrls.push(''); // O manejar el error como prefieras
        }
      }
    }


    console.log("REGISTRANDO INCIDENCIA:", 
      incidencia.tipo, 
      "| CANTIDAD:", 
      afectaBeneficiados ? incidencia.cantidad_afectados : "N/A",
      "| FOTOS:", incidencia.fotos ? incidencia.fotos.length : 0
    );
    await Incidencia.create({
      reporteId,
      ...incidencia,
      fotos: incidencia.fotos || [],
      afecta_beneficiados: afectaBeneficiados,
      // Para tipos no críticos, forzar cantidad a 0
      cantidad_afectados: afectaBeneficiados 
        ? incidencia.cantidad_afectados 
        : 0
    }, { transaction });
  }
}



//DETALLE REPORTE ADMIN
static async obtenerReporteParaAdmin(reporteId) {

  console.log("REPOTE ID EN OBTENER ADM", reporteId)
  // Verificar si el reporte existe y obtenerlo con detalles
  return await ReporteDiario.findByPk(reporteId, {
    include: [
      { model: DetalleBeneficio, as: 'detallesBeneficio' },
      { model: Origen, as: 'origen' },
      { model: Incidencia, as: 'incidencias' },
      { model: User, as: 'veterinario' } 
    ]
  });
}


//ETA E SLA QUE SE US APARA DETALLE REPORTE OR USURIO VETERINARIO 
static async obtenerReporteConDetalles(reporteId, usuarioId) {

  return await ReporteDiario.findOne({
    where: {
      id: reporteId,
      veterinario_id: usuarioId 
    },
    include: [
      { model: DetalleBeneficio, as: 'detallesBeneficio' },
      { model: Origen, as: 'origen' },
      { model: Incidencia, as: 'incidencias' }
    ]
  });
}



//Listar reportes  para Admin ESTA E SLA SQUE SE USA 
static async listarTodosReportes(page = 1, limit = 10, filters = {}) {
  console.log('Parámetros recibidos:', { page, limit, filters });
  
  // Validación y normalización de parámetros
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.max(1, parseInt(limit)) || 10;
  const offset = (page - 1) * limit;

  // Configuración de filtros por defecto
  const defaultFilters = {
    veterinario: '',
    fecha_inicio: '',
    fecha_fin: '',
    matadero: '',
    estado: '', // Agregado para posible filtrado por estado
    ...filters
  };

  // Construcción de WHERE clause optimizado
  const whereClause = { 
    deletedAt: null // Siempre filtrar registros no eliminados
  };

  // Filtros de búsqueda
  if (defaultFilters.veterinario) {
    whereClause['$veterinario.name$'] = {
      [Op.iLike]: `%${defaultFilters.veterinario}%`
    };
  }

  if (defaultFilters.matadero) {
    whereClause['$matadero.nombre$'] = {
      [Op.iLike]: `%${defaultFilters.matadero}%`
    };
  }

  if (defaultFilters.estado) {
    whereClause.estado = defaultFilters.estado;
  }

  // Filtros por fecha (usando fecha_reporte como campo principal)
  if (defaultFilters.fecha_inicio && defaultFilters.fecha_fin) {
    whereClause.fecha_reporte = {
      [Op.between]: [
        new Date(defaultFilters.fecha_inicio),
        new Date(defaultFilters.fecha_fin)
      ]
    };
  } else if (defaultFilters.fecha_inicio) {
    whereClause.fecha_reporte = {
      [Op.gte]: new Date(defaultFilters.fecha_inicio)
    };
  } else if (defaultFilters.fecha_fin) {
    whereClause.fecha_reporte = {
      [Op.lte]: new Date(defaultFilters.fecha_fin)
    };
  }

  try {
    // Consulta única para conteo y datos (más eficiente)
    const { count, rows } = await ReporteDiario.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'veterinario',
          attributes: ['id', 'name', 'email'],
          required: !!defaultFilters.veterinario
        },
        {
          model: Matadero,
          as: 'matadero',
          attributes: ['id', 'nombre', 'ubicacion'],
          required: !!defaultFilters.matadero
        },
        {
          model: DetalleBeneficio,
          as: 'detallesBeneficio',
          required: false,
          include: [ 
            { model: Subespecie, as: 'subespecie' },
            { model: ClaseSexual, as: 'claseSexual' },
            { model: Categoria, as: 'categoria' }
          ]
        },
        {
          model: Origen,
          as: 'origen',
          required: false
        },
        {
          model: Incidencia,
          as: 'incidencias',
          required: false
        }
      ],
      order: [
        ['fecha_reporte', 'DESC'], // Orden principal por fecha de reporte
        ['createdAt', 'DESC'] // Orden secundario por creación
      ],
      limit: limit,
      offset: offset,
      distinct: true // Importante para conteo correcto con includes
    });

    console.log(`Reportes encontrados: ${rows.length} de ${count} totales`);

    return {
      data: rows,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    console.error("Error en listarTodosReportes:", error);
    throw new Error(`Error al obtener reportes: ${error.message}`);
  }
}
///////////////////end lsitar reportes admin//////////////







static async listarReportesUsuario(veterinarioId, pagina = 1, porPagina = 10, filtros = {}) {
  // Validación y normalización de parámetros
  pagina = Math.max(1, parseInt(pagina)) || 1;
  porPagina = Math.max(1, parseInt(porPagina)) || 10;
  const offset = (pagina - 1) * porPagina;

  // Configuración base del WHERE clause
  const whereClause = {
    veterinario_id: veterinarioId,
    deletedAt: null // Siempre excluir registros eliminados
  };

  // Configuración de includes optimizada
  const includes = [
    {
      model: DetalleBeneficio,
      as: 'detallesBeneficio',
      required: false,
      include: [ 
        { model: Subespecie, as: 'subespecie', attributes: ['id', 'nombre'] },
        { model: ClaseSexual, as: 'claseSexual', attributes: ['id', 'nombre'] },
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }
      ]
    },
    {
      model: Origen,
      as: 'origen',
      required: false
    },
    {
      model: Incidencia,
      as: 'incidencias',
      required: false
    },
    {
      model: User,
      as: 'veterinario',
      attributes: ['id', 'name', 'email']
    },
    {
      model: Matadero,
      as: 'matadero',
      attributes: ['id', 'nombre'],
      required: !!filtros.matadero // Solo requerido si se filtra por matadero
    }
  ];

  // Aplicación de filtros
  if (filtros.matadero) {
    whereClause['$matadero.nombre$'] = {
      [Op.iLike]: `%${filtros.matadero}%`
    };
  }

  // Manejo de fechas con validación
  if (filtros.fecha_inicio || filtros.fecha_fin) {
    whereClause.fecha_reporte = {};
    
    if (filtros.fecha_inicio) {
      whereClause.fecha_reporte[Op.gte] = new Date(filtros.fecha_inicio);
    }
    
    if (filtros.fecha_fin) {
      whereClause.fecha_reporte[Op.lte] = new Date(filtros.fecha_fin);
    }
  }

  // Filtro por estado si está presente
  if (filtros.estado) {
    whereClause.estado = filtros.estado;
  }

  try {
    const { count, rows } = await ReporteDiario.findAndCountAll({
      where: whereClause,
      include: includes,
      order: [
        ['fecha_reporte', 'DESC'], // Orden principal por fecha de reporte (más reciente primero)
        ['createdAt', 'DESC']       // Orden secundario por creación (para reportes con misma fecha)
      ],
      limit: porPagina,
      offset: offset,
      distinct: true, // Crucial para conteo correcto con joins
      subQuery: false // Mejor rendimiento con paginación
    });

    console.log(`Reportes encontrados para usuario ${veterinarioId}: ${rows.length} de ${count} totales`);

    return {
      data: rows,
      pagination: {
        currentPage: pagina,
        itemsPerPage: porPagina,
        total: count,
        totalPages: Math.ceil(count / porPagina)
      }
    };
  } catch (error) {
    console.error("Error en listarReportesUsuario:", error);
    throw new Error(`Error al obtener reportes del usuario: ${error.message}`);
  }
}




//EDITAR REPORTE

static async editarReporteCompleto(reporteId, reporteData, usuario) {
  const transaction = await sequelize.transaction();
  try {
    // Validar usuario
    if (!usuario?.id) throw new Error("Usuario no autenticado");

    // Determinar roles
    const role = usuario.role?.toLowerCase();
    const isAdminOrSupervisor = ['admin', 'supervisor'].includes(role);

    
    const whereClause = isAdminOrSupervisor
      ? { id: reporteId }
      : {
          id: reporteId,
          veterinario_id: usuario.id
        };

    // Agregar validación de veterinario_id para roles no admin
    if (!isAdminOrSupervisor && !usuario.id) {
      throw new Error("ID de veterinario requerido");
    }

    // Verificar que el reporteId no sea undefined
    console.log('reporteId recibido:', reporteId);

    // Buscar reporte
    const reporte = await ReporteDiario.findOne({
      where: whereClause,
      transaction,
      logging: console.log 
    });

    if (!reporte) {
      throw new Error(isAdminOrSupervisor
        ? "Reporte no encontrado"
        : "Reporte no encontrado o no autorizado"
      );
    }

    // Validar permisos de edición
    if (!isAdminOrSupervisor && reporte.estado === 'enviado') {
      throw new Error("No puedes editar un reporte ya enviado");
    }

    // Actualizar campos permitidos usando 'reporteId'
    await reporte.update({
      fecha_reporte: reporteData.fecha_reporte,
      fecha_actividad: reporteData.fecha_actividad,
      // hora_inicio: reporteData.hora_inicio,
      // hora_fin: reporteData.hora_fin,
      observaciones: reporteData.observaciones,
      hubo_actividad: reporteData.hubo_actividad,
      estado: isAdminOrSupervisor
        ? reporteData.estado
        : reporte.estado 
    }, {
      where: { id: reporteId },
      transaction
    });

    // Eliminar y recrear relaciones (beneficio, origen, incidencias)
    await Promise.all([
      DetalleBeneficio.destroy({ where: { reporteId: reporteId }, transaction }), // Usamos la variable reporteIdLocal
      Origen.destroy({ where: { reporteId: reporteId }, transaction }),       // Usamos la variable reporteIdLocal
      Incidencia.destroy({ where: { reporteId: reporteId }, transaction })     // Usamos la variable reporteIdLocal
    ]);

    if (reporteData.hubo_actividad) {

      if (reporteData.beneficio && Array.isArray(reporteData.beneficio)) {
        for (const beneficio of reporteData.beneficio) {
          await this.procesarBeneficio(beneficio, reporteId, transaction); // Usamos la variable reporteIdLocal
        }
      }

      if (reporteData.origen && Array.isArray(reporteData.origen)) {
        for (const origen of reporteData.origen) {
          await this.procesarOrigen(origen, reporteId, transaction);   // Usamos la variable reporteIdLocal
        }
      }

      if (reporteData.incidencias && Array.isArray(reporteData.incidencias)) {
        await this.procesarIncidencias(reporteData.incidencias, reporteId, transaction); // Usamos la variable reporteIdLocal
      }
    }

    // Obtener el reporte actualizado con los detalles
    const reporteActualizado = await this.obtenerReporteConDetalles(reporteId, usuario.id);
    await transaction.commit();
    return reporteActualizado;

  } catch (error) {
    await transaction.rollback();
    throw new Error(`Error editando reporte: ${error.message}`);
  }
}

/**
 * The function `eliminarReporte` deletes a daily report along with its related details and checks for
 * authorization based on the user's role.
 * @param reporteId - The `reporteId` parameter is the unique identifier of the report that you want to
 * delete from the database.
 * @param usuario - The `usuario` parameter in the `eliminarReporte` function represents the user who
 * is attempting to delete a report. It contains information about the user, such as whether they are
 * an admin or a veterinarian. This information is used to determine the conditions under which a
 * report can be deleted. If the
 * @returns The `eliminarReporte` method is returning a boolean value (`true`) if the report deletion
 * process is successful. If an error occurs during the deletion process, the method will throw an
 * error.
 */

//ESTE SE IMPLEMENT ALUEGO 
static async eliminarReporte(reporteId, usuario) {
  const transaction = await sequelize.transaction();
  try {
    const whereClause = usuario.esAdmin 
      ? { id: reporteId }
      : { id: reporteId, veterinario_id: usuario.id };

    const reporte = await ReporteDiario.findOne({
      where: whereClause,
      transaction
    });

    if (!reporte) throw new Error(usuario.esAdmin 
      ? "Reporte no encontrado"
      : "Reporte no encontrado o no autorizado");

    await DetalleBeneficio.destroy({ where: { reporteId }, transaction });
    await Origen.destroy({ where: { reporteId }, transaction });
    await Incidencia.destroy({ where: { reporteId }, transaction });
    await reporte.destroy({ transaction });

    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}









static async marcarReporteComoEnviado(reporteId, usuario) {
  const whereClause = usuario.esAdmin 
    ? { id: reporteId }
    : { id: reporteId, veterinario_id: usuario.id };

  const reporte = await ReporteDiario.findOne({
    where: whereClause,
    include: [
      {
        model: DetalleBeneficio,
        include: [Especie, Subespecie, ClaseSexual, Categoria]
      },
      {
        model: Origen,
        include: [Especie]
      },
      {
        model: Incidencia
      },
      {
        model: Matadero,
        include: [Ubicacion]
      },
      {
        model: Veterinario
      }
    ]
  });

  if (!reporte) throw new Error("Reporte no encontrado o no autorizado");

  if (reporte.estado === 'enviado') {
    throw new Error("Este reporte ya fue enviado");
  }

  // 🔍 Validaciones
  if (!reporte.hora_inicio || !reporte.hora_fin) {
    throw new Error("Debe indicar hora de inicio y fin");
  }

  if (reporte.hubo_actividad) {
    if (!reporte.detallesBeneficio?.length) {
      throw new Error("Debe ingresar al menos un detalle de beneficio");
    }

    if (!reporte.origen?.length) {
      throw new Error("Debe ingresar al menos un origen");
    }

    // Si incidencias son obligatorias, puedes validar también
    // if (!reporte.incidencias?.length) {
    //   throw new Error("Debe registrar al menos una incidencia");
    // }
  }

  await reporte.update({ estado: 'enviado' });

  return reporte;
}




}

module.exports = ReporteService;