import { BadRequestException } from '@nestjs/common';

/** Remove máscara; apenas dígitos. */
export function normalizeDocument(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isValidCpfCnpjLength(digits: string): boolean {
  return digits.length === 11 || digits.length === 14;
}

/** Valida e retorna CPF/CNPJ só com dígitos. */
export function parseDocumentOrThrow(raw: string): string {
  const digits = normalizeDocument(raw);
  if (!isValidCpfCnpjLength(digits)) {
    throw new BadRequestException(
      'CPF deve ter 11 dígitos ou CNPJ 14 dígitos (apenas números).',
    );
  }
  return digits;
}
