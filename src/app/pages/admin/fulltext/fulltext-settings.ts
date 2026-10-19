import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval, startWith } from 'rxjs';
import {
  FULLTEXT_APPLICATION_CODE_PATTERN,
  FULLTEXT_SCHEDULE_LIMITS,
  FullTextConfigDto,
  FullTextStatsDto,
  FullTextStatusDto,
} from '../../../core/models/admin.model';
import { AdminService } from '../../../core/services/admin.service';
import { errorMessage } from '../../../core/utils/error-message';
import { FullTextQueue } from './fulltext-queue';

const L = FULLTEXT_SCHEDULE_LIMITS;

/** Administration : configuration du serveur full text, test de connexion et état de l'indexation. */
@Component({
  selector: 'sd-fulltext-settings',
  imports: [ReactiveFormsModule, DatePipe, FullTextQueue],
  templateUrl: './fulltext-settings.html',
  styleUrl: './fulltext-settings.scss',
})
export class FullTextSettings implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly config = signal<FullTextConfigDto | null>(null);
  protected readonly status = signal<FullTextStatusDto | null>(null);
  protected readonly checking = signal(false);
  protected readonly stats = signal<FullTextStatsDto | null>(null);
  protected readonly saving = signal(false);
  protected readonly success = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly limits = L;
  private readonly queue = viewChild(FullTextQueue);

  protected readonly form = inject(NonNullableFormBuilder).group({
    enabled: [false],
    url: ['', Validators.pattern(/^https?:\/\/\S+$/)],
    applicationCode: ['', Validators.pattern(FULLTEXT_APPLICATION_CODE_PATTERN)],
    intervalSeconds: [30, [Validators.required, Validators.min(L.intervalSeconds.min), Validators.max(L.intervalSeconds.max)]],
    batchSize: [10, [Validators.required, Validators.min(L.batchSize.min), Validators.max(L.batchSize.max)]],
    maxRetryDelayMinutes: [60, [Validators.required, Validators.min(L.maxRetryDelayMinutes.min), Validators.max(L.maxRetryDelayMinutes.max)]],
  });

  private readonly formValue = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  /** Le code application enregistré va changer : les documents indexés sous l'ancien code ne seront plus disponibles. */
  protected readonly codeChanged = computed(() => {
    const saved = this.config()?.applicationCode;
    const code = this.formValue().applicationCode?.trim();
    return !!saved && !!code && code !== saved;
  });

  constructor() {
    // Le message « enregistré » disparaît dès qu'on modifie un champ (apply() le réaffiche après reset)
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.success.set(false));
    // Activité de l'indexeur actualisée automatiquement
    interval(15_000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.loadStats());
  }

  ngOnInit(): void {
    this.admin.fullTextConfig().subscribe({
      next: (config) => {
        this.apply(config);
        // Vérification automatique à l'affichage
        if (config.url) {
          this.check(false);
        }
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
    this.loadStats();
  }

  /** Teste la connexion : avec l'URL saisie (fromForm) ou celle enregistrée. */
  protected check(fromForm = true): void {
    const value = this.form.getRawValue();
    this.checking.set(true);
    this.admin.checkFullText(fromForm ? value.url.trim() : null).subscribe({
      next: (status) => {
        this.status.set(status);
        this.checking.set(false);
      },
      error: (err) => {
        this.status.set({ reachable: false, statusCode: null, latencyMs: null, message: errorMessage(err), checkedOn: new Date().toISOString() });
        this.checking.set(false);
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (
      this.codeChanged() &&
      !confirm(
        `Changer le code application de « ${this.config()?.applicationCode} » à « ${this.form.getRawValue().applicationCode.trim()} » ?\n\n` +
          "Les documents indexés sous l'ancien code ne seront plus disponibles : tous les documents seront réindexés sous le nouveau code.",
      )
    ) {
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.success.set(false);
    this.error.set(null);
    this.admin
      .updateFullTextConfig({
        enabled: value.enabled,
        url: value.url.trim() || null,
        applicationCode: value.applicationCode.trim() || null,
        intervalSeconds: value.intervalSeconds,
        batchSize: value.batchSize,
        maxRetryDelayMinutes: value.maxRetryDelayMinutes,
      })
      .subscribe({
        next: (config) => {
          this.apply(config);
          this.saving.set(false);
          this.success.set(true);
          this.loadStats();
          if (config.url) {
            this.check(false);
          }
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.saving.set(false);
        },
      });
  }

  protected reindex(onlyFailed: boolean): void {
    if (!onlyFailed && !confirm('Réindexer tous les documents ? Ils seront renvoyés au serveur full text.')) {
      return;
    }
    this.info.set(null);
    this.admin.reindexFullText(onlyFailed).subscribe({
      next: (count) => {
        this.info.set(`${count} document(s) remis en file d'indexation.`);
        this.loadStats();
        this.queue()?.reload();
      },
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  protected loadStats(): void {
    this.admin.fullTextStats().subscribe({ next: (stats) => this.stats.set(stats), error: () => this.stats.set(null) });
  }

  private apply(config: FullTextConfigDto): void {
    this.config.set(config);
    this.form.reset({
      enabled: config.enabled,
      url: config.url ?? '',
      applicationCode: config.applicationCode ?? '',
      ...config.schedule,
    });
  }
}
