const { Subespecie, ClaseSexual, Categoria } = require('../models');

class DetalleService {
  async validarJerarquia(subespecieId, claseSexualId, categoriaId) {
    const [subespecie, clase, categoria] = await Promise.all([
      Subespecie.findByPk(subespecieId, {
        include: ['clasesSexuales', 'categorias']
      }),
      ClaseSexual.findByPk(claseSexualId),
      Categoria.findByPk(categoriaId)
    ]);
    
    if (!subespecie) throw new Error('Subespecie no válida');
    
    const claseValida = subespecie.clasesSexuales.some(c => c.id === claseSexualId);
    const categoriaValida = subespecie.categorias.some(cat => cat.id === categoriaId);
    
    if (!claseValida || !categoriaValida) {
      throw new Error('Clase sexual o categoría no corresponden a la subespecie');
    }
    
    return true;
  }
}

module.exports = new DetalleService();