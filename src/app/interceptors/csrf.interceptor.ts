import { HttpInterceptorFn } from '@angular/common/http';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Sempre invia withCredentials per ricevere e inviare i cookie
  let modifiedReq = req.clone({
    withCredentials: true
  });

  // Aggiungi il token CSRF solo per metodi che modificano i dati
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    const csrfToken = getCookie('csrftoken');
    
    if (csrfToken) {
      modifiedReq = modifiedReq.clone({
        setHeaders: {
          'X-CSRFToken': csrfToken
        }
      });
      console.log(`CSRF token added to ${req.method} request:`, req.url);
    } else {
      console.warn(`No CSRF token found for ${req.method} request:`, req.url);
    }
  }

  return next(modifiedReq);
};
