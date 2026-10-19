import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FolderPermissionsDto, levelLabel, PERMISSION_LEVELS, PermissionLevel } from '../../../core/models/dms.model';
import { PrincipalDto } from '../../../core/models/principal.model';
import { DmsService } from '../../../core/services/dms.service';
import { errorMessage } from '../../../core/utils/error-message';
import { Avatar } from '../../../shared/avatar/avatar';
import { Modal } from '../../../shared/modal/modal';
import { PrincipalPicker } from '../../../shared/principal-picker/principal-picker';

interface EditableEntry {
  principal: PrincipalDto;
  level: PermissionLevel;
}

/** Droits d'accès d'un dossier : droits hérités (lecture seule) et droits propres (modifiables par un gestionnaire). */
@Component({
  selector: 'sd-permissions-dialog',
  imports: [Modal, Avatar, PrincipalPicker, FormsModule, NgTemplateOutlet],
  templateUrl: './permissions-dialog.html',
  styleUrl: './permissions-dialog.scss',
})
export class PermissionsDialog implements OnInit {
  private readonly dms = inject(DmsService);

  readonly folderId = input.required<number>();
  readonly folderName = input('');
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly permissions = signal<FolderPermissionsDto | null>(null);
  protected readonly entries = signal<EditableEntry[]>([]);
  protected readonly inherit = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  /** État enregistré (sérialisé) : sert à savoir s'il reste des modifications à enregistrer. */
  private readonly savedState = signal('');
  protected readonly dirty = computed(() => this.state() !== this.savedState());
  protected readonly levels = PERMISSION_LEVELS;
  protected readonly levelLabel = levelLabel;
  protected readonly selectedKeys = computed(() => new Set(this.entries().map((e) => this.key(e.principal))));

  ngOnInit(): void {
    this.dms.permissions(this.folderId()).subscribe({
      next: (p) => this.apply(p),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  private state(): string {
    return JSON.stringify([this.inherit(), this.entries().map((e) => [this.key(e.principal), e.level])]);
  }

  protected setInherit(value: boolean): void {
    this.inherit.set(value);
    this.success.set(false);
  }

  protected key(p: PrincipalDto): string {
    return `${p.type}:${p.id}`;
  }

  protected add(principal: PrincipalDto): void {
    this.entries.update((entries) => [...entries, { principal, level: 'Read' }]);
    this.success.set(false);
  }

  protected remove(entry: EditableEntry): void {
    this.entries.update((entries) => entries.filter((e) => e !== entry));
    this.success.set(false);
  }

  protected setLevel(entry: EditableEntry, level: PermissionLevel): void {
    this.entries.update((entries) => entries.map((e) => (e === entry ? { ...e, level } : e)));
    this.success.set(false);
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    this.dms
      .setPermissions(this.folderId(), {
        inheritPermissions: this.inherit(),
        entries: this.entries().map((e) => ({
          userId: e.principal.type === 'user' ? e.principal.id : null,
          groupId: e.principal.type === 'group' ? e.principal.id : null,
          level: e.level,
        })),
      })
      .subscribe({
        next: (p) => {
          this.apply(p);
          this.saving.set(false);
          this.success.set(true);
          this.saved.emit();
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }

  private apply(p: FolderPermissionsDto): void {
    this.permissions.set(p);
    this.inherit.set(p.inheritPermissions);
    this.entries.set(p.entries.map((e) => ({ principal: e.principal, level: e.level })));
    this.savedState.set(this.state());
  }
}
