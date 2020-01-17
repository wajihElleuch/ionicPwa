import {Component} from '@angular/core';

import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {OfflineManagerService} from './services/offline-manager.service';
import {ConnectionStatus, NetworkService} from './services/network.service';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {
    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private offlineManager: OfflineManagerService,
        private networkService: NetworkService
    ) {
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready().then(() => {
            this.statusBar.styleDefault();
            this.splashScreen.hide();

            this.networkService.onNetworkChange().subscribe((status: ConnectionStatus) => {
                if (status === ConnectionStatus.Online) {
                    this.offlineManager.checkForEvents().subscribe();
                }
            });
        });
    }
}
