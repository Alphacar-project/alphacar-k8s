// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth') // 경로: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ 1. 카카오 로그인 시작 (GET /auth/kakao)
  @Get('kakao')
  kakaoLogin(@Res() res: Response) {
    const KAKAO_CLIENT_ID = "342d0463be260fc289926a0c63c4badc";
    // ✅ 환경변수 BASE_URL 사용 (현재 환경: alphacar.cloud)
    // ✅ 프론트엔드와 일치하도록 포트 제거
    const baseUrl = (() => {
      const url = process.env.BASE_URL || 'https://alphacar.cloud';
      // 포트가 있으면 제거 (예: https://alphacar.cloud:31443 -> https://alphacar.cloud)
      return url.replace(/:\d+$/, '');
    })();
    const REDIRECT_URI = `${baseUrl}/mypage`; 

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    return res.redirect(kakaoAuthUrl); 
  }

  // ✅ 2. 카카오 로그인 콜백 처리 (POST /auth/kakao-login)
  @Post('kakao-login')
  async kakaoLoginCallback(@Body() body: any) {
    const code = body?.code;
    const redirectUri = body?.redirect_uri;
    return this.authService.kakaoLogin(code, redirectUri);
  }

  // ✅ [추가] 구글 로그인 (이게 없어서 404가 떴던 겁니다!)
  @Post('google-login')
  async googleLogin(@Body() body: any) {
    const code = body?.code;
    const redirectUri = body?.redirect_uri;
    return this.authService.googleLogin(code, redirectUri);
  }
}
