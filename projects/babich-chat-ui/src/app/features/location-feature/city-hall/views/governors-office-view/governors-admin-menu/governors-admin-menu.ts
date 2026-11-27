import { Component } from '@angular/core';
import { DefaultButtonComponent } from '../../../../../../shared/components/buttons/default-button/default-button';
import { DefaultList } from '../../../../../../shared/components/default-list/default-list';

@Component({
  selector: 'app-governors-admin-menu',
  imports: [DefaultButtonComponent, DefaultList],
  templateUrl: './governors-admin-menu.html',
  styleUrl: './governors-admin-menu.scss',
})
export class GovernorsAdminMenu {

}
