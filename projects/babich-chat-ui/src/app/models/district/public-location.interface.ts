import { PublicLocationType } from './public-location-type.enum';

/**
 * Общественная (системная) локация района.
 * Создаётся автоматически для каждого района.
 */
export interface PublicLocation {
  /** ID локации */
  id: number;
  
  /** Тип системной локации */
  type: PublicLocationType;
  
  /** Название локации */
  name: string;
  
  /** Описание локации */
  description?: string;
}
