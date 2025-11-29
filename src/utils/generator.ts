import type { ObfuscationMode } from '../types';

export class ClassNameGenerator {
  private mode: ObfuscationMode;
  private classLength: number;
  private seed: number;
  private counter: number = 0;
  private usedNames: Set<string> = new Set();

  constructor(mode: ObfuscationMode = 'random', classLength: number = 5, seed?: number) {
    this.mode = mode;
    this.classLength = classLength;
    this.seed = seed ?? Date.now();
    this.counter = 0;
  }

  private seededRandom(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const allChars = chars + '0123456789';
    let result = chars[Math.floor(this.seededRandom() * chars.length)];
    
    for (let i = 1; i < length; i++) {
      result += allChars[Math.floor(this.seededRandom() * allChars.length)];
    }
    
    return result;
  }

  private generateSimplified(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let num = this.counter++;
    let result = '';
    
    do {
      result = chars[num % 26] + result;
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    
    return result;
  }

  generate(): string {
    let name: string;
    
    switch (this.mode) {
      case 'simplify':
      case 'simplify-seedable':
        name = this.generateSimplified();
        break;
      case 'random':
      default:
        do {
          name = this.generateRandomString(this.classLength);
        } while (this.usedNames.has(name));
        break;
    }
    
    this.usedNames.add(name);
    return name;
  }

  reset() {
    this.counter = 0;
    this.usedNames.clear();
  }
}
