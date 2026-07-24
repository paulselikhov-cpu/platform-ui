import { PublicLocation } from './public-location.interface';

/**
 * Район города — административная единица.
 * Создаётся администраторами платформы, вмещает жителей
 * и содержит фиксированный набор системных локаций.
 */
export interface District {
  /** ID района */
  id: number;
  
  /** Уникальный код района */
  code: string;
  
  /** Название района */
  name: string;
  
  /** Описание района */
  description?: string;
  
  /** Список системных локаций района */
  publicLocations?: PublicLocation[];
}
