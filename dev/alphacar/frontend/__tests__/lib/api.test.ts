/**
 * API 유틸리티 함수 테스트
 * SonarQube 커버리지 향상을 위한 테스트
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import api, { fetchMainData, fetchBrands, fetchBrandsWithLogo } from '../../lib/api';

describe('API Utilities', () => {
  let mockGet: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // api 인스턴스의 get 메서드를 spy
    mockGet = jest.spyOn(api, 'get');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchMainData', () => {
    test('브랜드 없이 메인 데이터 조회', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockGet.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData();
      
      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith('/api/main', { params: {} });
    });

    test('브랜드와 함께 메인 데이터 조회', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockGet.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('현대');
      
      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith('/api/main', { params: { brand: '현대' } });
    });

    test('전체 브랜드일 때는 params 없이 호출', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockGet.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('전체');
      
      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith('/api/main', { params: {} });
    });

    test('all 브랜드일 때는 params 없이 호출', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockGet.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('all');
      
      expect(result).toEqual(mockData);
      expect(mockGet).toHaveBeenCalledWith('/api/main', { params: {} });
    });
  });

  describe('fetchBrands', () => {
    test('브랜드 목록 조회', async () => {
      const mockBrands = [
        { name: '현대' },
        { name: '기아' },
      ];
      
      mockGet.mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrands();
      
      expect(result).toEqual(mockBrands);
      // params가 없으면 undefined가 아니라 아예 전달되지 않을 수 있음
      expect(mockGet).toHaveBeenCalled();
      const calls = mockGet.mock.calls;
      expect(calls[0][0]).toBe('/api/brands');
    });
  });

  describe('fetchBrandsWithLogo', () => {
    test('로고 포함 브랜드 목록 조회', async () => {
      const mockBrands = [
        { name: '현대', logo_url: 'https://example.com/hyundai.png' },
        { name: '기아', logo_url: 'https://example.com/kia.png' },
      ];
      
      mockGet.mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrandsWithLogo();
      
      expect(result).toEqual(mockBrands);
      // params가 없으면 undefined가 아니라 아예 전달되지 않을 수 있음
      expect(mockGet).toHaveBeenCalled();
      const calls = mockGet.mock.calls;
      expect(calls[0][0]).toBe('/api/brands');
    });
  });

  describe('API 인스턴스', () => {
    test('api 인스턴스가 생성되어야 함', () => {
      expect(api).toBeDefined();
      expect(api.defaults).toBeDefined();
      expect(api.get).toBeDefined();
    });
  });
});
