export { transliterate } from './core/transliterator';
export { assameseSchema } from './schemas/assamese';
export { banglaSchema } from './schemas/bangla';
export { hindiSchema } from './schemas/hindi';
export type { TransliterationSchema } from './types/transliteration';

import { transliterate } from './core/transliterator';
import { TransliterationSchema } from './types/transliteration';

export class Transliterator {
  constructor(private schema: TransliterationSchema) {}

  transliterate(input: string): string {
    return transliterate(input, this.schema);
  }

  getSchema(): TransliterationSchema {
    return this.schema;
  }

  setSchema(schema: TransliterationSchema): void {
    this.schema = schema;
  }
}
