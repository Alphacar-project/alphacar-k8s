import { render, screen } from '@testing-library/react';
import Home from '../../app/page';

describe('Home Page', () => {
  test('renders home page', () => {
    render(<Home />);
    // 기본 렌더링 테스트
    expect(true).toBe(true);
  });
});
