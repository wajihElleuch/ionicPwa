import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConnectionStatus, NetworkService} from '../../services/network.service';
import {OfflineManagerService} from '../../services/offline-manager.service';
import {from, Observable, of} from 'rxjs';
import {catchError, delay, map, retryWhen, take, tap} from 'rxjs/operators';
import {Storage} from '@ionic/storage';
import {ToastController} from '@ionic/angular';

const API_STORAGE_KEY = 'specialkey';
const API_URL = 'https://reqres.in/api';

@Injectable({
    providedIn: 'root'
})
export class UserService {


    // public getUsers() {
    //     return this.httpClient.get('https://app-paw.herokuapp.com/users');
    // }
    constructor(private http: HttpClient, private toastController: ToastController, private networkService: NetworkService, private storage: Storage, private offlineManager: OfflineManagerService) {
    }

    getUsers(forceRefresh: boolean = false): Observable<any> {
        // return this.http.get(`https://app-paw.herokuapp.com/users`);
        console.log(this.networkService.getCurrentNetworkStatus());
        if (this.networkService.getCurrentNetworkStatus() === ConnectionStatus.Offline || !forceRefresh) {
            // Return the cached data from Storage
            return from(this.getLocalData('users'));
        } else {
            // Just to get some "random" data
            // let page = Math.floor(Math.random() * Math.floor(6));

            // Return real API data and store it locally
            // @ts-ignore
            return this.http.get(`https://app-paw.herokuapp.com/users`).pipe(
                retryWhen(errors => errors.pipe(delay(1000), take(10))),
                map(res => res),
                tap(res => {
                    this.setLocalData('users', res);
                })
            );
        }
    }

    updateUser(user): Observable<any> {
        const url = `https://app-paw.herokuapp.com/users/edit`;
        if (this.networkService.getCurrentNetworkStatus() === ConnectionStatus.Offline) {

            this.getLocalData('users').then((value: any[]) => {
                // value.splice(value.indexOf(user), 1);
                const elementPos = value.map(x => x.id).indexOf(user.id);
                console.log(elementPos);
                value.splice(elementPos, 1, user);
                console.log(value);
                console.log(user);
                this.storage.remove('users').then();
                this.setLocalData('users', value);
            });
            this.getLocalData('users').then(value => console.table(value));
            return from(this.offlineManager.storeRequest(url, 'PUT', user));

        } else {

            return this.http.put(url, user).pipe(
                catchError(err => {
                    this.offlineManager.storeRequest(url, 'PUT', user);
                    throw new Error(err);
                })
            );
        }
    }

    // Save result of API requests
    private setLocalData(key, data) {
        this.storage.set(`${API_STORAGE_KEY}-${key}`, data);
    }

    // Get cached API result
    private getLocalData(key) {
        return this.storage.get(`${API_STORAGE_KEY}-${key}`);
    }
}
