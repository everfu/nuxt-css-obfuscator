import type { ObfuscationMode } from '../types';

export class ClassNameGenerator {
  private mode: ObfuscationMode;
  private classLength: number;
  private seed: number;
  private counter: number = 0;
  private usedNames: Set<string> = new Set();
  private simplifyAlphabet: string;

  constructor(mode: ObfuscationMode = 'random', classLength: number = 5, seed?: number) {
    this.mode = mode;
    this.classLength = classLength;
    this.seed = seed ?? Date.now();
    this.counter = 0;
    this.simplifyAlphabet = this.createSimplifyAlphabet(seed);
  }

  private createSimplifyAlphabet(seed?: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    if (this.mode !== 'simplify-seedable' || seed === undefined) return chars.join('');
    let state = seed >>> 0;
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    for (let index = chars.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [chars[index], chars[target]] = [chars[target], chars[index]];
    }
    return chars.join('');
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
    const chars = this.simplifyAlphabet;
    let num = this.counter++;
    let result = '';
    
    do {
      result = chars[num % 26] + result;
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    
    return result;
  }

  reserve(names: Iterable<string>): void {
    for (const name of names) this.usedNames.add(name);
  }

  generate(): string {
    let name: string;
    
    switch (this.mode) {
      case 'simplify':
      case 'simplify-seedable':
        do {
          name = this.generateSimplified();
        } while (this.usedNames.has(name));
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
