import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Vérifie que deux champs d'un groupe ont la même valeur. */
export function matchValidator(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value = group.get(field)?.value;
    const confirm = group.get(confirmField)?.value;
    return value && confirm && value !== confirm ? { mismatch: true } : null;
  };
}

export const PASSWORD_MIN_LENGTH = 8;
