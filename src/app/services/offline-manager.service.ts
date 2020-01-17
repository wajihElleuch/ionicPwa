import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ToastController} from '@ionic/angular';
import {forkJoin, from, Observable, of} from 'rxjs';
import {delay, finalize, retryWhen, switchMap, take} from 'rxjs/operators';
import {Storage} from '@ionic/storage';

const STORAGE_REQ_KEY = 'storedreq';

interface StoredRequest {
    url: string;
    type: string;
    data: any;
    time: number;
    id: string;
}

@Injectable({
    providedIn: 'root'
})
export class OfflineManagerService {

    constructor(private storage: Storage, private http: HttpClient, private toastController: ToastController) {
    }

    checkForEvents(): Observable<any> {
        return from(this.storage.get(STORAGE_REQ_KEY)).pipe(
            switchMap(storedOperations => {
                let storedObj: any;
                storedObj = JSON.parse(storedOperations);
                if (storedObj && storedObj.length > 0) {
                    return this.sendRequests(storedObj).pipe(
                        // retryWhen(errors => errors.pipe(delay(1000), take(10))),
                        finalize(() => {
                            const toast = this.toastController.create({
                                message: `Local data succesfully synced to API!${storedObj}`,
                                duration: 3000,
                                position: 'bottom'
                            });
                            // tslint:disable-next-line:no-shadowed-variable
                            toast.then(toast => toast.present());

                            this.storage.remove(STORAGE_REQ_KEY);
                        })
                    );
                } else {
                    console.log('no local events to sync');
                    return of(false);
                }
            })
        );
    }

    storeRequest(url, type, data) {
        const toast = this.toastController.create({
            message: `Your data is stored locally because you seem to be offline.`,
            duration: 3000,
            position: 'bottom'
        });
        // tslint:disable-next-line:no-shadowed-variable
        toast.then(toast => toast.present());

        const action: StoredRequest = {
            url,
            type,
            data,
            time: new Date().getTime(),
            id: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
        };
        // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript

        return this.storage.get(STORAGE_REQ_KEY).then(storedOperations => {
            let storedObj = JSON.parse(storedOperations);

            if (storedObj) {
                storedObj.push(action);
            } else {
                storedObj = [action];
            }
            // Save old & new local transactions back to Storage
            return this.storage.set(STORAGE_REQ_KEY, JSON.stringify(storedObj));
        });
    }

    sendRequests(operations: StoredRequest[]) {
        const obs = [];

        for (const op of operations) {
            console.log('Make one request: ', op);
            const oneObs = this.http.request(op.type, op.url, { body : op.data }).pipe(
                retryWhen(errors => errors.pipe(delay(1000), take(10))),
            );
            obs.push(oneObs);
        }

        // Send out all local events and return once they are finished
        return forkJoin(obs);
    }
}
