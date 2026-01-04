/**
 * 가격 관련 유틸리티 함수
 */

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환
 * @param price 가격 숫자
 * @returns 포맷된 가격 문자열 (예: "1,000,000원")
 */
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '0원';
  }
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 가격 범위 문자열 생성
 * @param minPrice 최소 가격
 * @param maxPrice 최대 가격
 * @returns 가격 범위 문자열 (예: "1,000만원 ~ 2,000만원")
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  const formattedMin = formatPrice(minPrice);
  const formattedMax = formatPrice(maxPrice);
  return `${formattedMin} ~ ${formattedMax}`;
}

/**
 * 가격 할인율 계산
 * @param originalPrice 원가
 * @param discountedPrice 할인가
 * @returns 할인율 (퍼센트)
 */
export function calculateDiscountRate(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0 || discountedPrice < 0) {
    return 0;
  }
  if (discountedPrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

