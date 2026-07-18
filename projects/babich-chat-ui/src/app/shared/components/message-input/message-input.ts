import {
  Component, input, output, signal, inject,
  HostListener, ElementRef, ViewChild
} from '@angular/core';
import { EmojiPanel } from './panels/emoji-panel/emoji-panel';
import { IAttachment, InputPanelType } from '../../../models/messages/message-input/message-input-panel.interface';
import { IcqEmoji, emojiUrl } from './emoji-data';
import { VoiceRecorderService } from './services/voice-recorder.service';
import { ChatWebSocketService } from '../../../services/backend-services/webSocket/chat-websocket.service';


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
  private chatWebSocketService = inject(ChatWebSocketService);

  // inputs
  readonly roomName = input<string>('');
  readonly roomId = input<number>();
  readonly disabled = input<boolean>(false);

  // outputs
  readonly send = output<string>();
  readonly sendFile = output<File>();
  readonly sendVoice = output<Blob>();

  // состояние
  readonly message = signal('');
  readonly activePanel = signal<InputPanelType>(null);
  readonly attachments = signal<IAttachment[]>([]);
  readonly fileError = signal('');

  // голосовая запись
  readonly voiceState = this.voiceRecorder.state;
  readonly voiceDuration = this.voiceRecorder.duration;
  readonly isSwipingToCancel = signal(false);
  private isRecordingActive = false;
  private touchStartX = 0;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('textInput') textInput!: ElementRef<HTMLDivElement>;

  // typing throttle
  private lastTypingSent = 0;
  private readonly TYPING_THROTTLE_MS = 2000;

  // последний известный Range внутри contenteditable (нужен, т.к. клик по
  // кнопке эмодзи-панели снимает фокус/selection с поля ввода)
  private lastRange: Range | null = null;

  get hasText(): boolean {
    return this.message().trim().length > 0;
  }

  get showSendBtn(): boolean {
    return this.hasText || this.attachments().length > 0;
  }

  // ─── текст ────────────────────────────────────────────────────────────────

  onContentInput() {
    this.syncMessageFromDom();
    this.saveSelection();
    this.autoResize();

    const now = Date.now();
    if (this.hasText && now - this.lastTypingSent > this.TYPING_THROTTLE_MS) {
      this.lastTypingSent = now;
      const roomId = this.roomId();
      if (roomId != null) {
        this.chatWebSocketService.sendTyping(String(roomId));
      }
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    if (event.shiftKey) {
      event.preventDefault();
      this.insertLineBreak();
      return;
    }

    event.preventDefault();
    this.onSend();
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

  onEmojiSelected(emoji: IcqEmoji) {
    // панель сворачивается сразу после выбора
    this.activePanel.set(null);
    this.insertEmoji(emoji);
  }

  private insertEmoji(emoji: IcqEmoji) {
    const el = this.textInput?.nativeElement;
    if (!el) return;

    el.focus();

    const sel = window.getSelection();
    let range: Range;

    if (this.lastRange && el.contains(this.lastRange.commonAncestorContainer)) {
      range = this.lastRange;
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // в конец
    }
    sel?.removeAllRanges();
    sel?.addRange(range);

    const img = document.createElement('img');
    img.src = emojiUrl(emoji.file);
    img.alt = emoji.code;
    img.title = emoji.title;
    img.className = 'message-input__emoji-inline';
    img.setAttribute('data-code', emoji.code);
    img.setAttribute('contenteditable', 'false');

    range.deleteContents();
    range.insertNode(img);

    // курсор сразу после вставленной картинки
    range.setStartAfter(img);
    range.setEndAfter(img);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);

    this.lastRange = range.cloneRange();

    this.syncMessageFromDom();
    this.autoResize();
  }

  private insertLineBreak() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const br = document.createElement('br');
    range.deleteContents();
    range.insertNode(br);
    range.setStartAfter(br);
    range.setEndAfter(br);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    this.lastRange = range.cloneRange();
    this.syncMessageFromDom();
    this.autoResize();
  }

  // сохраняем позицию курсора, пока фокус ещё внутри поля ввода
  saveSelection() {
    const sel = window.getSelection();
    const el = this.textInput?.nativeElement;
    if (sel && el && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (el.contains(range.commonAncestorContainer)) {
        this.lastRange = range.cloneRange();
      }
    }
  }

  // ─── сериализация contenteditable → строка с кодами эмодзи ────────────────

  private syncMessageFromDom() {
    const el = this.textInput?.nativeElement;
    this.message.set(el ? this.serialize(el) : '');
  }

  private serialize(node: Node): string {
    let result = '';
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent ?? '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const elChild = child as HTMLElement;
        if (elChild.tagName === 'IMG') {
          result += elChild.getAttribute('data-code') ?? '';
        } else if (elChild.tagName === 'BR') {
          result += '\n';
        } else if (elChild.tagName === 'DIV' || elChild.tagName === 'P') {
          // браузер иногда оборачивает новую строку в div
          result += (result && !result.endsWith('\n') ? '\n' : '') + this.serialize(elChild);
        } else {
          result += this.serialize(elChild);
        }
      }
    });
    return result;
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

  async onVoiceMouseDown(event: MouseEvent) {
    event.preventDefault();
    if (this.isRecordingActive) return;
    this.isRecordingActive = true;
    await this.voiceRecorder.startRecording();
  }

  async onVoiceMouseUp() {
    if (!this.isRecordingActive) return;
    this.isRecordingActive = false;
    if (!this.voiceRecorder.isRecording) return;
    const blob = await this.voiceRecorder.stopRecording();
    if (blob && this.voiceDuration() >= 1) {
      this.sendVoice.emit(blob);
    }
  }

  onVoiceTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.voiceRecorder.startRecording();
  }

  onVoiceTouchMove(event: TouchEvent) {
    const dx = this.touchStartX - event.touches[0].clientX;
    this.isSwipingToCancel.set(dx > 50);
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
    if (el) {
      el.innerHTML = '';
      el.style.height = 'auto';
    }
    this.lastRange = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.activePanel.set(null);
    }
  }

  async stopAndSendVoice() {
    this.isRecordingActive = false;
    const blob = await this.voiceRecorder.stopRecording();
    if (blob) {
      this.sendVoice.emit(blob);
    }
  }
}