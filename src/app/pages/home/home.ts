import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'sd-home',
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly auth = inject(AuthService);

  protected readonly features = [
    { icon: '💬', title: "Fil d'actualité", description: 'Partagez et suivez les actualités de vos collègues.' },
    { icon: '📋', title: 'Projets', description: 'Pilotez vos projets techniques et leurs tâches.' },
    { icon: '📁', title: 'Documents', description: 'Centralisez et versionnez vos documents.' },
  ];
}
