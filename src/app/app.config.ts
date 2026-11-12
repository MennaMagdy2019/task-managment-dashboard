import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api-interceptor/mock-api.interceptor';
import { taskApiInterceptor } from './core/interceptors/task-api-interceptor/task-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([taskApiInterceptor, mockApiInterceptor])),
  ],
};
