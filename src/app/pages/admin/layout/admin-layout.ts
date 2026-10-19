import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Mise en page de l'administration : navigation latérale + contenu. */
@Component({
  selector: 'sd-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="side-layout">
      <nav class="side-nav">
        <a routerLink="/admin/fulltext" routerLinkActive="active"><span aria-hidden="true">🔎</span> Full Text Server</a>
      </nav>

      <section>
        <router-outlet />
      </section>
    </div>
  `,
})
export class AdminLayout {}
