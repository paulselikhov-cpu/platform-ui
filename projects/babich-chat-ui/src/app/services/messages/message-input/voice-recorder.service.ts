import { Injectable, signal } from '@angular/core';

export type RecordingState = 'idle' | 'recording' | 'processing';

@Injectable({ providedIn: 'root' })
export class VoiceRecorderService {

  state = signal<RecordingState>('idle');
  duration = signal<number>(0); // секунды

  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  get isRecording(): boolean {
    return this.state() === 'recording';
  }

  async startRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];
      this.duration.set(0);

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.start(100); // собираем chunks каждые 100мс
      this.state.set('recording');

      // таймер
      this.timer = setInterval(() => {
        this.duration.update(d => d + 1);
      }, 1000);

      return true;
    } catch (err) {
      console.error('Нет доступа к микрофону:', err);
      return false;
    }
  }

  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.state.set('processing');
      if (this.timer) clearInterval(this.timer);

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.getSupportedMimeType() });
        // останавливаем все треки микрофона
        this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
        this.mediaRecorder = null;
        this.state.set('idle');
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording() {
    if (this.timer) clearInterval(this.timer);
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
      this.mediaRecorder = null;
    }
    this.chunks = [];
    this.duration.set(0);
    this.state.set('idle');
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
  }
}