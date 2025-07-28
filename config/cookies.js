// config/cookies.js
module.exports = {
  getCookieOptions: () => ({
      httpOnly: true,
      secure: true,   
      sameSite: 'None',
      domain: process.env.NODE_ENV === 'production' 
          ? 'nbagro.xyz'
          : 'localhost',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
  }),
  
  getAccessTokenOptions: () => ({
      httpOnly: true,
      secure: true, 
      sameSite: 'None',
      domain: process.env.NODE_ENV === 'production' 
          ? 'nbagro.xyz'
          : 'localhost',
      path: '/',
      maxAge: 25 * 60 * 1000
  })
};




// config/cookies.js
// module.exports = {
//   getCookieOptions: () => ({
//       httpOnly: true,
//       secure: true,   
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       domain: process.env.NODE_ENV === 'production' 
//           ? 'dashboardnew-tawny.vercel.app'  
//           : 'localhost',
//       path: '/',
//       maxAge: 7 * 24 * 60 * 60 * 1000
//   }),
  
//   getAccessTokenOptions: () => ({
//       httpOnly: true,
//       secure: true, 
//       sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
//       domain: process.env.NODE_ENV === 'production' 
//           ? 'dashboardnew-tawny.vercel.app'  
//           : 'localhost',
//       path: '/',
//       maxAge: 15 * 60 * 1000
//   })
// };