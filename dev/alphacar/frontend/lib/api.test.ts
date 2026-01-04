/**
 * API 유틸리티 함수 테스트
 * SonarQube 커버리지 향상을 위한 테스트
 */

// Mock 설정 (api.ts import 전에 설정해야 함)
// jest.mock은 hoisting되므로 내부에서 직접 객체 생성
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: {
      baseURL: '',
      headers: { 'Content-Type': 'application/json' },
    },
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
    // 테스트에서 사용할 수 있도록 export
    __mockAxiosInstance: mockAxiosInstance,
  };
});

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

// api.ts를 mock 설정 후에 import
import { fetchMainData, fetchBrands, fetchQuoteInitData, saveQuote } from './api';
import axios from 'axios';

// mock 인스턴스 가져오기
const mockAxiosInstance = (axios as any).__mockAxiosInstance;

describe('lib/api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMainData', () => {
    it('should fetch main data without brand filter', async () => {
      const mockData = {
        welcomeMessage: 'Welcome',
        banners: [],
        shortcuts: [],
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/main', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should fetch main data with brand filter', async () => {
      const mockData = {
        welcomeMessage: 'Welcome',
        banners: [],
        shortcuts: [],
      };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('현대');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/main', { params: { brand: '현대' } });
      expect(result).toEqual(mockData);
    });

    it('should not filter when brand is "전체"', async () => {
      const mockData = { welcomeMessage: 'Welcome', banners: [], shortcuts: [] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      
      await fetchMainData('전체');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/main', { params: {} });
    });

    it('should not filter when brand is "all"', async () => {
      const mockData = { welcomeMessage: 'Welcome', banners: [], shortcuts: [] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      
      await fetchMainData('all');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/main', { params: {} });
    });
  });

  describe('fetchBrands', () => {
    it('should fetch brands list', async () => {
      const mockBrands = [{ name: '현대' }, { name: '기아' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrands();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/brands');
      expect(result).toEqual(mockBrands);
    });
  });

  describe('fetchQuoteInitData', () => {
    it('should fetch quote init data', async () => {
      const mockData = { message: 'test', models: [], trims: [] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      
      const result = await fetchQuoteInitData();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/quote');
      expect(result).toEqual(mockData);
    });
  });

  describe('saveQuote', () => {
    it('should save quote', async () => {
      const mockPayload = { model: 'test', trim: 'test' };
      const mockResponse = { success: true, message: 'saved', id: '123' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });
      
      const result = await saveQuote(mockPayload);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/quote/save', mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });
});

