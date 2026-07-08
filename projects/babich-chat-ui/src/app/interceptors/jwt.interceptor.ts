import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor автоматически добавляет JWT токен в каждый HTTP запрос.
 * Аналог middleware — перехватывает запрос перед отправкой.
 *
 * Без этого нужно было бы вручную добавлять заголовок в каждом сервисе:
 * headers: { Authorization: `Bearer ${token}` }
 *
 * С interceptor это происходит автоматически для всех запросов.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // берём токен из localStorage
  const token = localStorage.getItem('token');

  if (token) {
    // клонируем запрос и добавляем заголовок
    // клонируем потому что HttpRequest иммутабельный — нельзя менять напрямую
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  // если токена нет — отправляем запрос как есть
  return next(req);
};