import {Component, OnInit} from '@angular/core';
import {UserService} from './services/user.service';
import {Platform} from '@ionic/angular';

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
    users: any[];

    constructor(private userService: UserService, private plt: Platform) {
    }

    ngOnInit(): void {
        this.plt.ready().then(() => {
            this.loadUsers(true);
        });
    }

    loadUsers(refresh = false, refresher?) {
        this.userService.getUsers(refresh).subscribe((user: any[]) => {
            this.users = user;
            if (refresher) {
                refresher.target.complete();
            }
        });
    }


    updateSelected(user: any) {
        if (user.selected) {
            user.selected = false;
            this.users.splice(this.users.indexOf(user), 1, user);
            this.userService.updateUser(user).subscribe();
            // this.todoService.updateUser(user).subscribe();
        } else {
            user.selected = true;
            this.users.splice(this.users.indexOf(user), 1, user);
            this.userService.updateUser(user).subscribe();
        }
    }
}
