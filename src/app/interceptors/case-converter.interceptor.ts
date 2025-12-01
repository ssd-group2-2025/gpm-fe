import { HttpInterceptorFn } from '@angular/common/http';
import { map } from 'rxjs';

function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }

  return Object.keys(obj).reduce((acc: any, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
}

function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  return Object.keys(obj).reduce((acc: any, key: string) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {});
}

export const caseConverterInterceptor: HttpInterceptorFn = (req, next) => {
  // Convert request body from camelCase to snake_case
  let modifiedReq = req;
  if (req.body && typeof req.body === 'object') {
    modifiedReq = req.clone({
      body: toSnakeCase(req.body)
    });
  }

  // Convert response body from snake_case to camelCase
  return next(modifiedReq).pipe(
    map(event => {
      if (event.type === 4 && event.body) { // HttpEventType.Response
        return event.clone({ body: toCamelCase(event.body) });
      }
      return event;
    })
  );
};
