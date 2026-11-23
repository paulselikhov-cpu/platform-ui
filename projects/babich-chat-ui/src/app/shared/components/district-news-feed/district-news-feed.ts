import { Component } from '@angular/core';

/** Одна запись ленты новостей района. */
export interface IDistrictNewsItem {
  id: number;
  title: string;
  content: string;
}

/**
 * Лента новостей района.
 *
 * Данные пока локальные: бэкенд не отдаёт ленту событий района, поэтому записи
 * заданы здесь. Компонент вынесен отдельно от `CharacterPanel`, чтобы один и
 * тот же список показывался и в правой панели десктопа, и на вкладке «Район»
 * мобильной раскладки.
 */
@Component({
  selector: 'app-district-news-feed',
  templateUrl: './district-news-feed.html',
  styleUrl: './district-news-feed.scss',
})
export class DistrictNewsFeed {
  readonly news: IDistrictNewsItem[] = [
    { id: 1, title: 'Администрация:', content: 'На выборы в мэры победил Селихов Павел!' },
    { id: 2, title: 'Павел Селихов:', content: 'Спасибо всем! Я очень рад быть с вами!' },
    { id: 3, title: 'Администрация', content: 'Сегодня был пойман опасный преступник' },
    { id: 4, title: 'Администрация', content: 'Сегодня на площади Ленина состоится концерт' },
    { id: 5, title: 'Вася Пупкин', content: 'Вы все уроды хихихи' },
  ];
}