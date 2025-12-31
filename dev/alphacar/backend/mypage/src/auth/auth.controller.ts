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
    // ✅ OAuth 리다이렉트는 public domain 사용 (alphacar.cloud)
    // Google Cloud Console에 등록된 URI와 정확히 일치해야 함 (슬래시 없음)
    const REDIRECT_URI = 'https://alphacar.cloud'; 

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

  // ✅ 3. 구글 로그인 시작 (GET /auth/google)
  @Get('google')
  googleLogin(@Res() res: Response) {
    const GOOGLE_CLIENT_ID = "1030657487130-g7891k55pfhijc8gh1kedccnkf75v2qf.apps.googleusercontent.com";
    // ✅ Google OAuth는 public domain만 허용하므로 항상 alphacar.cloud 사용
    // private IP (192.168.x.x)는 Google OAuth에서 허용되지 않음
    // Google Cloud Console에 등록된 URI와 정확히 일치해야 함 (슬래시 없음)
    const REDIRECT_URI = 'https://alphacar.cloud';

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'email profile',
      state: 'google',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.redirect(googleAuthUrl);
  }

  // ✅ 4. 구글 로그인 콜백 처리 (POST /auth/google-login)
  @Post('google-login')
  async googleLoginCallback(@Body() body: any) {
    const code = body?.code;
    const redirectUri = body?.redirect_uri;
    return this.authService.googleLogin(code, redirectUri);
  }

  // ✅ 이메일 회원가입
  @Post('register')
  async register(@Body() body: { email: string; password: string; nickname: string }) {
    return this.authService.register(body.email, body.password, body.nickname);
  }

  // ✅ 이메일 로그인
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
