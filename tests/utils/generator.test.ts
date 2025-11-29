import { describe, it, expect, beforeEach } from 'vitest';
import { ClassNameGenerator } from '../../src/utils/generator';

describe('ClassNameGenerator', () => {
  describe('Random Mode', () => {
    let generator: ClassNameGenerator;

    beforeEach(() => {
      generator = new ClassNameGenerator('random', 5, 12345);
    });

    it('should generate random class names', () => {
      const name1 = generator.generate();
      const name2 = generator.generate();

      expect(name1).toBeTruthy();
      expect(name2).toBeTruthy();
      expect(name1).not.toBe(name2);
    });

    it('should generate class names with correct length', () => {
      const name = generator.generate();
      expect(name.length).toBe(5);
    });

    it('should start with a letter', () => {
      const name = generator.generate();
      expect(name[0]).toMatch(/[a-zA-Z]/);
    });

    it('should not generate duplicate names', () => {
      const names = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const name = generator.generate();
        expect(names.has(name)).toBe(false);
        names.add(name);
      }
    });

    it('should generate consistent names with same seed', () => {
      const gen1 = new ClassNameGenerator('random', 5, 12345);
      const gen2 = new ClassNameGenerator('random', 5, 12345);

      const names1 = Array.from({ length: 10 }, () => gen1.generate());
      const names2 = Array.from({ length: 10 }, () => gen2.generate());

      expect(names1).toEqual(names2);
    });
  });

  describe('Simplify Mode', () => {
    let generator: ClassNameGenerator;

    beforeEach(() => {
      generator = new ClassNameGenerator('simplify');
    });

    it('should generate sequential class names', () => {
      expect(generator.generate()).toBe('a');
      expect(generator.generate()).toBe('b');
      expect(generator.generate()).toBe('c');
    });

    it('should handle overflow correctly', () => {
      const gen = new ClassNameGenerator('simplify');
      
      // Generate 26 names (a-z)
      for (let i = 0; i < 26; i++) {
        gen.generate();
      }
      
      // 27th should be 'aa'
      expect(gen.generate()).toBe('aa');
    });

    it('should reset correctly', () => {
      generator.generate();
      generator.generate();
      generator.reset();
      
      expect(generator.generate()).toBe('a');
    });
  });

  describe('Simplify-Seedable Mode', () => {
    it('should work like simplify mode', () => {
      const generator = new ClassNameGenerator('simplify-seedable');
      
      expect(generator.generate()).toBe('a');
      expect(generator.generate()).toBe('b');
      expect(generator.generate()).toBe('c');
    });
  });

  describe('Reset', () => {
    it('should reset counter and used names', () => {
      const generator = new ClassNameGenerator('simplify');
      
      generator.generate();
      generator.generate();
      generator.reset();
      
      const name = generator.generate();
      expect(name).toBe('a');
    });
  });
});
