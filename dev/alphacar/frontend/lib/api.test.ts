/**
 * API 유틸리티 함수 테스트
 * SonarQube 커버리지 향상을 위한 테스트
 */

import { fetchMainData, fetchBrands, fetchQuoteInitData, saveQuote } from './api';
import axios from 'axios';

// Mock 설정
jest.mock('axios');
jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

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
      
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('should fetch main data with brand filter', async () => {
      const mockData = {
        welcomeMessage: 'Welcome',
        banners: [],
        shortcuts: [],
      };
      
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });
      
      const result = await fetchMainData('현대');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: { brand: '현대' } });
      expect(result).toEqual(mockData);
    });

    it('should not filter when brand is "전체"', async () => {
      const mockData = { welcomeMessage: 'Welcome', banners: [], shortcuts: [] };
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });
      
      await fetchMainData('전체');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: {} });
    });

    it('should not filter when brand is "all"', async () => {
      const mockData = { welcomeMessage: 'Welcome', banners: [], shortcuts: [] };
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });
      
      await fetchMainData('all');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/main', { params: {} });
    });
  });

  describe('fetchBrands', () => {
    it('should fetch brands list', async () => {
      const mockBrands = [{ name: '현대' }, { name: '기아' }];
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockBrands });
      
      const result = await fetchBrands();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/brands');
      expect(result).toEqual(mockBrands);
    });
  });

  describe('fetchQuoteInitData', () => {
    it('should fetch quote init data', async () => {
      const mockData = { message: 'test', models: [], trims: [] };
      mockedAxios.get = jest.fn().mockResolvedValue({ data: mockData });
      
      const result = await fetchQuoteInitData();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/quote');
      expect(result).toEqual(mockData);
    });
  });

  describe('saveQuote', () => {
    it('should save quote', async () => {
      const mockPayload = { model: 'test', trim: 'test' };
      const mockResponse = { success: true, message: 'saved', id: '123' };
      mockedAxios.post = jest.fn().mockResolvedValue({ data: mockResponse });
      
      const result = await saveQuote(mockPayload);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/quote/save', mockPayload);
      expect(result).toEqual(mockResponse);
    });
  });
});

