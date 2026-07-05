import {
  Component, input, output, signal, inject,
  HostListener, ElementRef, ViewChild
} from '@angular/core';
import { EmojiPanel } from './panels/emoji-panel/emoji-panel';
import { VoiceRecorderService } from '../../../core/services/voice-recorder.service';
import { IAttachment, InputPanelType } from '../../../models/chat/input-panel.interface';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

@Component({
  selector: 'app-message-input',
  imports: [EmojiPanel],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss'
})
export class MessageInput {
  private elRef = inject(ElementRef);
  private voiceRecorder = inject(VoiceRecorderService);

  // inputs
  roomName = input<string>('');
  roomId = input<string>('');
  disabled = input<boolean>(false);

  // outputs
  send = output<string>();
  sendFile = output<File>();
  sendVoice = output<Blob>();

  // состояние
  message = signal('');
  activePanel = signal<InputPanelType>(null);
  attachments = signal<IAttachment[]>([]);
  fileError = signal('');

  // голосовая запись
  readonly voiceState = this.voiceRecorder.state;
  readonly voiceDuration = this.voiceRecorder.duration;
  isSwipingToCancel = signal(false);
  private touchStartX = 0;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textInput') textInput!: ElementRef<HTMLTextAreaElement>;

  // typing throttle
  private lastTypingSent = 0;

  get hasText(): boolean {
    return this.message().trim().length > 0;
  }

  get showSendBtn(): boolean {
    return this.hasText || this.attachments().length > 0;
  }

  // ─── текст ────────────────────────────────────────────────────────────────

  onInput(value: string) {
    this.message.set(value);
    this.autoResize();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSend() {
    const text = this.message().trim();
    if (!text && this.attachments().length === 0) return;

    if (text) this.send.emit(text);

    this.attachments().forEach(a => this.sendFile.emit(a.file));

    this.message.set('');
    this.attachments.set([]);
    this.resetTextarea();
  }

  // ─── emoji ────────────────────────────────────────────────────────────────

  togglePanel(panel: InputPanelType) {
    this.activePanel.set(this.activePanel() === panel ? null : panel);
  }

  onEmojiSelected(emoji: string) {
    this.message.update(m => m + emoji);
    this.textInput?.nativeElement.focus();
  }

  // ─── файлы ────────────────────────────────────────────────────────────────

  openFilePicker() {
    this.fileInput?.nativeElement.click();
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.fileError.set('');

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        this.fileError.set(`${file.name} превышает 100MB`);
        continue;
      }

      const preview = file.type.startsWith('image/')
        ? await this.readAsDataUrl(file)
        : null;

      const type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'file';

      this.attachments.update(prev => [...prev, { file, preview, type }]);
    }

    input.value = ''; // сброс чтобы можно было выбрать тот же файл
  }

  removeAttachment(index: number) {
    this.attachments.update(prev => prev.filter((_, i) => i !== index));
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  // ─── голос ────────────────────────────────────────────────────────────────

  async onVoiceMouseDown() {
    await this.voiceRecorder.startRecording();
  }

  async onVoiceMouseUp() {
    if (!this.voiceRecorder.isRecording) return;
    const blob = await this.voiceRecorder.stopRecording();
    if (blob && this.voiceRecorder.duration() >= 1) {
      this.sendVoice.emit(blob);
    }
  }

  onVoiceTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.voiceRecorder.startRecording();
  }

  onVoiceTouchMove(event: TouchEvent) {
    const dx = this.touchStartX - event.touches[0].clientX;
    this.isSwipingToCancel.set(dx > 50); // смахнуть на 50px влево = отмена
  }

  async onVoiceTouchEnd() {
    if (this.isSwipingToCancel()) {
      this.voiceRecorder.cancelRecording();
      this.isSwipingToCancel.set(false);
      return;
    }
    const blob = await this.voiceRecorder.stopRecording();
    if (blob) this.sendVoice.emit(blob);
    this.isSwipingToCancel.set(false);
  }

  cancelVoice() {
    this.voiceRecorder.cancelRecording();
    this.isSwipingToCancel.set(false);
  }

  formatDuration(s: number): string {
    return this.voiceRecorder.formatDuration(s);
  }

  // ─── утилиты ──────────────────────────────────────────────────────────────

  private autoResize() {
    const el = this.textInput?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'; // макс 5 строк
  }

  private resetTextarea() {
    const el = this.textInput?.nativeElement;
    if (el) el.style.height = 'auto';
  }

  // клик вне компонента — закрываем панели
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.activePanel.set(null);
    }
  }
}