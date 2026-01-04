/**
 * API 유틸리티 함수 테스트
 * SonarQube 커버리지 향상을 위한 테스트
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import api, { fetchMainData, fetchBrands, fetchBrandsWithLogo } from '../../lib/api';

// axios mock 설정
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMainData', () => {
    test('브랜드 없이 메인 데이터 조회', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockedAxios.get.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData();
      
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: {} });
    });

    test('브랜드와 함께 메인 데이터 조회', async () => {
      const mockData = {
        welcomeMessage: '테스트',
        banners: [],
        shortcuts: [],
      };
      
      mockedAxios.get.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('현대');
      
      expect(result).toEqual(mockData);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: { brand: '현대' } });
    });
  });

  describe('fetchBrands', () => {
    test('브랜드 목록 조회', async () => {
      const mockBrands = [
        { name: '현대' },
        { name: '기아' },
      ];
      
      mockedAxios.get.mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrands();
      
      expect(result).toEqual(mockBrands);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/brands', undefined);
    });
  });

  describe('fetchBrandsWithLogo', () => {
    test('로고 포함 브랜드 목록 조회', async () => {
      const mockBrands = [
        { name: '현대', logo_url: 'https://example.com/hyundai.png' },
        { name: '기아', logo_url: 'https://example.com/kia.png' },
      ];
      
      mockedAxios.get.mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrandsWithLogo();
      
      expect(result).toEqual(mockBrands);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/brands', undefined);
    });
  });

  describe('API 인스턴스', () => {
    test('api 인스턴스가 생성되어야 함', () => {
      expect(api).toBeDefined();
      expect(api.defaults.baseURL).toBe('');
    });
  });
});
