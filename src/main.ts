import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { APP_INITIALIZER } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { csrfInterceptor } from './app/interceptors/csrf.interceptor';
import { jwtInterceptor } from './app/interceptors/jwt.interceptor';
import { caseConverterInterceptor } from './app/interceptors/case-converter.interceptor';
import { AuthService } from './app/core-client-generated/api/auth.service';
import { UsersService } from './app/core-client-generated/api/users.service';
import { GroupsService } from './app/core-client-generated/api/groups.service';
import { GroupUsersService } from './app/core-client-generated/api/groupUsers.service';
import { GoalsService } from './app/core-client-generated/api/goals.service';
import { TopicsService } from './app/core-client-generated/api/topics.service';
import { GroupGoalsService } from './app/core-client-generated/api/groupGoals.service';
import { Configuration } from './app/core-client-generated/configuration';
import { firstValueFrom } from 'rxjs';

function initializeCsrf(http: HttpClient) {
  return () => {
    // Non blocchiamo l'avvio dell'app - il CSRF verrà gestito dall'interceptor
    // Django invierà il cookie csrftoken al primo contatto
    console.log('CSRF initialization - cookie will be set on first request');
    return Promise.resolve();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, csrfInterceptor, caseConverterInterceptor])),
    {
      provide: Configuration,
      useValue: new Configuration({
        basePath: 'http://localhost:8000/api/v1',
        withCredentials: true
      })
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCsrf,
      deps: [HttpClient],
      multi: true
    },
    AuthService,
    UsersService,
    GroupsService,
    GroupUsersService,
    GoalsService,
    TopicsService,
    GroupGoalsService
  ],
}).catch((err) => console.error(err));
