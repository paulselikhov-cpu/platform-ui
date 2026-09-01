import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DistrictService } from '../../services/backend-services/http/district.service';
import { District } from '../../models/district/district.interface';
import { ChatUserService } from '../../services/backend-services/http/chat-user.service';
import { CurrentChatUserService } from '../../services/current-chat-user.service';
import { AuthService } from '../../services/backend-services/base/auth.service';
import { IChatUser } from '../../models/chatUser/chatUser.interface';

/**
 * Экран выбора района после главного меню.
 *
 * Логика:
 * 1. Загружает список районов с сервера
 * 2. Пользователь кликает на район → он становится "выбранным"
 * 3. Для выбранного района проверяется наличие персонажа (ChatUser)
 * 4. Если персонаж есть — карточка района показывает его профиль + кнопка «Войти»
 * 5. Если персонажа нет — карточка района показывает кнопку «Создать персонажа»
 *
 * «Профиль персонажа» и «район» связаны визуально: профиль встроен в карточку района.
 */
@Component({
  selector: 'app-district-select',
  imports: [],
  templateUrl: './district-select.html',
  styleUrl: './district-select.scss'
})
export class DistrictSelect implements OnInit {
  private router = inject(Router);
  private districtService = inject(DistrictService);
  private chatUserService = inject(ChatUserService);
  private currentChatUserService = inject(CurrentChatUserService);
  private authService = inject(AuthService);

  districts = signal<District[]>([]);
  loading = signal(true);

  /** Район, который пользователь выбрал кликом */
  selectedDistrict = signal<District | null>(null);

  /** Персонаж в выбранном районе (null = ещё не загружали или не найден) */
  characterForSelected = signal<IChatUser | null>(null);
  /** Статус загрузки персонажа */
  checkingCharacter = signal(false);

  ngOnInit() {
    this.districtService.getAllDistricts().subscribe({
      next: (districts) => {
        this.districts.set(districts);
        this.loading.set(false);

        // Если уже есть выбранный район (из localStorage) — подсветить его
        const savedDistrictId = this.currentChatUserService.selectedDistrictId();
        if (savedDistrictId) {
          const saved = districts.find(d => d.id === savedDistrictId);
          if (saved) {
            this.onDistrictSelected(saved);
          }
        }
      },
      error: () => this.loading.set(false)
    });
  }

  /**
   * Обработчик клика по карточке района.
   */
  selectDistrict(district: District) {
    this.onDistrictSelected(district);
  }

  /**
   * Устанавливает район как выбранный, сохраняет districtId, загружает персонажа.
   */
  private onDistrictSelected(district: District) {
    this.selectedDistrict.set(district);
    this.currentChatUserService.setDistrictId(district.id);
    this.loadCharacterForDistrict(district.id);
  }

  /**
   * Загружает персонажа для района через API.
   */
  private loadCharacterForDistrict(districtId: number) {
    this.checkingCharacter.set(true);
    this.characterForSelected.set(null);

    const authUser = this.authService.currentUser();
    if (!authUser?.userId) {
      this.checkingCharacter.set(false);
      return;
    }

    this.chatUserService.getChatUserByUserIdAndDistrict(authUser.userId, districtId).subscribe({
      next: (chatUser) => {
        this.characterForSelected.set(chatUser ?? null);
        this.checkingCharacter.set(false);
      },
      error: () => {
        this.characterForSelected.set(null);
        this.checkingCharacter.set(false);
      }
    });
  }

  /** Вход в игру с существующим персонажем */
  enterDistrict() {
    this.router.navigate(['/chat']);
  }

  /** Создать персонажа в выбранном районе */
  createCharacter() {
    this.router.navigate(['/character-create']);
  }

  goBack() {
    this.router.navigate(['/main-menu']);
  }
}