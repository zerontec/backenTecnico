const checkMataderoOwnership = async (req, res, next) => {
    const matadero = await Matadero.findByPk(req.params.id);
    if (req.user.role === 'veterinario' && matadero.veterinarioId !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };