import { Component, inject, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { ChatDesktop } from '../desktop/chat-desktop/chat-desktop';
import { ChatMobile } from '../mobile/chat-mobile/chat-mobile';

/**
 * Обёртка которая определяет показывать desktop или mobile layout.
 * BreakpointObserver реактивно отслеживает размер экрана.
 */
@Component({
  selector: 'app-chat-layout',
  imports: [AsyncPipe, ChatDesktop, ChatMobile],
  template: `
    @if (isMobile$ | async) {
      <app-chat-mobile />
    } @else {
      <app-chat-desktop />
    }
  `
})
export class ChatLayout {
  private breakpoint = inject(BreakpointObserver);

  isMobile$ = this.breakpoint
    .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));
}