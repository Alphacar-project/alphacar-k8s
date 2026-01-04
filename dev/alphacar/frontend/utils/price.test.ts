import { formatPrice, formatPriceRange, calculateDiscountRate } from './price';

describe('price utils', () => {
  describe('formatPrice', () => {
    it('정상적인 숫자를 천 단위 콤마로 포맷팅', () => {
      expect(formatPrice(1000000)).toBe('1,000,000원');
      expect(formatPrice(50000)).toBe('50,000원');
      expect(formatPrice(1000)).toBe('1,000원');
    });

    it('0을 처리', () => {
      expect(formatPrice(0)).toBe('0원');
    });

    it('잘못된 입력값 처리', () => {
      expect(formatPrice(NaN)).toBe('0원');
      expect(formatPrice(Infinity)).toBe('Infinity원');
    });
  });

  describe('formatPriceRange', () => {
    it('정상적인 가격 범위 포맷팅', () => {
      expect(formatPriceRange(1000000, 2000000)).toBe('1,000,000원 ~ 2,000,000원');
      expect(formatPriceRange(50000, 100000)).toBe('50,000원 ~ 100,000원');
    });
  });

  describe('calculateDiscountRate', () => {
    it('정상적인 할인율 계산', () => {
      expect(calculateDiscountRate(1000000, 800000)).toBe(20);
      expect(calculateDiscountRate(1000000, 500000)).toBe(50);
      expect(calculateDiscountRate(1000000, 900000)).toBe(10);
    });

    it('할인이 없는 경우', () => {
      expect(calculateDiscountRate(1000000, 1000000)).toBe(0);
      expect(calculateDiscountRate(1000000, 1200000)).toBe(0);
    });

    it('잘못된 입력값 처리', () => {
      expect(calculateDiscountRate(0, 100000)).toBe(0);
      expect(calculateDiscountRate(-1000, 100000)).toBe(0);
      expect(calculateDiscountRate(1000000, -1000)).toBe(0);
    });
  });
});

