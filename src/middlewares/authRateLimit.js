const { RateLimiterMemory } = require('rate-limiter-flexible');

const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5 intentos
  duration: 10* 60, // 15 minutos de bloqueo
  blockDuration: 10 * 60, // Bloquea por 15 minutos
});

const authRateLimiter = async (req, res, next) => {
  if (!req.originalUrl.includes('/auth/login')) return next();
  
  const key = `${req.ip}:${req.body.email || 'unknown'}`;
  
  try {
    const rateLimiterRes = await loginRateLimiter.consume(key);
    
    res.set({
      'X-RateLimit-Limit': 5,
      'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
      'X-RateLimit-Reset': Math.ceil(rateLimiterRes.msBeforeNext / 1000)
    });
    
    next();
  } catch (error) {
    // DEBUG: Mostrar información del rate limiter
    console.log('Rate limiter blocked:', key, 'Points:', error.consumedPoints);
    
    res.set({
      'Retry-After': Math.ceil(error.msBeforeNext / 1000),
      'Content-Type': 'application/json'
    });
    
    return res.status(429).json({
      success: false,
      code: "TOO_MANY_REQUESTS",
      message: `Demasiados intentos. Intente en ${Math.ceil(error.msBeforeNext / 1000)} segundos.`,
      retryAfter: Math.ceil(error.msBeforeNext / 1000)
    });
  }
};

const resetOnSuccess = async (req, res, next) => {
  if (req.loginSuccessful) {
    const key = `${req.ip}:${req.body.email}`;
    try {
      await loginRateLimiter.delete(key);
      console.log('Rate limiter reset for:', key);
    } catch (e) {
      console.error('Error resetting rate limiter:', e);
    }
  }
  next();
};

module.exports = { authRateLimiter, resetOnSuccess };