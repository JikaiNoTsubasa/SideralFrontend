import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Avatar } from '../../shared/avatar/avatar';

@Component({
  selector: 'sd-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Avatar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  host: { '(document:click)': 'closeMenu()' },
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
  }
}
