export interface VoiceConfig {
  rate?: number
  pitch?: number
  volume?: number
}

export class LindiweVoiceEngine {
  private config: Required<VoiceConfig>
  private synth: SpeechSynthesis | null = null
  private initialized: boolean = false

  constructor(config: VoiceConfig = {}) {
    this.config = {
      rate: config.rate ?? 1.05,
      pitch: config.pitch ?? 0.85,
      volume: config.volume ?? 1.0,
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.synth = window.speechSynthesis
      this.initialized = true
    }
  }

  public speak(narrative: string): void {
    if (typeof window === 'undefined') return
    this.ensureInitialized()
    if (!this.synth) return
    this.synth.cancel()
    const utterance = new SpeechSynthesisUtterance(narrative)
    utterance.rate = this.config.rate
    utterance.pitch = this.config.pitch
    utterance.volume = this.config.volume
    utterance.lang = 'en-ZA'
    this.synth.speak(utterance)
  }

  public shutdown(): void {
    this.ensureInitialized()
    if (this.synth) this.synth.cancel()
  }
}
