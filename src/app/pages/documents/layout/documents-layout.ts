import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Mise en page de la GED : navigation latérale + contenu. */
@Component({
  selector: 'sd-documents-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './documents-layout.html',
  styleUrl: './documents-layout.scss',
})
export class DocumentsLayout {}
