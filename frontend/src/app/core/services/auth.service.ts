import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { User } from '../../shared/models/user.interface';
import { Subject, catchError, of, takeUntil, tap, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { TuiAlertService } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { JwtService } from './jwt.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private _user: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private _isAuthenticated = new BehaviorSubject<boolean>(false);
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private http: HttpClient, 
    private translocoService: TranslocoService, 
    private readonly alerts: TuiAlertService, 
    private router: Router) { }

  public get user() {
    return this._user.asObservable();
  }

  public get isAuthenticated() {
    return this._isAuthenticated.asObservable();
  }

  public isAuthenticatedNow(): boolean {
    return this._isAuthenticated.getValue();
  }

  login(email: string, password: string) {
    return this.http.post<User>(`${environment.API_Endpoint}/auth/login`, { email, password }).pipe(
      tap(user => {
        this._user.next(user);
        this._isAuthenticated.next(!!user);
        const message = this.translocoService.translate('sign-in.success-login', { user: user.firstName });
          this.alerts.open('', { label: message, status: 'success' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
      }),
      catchError(error => {
        this.alerts.open('',{ label: this.translocoService.translate('sign-in.error-login'), status: 'error' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
        return error;
      })
    );
  }

  register(user: User) {
    return this.http.post<User>('/api/auth/register', user).pipe(
      tap(user => {
        this._user.next(user);
        this._isAuthenticated.next(!!user);
        this.alerts.open( this.translocoService.translate("sign-up.success-sign-up"), { label: this.translocoService.translate("sign-up.success-welcome") + ' ' + user.firstName + '!', status: 'success'}).pipe(takeUntil(this._unsubscribeAll)).subscribe();
      }),
      catchError(error => {
        const errors = error.error.errors.map((error: { message: string }) => error.message);
        this.alerts.open(errors, { label: this.translocoService.translate('sign-up.error-register'), status: 'error' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
        return error;
      })
    );
  }

  update(user: User) {
    return this.http.put<User>('/api/auth/update', user).pipe(
      tap(user => {
        this._user.next(user);
        this._isAuthenticated.next(!!user);
        this.alerts.open('', { label: this.translocoService.translate('account.update-success'), status: 'success' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
      }),
      catchError(error => {
        const errors = error.error.errors.map((error: { message: string }) => error.message);
        this.alerts.open(errors, { label: this.translocoService.translate('account.update-error'), status: 'error' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
        return error;
      })
    );
  }

  logout() {
    this._user.next(null);
    this._isAuthenticated.next(false);
    this.router.navigate(['/sign-in']);

    this.translocoService.selectTranslate('sign-in.success-logout').pipe(takeUntil(this._unsubscribeAll)).subscribe(message => {
      this.alerts.open('', { label: message, status: 'info' }).pipe(takeUntil(this._unsubscribeAll)).subscribe();
    });
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}

