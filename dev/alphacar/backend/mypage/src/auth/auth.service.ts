import { Injectable, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  // ✅ 환경변수에서 BASE_URL을 가져오거나 기본값 사용
  // 포트 제거: 프론트엔드와 일치하도록 포트 없이 사용
  // redirect_uri는 항상 https://alphacar.cloud/mypage로 고정 (카카오/구글 개발자 콘솔 등록과 일치)
  private readonly baseUrl = (() => {
    // BASE_URL 환경변수가 있으면 사용, 없으면 기본값
    const url = process.env.BASE_URL || 'https://alphacar.cloud';
    // 포트가 있으면 제거 (예: https://alphacar.cloud:31443 -> https://alphacar.cloud)
    let cleanedUrl = url.replace(/:\d+$/, '');
    // https://alphacar.cloud로 강제 설정 (카카오/구글 개발자 콘솔 등록과 일치)
    if (cleanedUrl.includes('alphacar.cloud')) {
      cleanedUrl = 'https://alphacar.cloud';
    }
    return cleanedUrl;
  })();

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  // 🟡 카카오 로그인
  async kakaoLogin(code: string, redirectUri?: string) {
    const kakaoTokenUrl = 'https://kauth.kakao.com/oauth/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', '342d0463be260fc289926a0c63c4badc');
    
    // ✅ 프론트엔드에서 전달한 redirect_uri 사용, 없으면 기본값
    let finalRedirectUri = redirectUri || `${this.baseUrl}/mypage`;
    if (finalRedirectUri) {
      // 포트 번호 제거 (예: https://alphacar.cloud:31443/mypage -> https://alphacar.cloud/mypage)
      finalRedirectUri = finalRedirectUri.replace(/:\d+(\/|$)/, '$1');
    }
    
    params.append('redirect_uri', finalRedirectUri);
    params.append('code', code);

    let accessToken = '';
    try {
      const response = await firstValueFrom(
        this.httpService.post(kakaoTokenUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      accessToken = response.data.access_token;
    } catch (e: any) {
      this.logger.error('카카오 토큰 발급 실패');
      this.logger.error(`  - HTTP Status: ${e.response?.status || 'N/A'}`);
      this.logger.error(`  - 카카오 API 응답: ${JSON.stringify(e.response?.data || e.message, null, 2)}`);
      this.logger.error(`  - 사용한 redirect_uri: ${finalRedirectUri}`);
      this.logger.error(`  - 받은 code: ${code?.substring(0, 10)}...`);
      throw new BadRequestException({
        message: '카카오 토큰 발급 실패',
        error: e.response?.data || { error: e.message },
        statusCode: 400,
      });
    }

    const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
    let kakaoUser;
    try {
      const response = await firstValueFrom(
        this.httpService.get(userInfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      kakaoUser = response.data;
    } catch (e) {
      throw new BadRequestException('카카오 유저 정보 조회 실패');
    }

    return this.saveUser(kakaoUser.id.toString(), kakaoUser.properties?.nickname, kakaoUser.kakao_account?.email, 'kakao');
  }

  // 🔵 [추가] 구글 로그인 로직
  async googleLogin(code: string, redirectUri?: string) {
    const googleTokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    
    // ⭐ [필수] 구글 클라우드 콘솔에서 발급받은 키 입력
    params.append('client_id', '1030657487130-g7891k55pfhijc8gh1kedccnkf75v2qf.apps.googleusercontent.com'); 
    params.append('client_secret', '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'); 
    
    // ✅ 프론트엔드에서 전달한 redirect_uri 사용, 없으면 기본값
    let finalRedirectUri = redirectUri || `${this.baseUrl}/mypage`;
    if (finalRedirectUri) {
      // 포트 번호 제거 (예: https://alphacar.cloud:31443/mypage -> https://alphacar.cloud/mypage)
      finalRedirectUri = finalRedirectUri.replace(/:\d+(\/|$)/, '$1');
    }
    
    params.append('redirect_uri', finalRedirectUri);
    params.append('code', code);

    let accessToken = '';
    try {
      const response = await firstValueFrom(
        this.httpService.post(googleTokenUrl, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
      accessToken = response.data.access_token;
    } catch (e: any) {
      this.logger.error('구글 토큰 발급 실패');
      this.logger.error(`  - HTTP Status: ${e.response?.status || 'N/A'}`);
      this.logger.error(`  - 구글 API 응답: ${JSON.stringify(e.response?.data || e.message, null, 2)}`);
      this.logger.error(`  - 사용한 redirect_uri: ${finalRedirectUri}`);
      this.logger.error(`  - 받은 code: ${code?.substring(0, 10)}...`);
      throw new BadRequestException({
        message: '구글 로그인 실패',
        error: e.response?.data || { error: e.message },
        statusCode: 400,
      });
    }

    const { data: googleUser } = await firstValueFrom(
      this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );

    return this.saveUser(googleUser.id, googleUser.name, googleUser.email, 'google');
  }

  // ✅ 이메일 회원가입
  async register(email: string, password: string, nickname: string) {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({ 
      where: { email, provider: 'email' } 
    });

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // socialId는 이메일 기반으로 생성 (고유성 보장)
    const socialId = `email_${email}`;

    // 새 사용자 생성
    const user = this.userRepository.create({
      socialId,
      email,
      password: hashedPassword,
      nickname,
      provider: 'email',
      point: 0,
      quoteCount: 0,
    });

    await this.userRepository.save(user);

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({ sub: socialId, provider: 'email' });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        point: user.point,
        quoteCount: user.quoteCount,
      },
    };
  }

  // ✅ 이메일 로그인
  async login(email: string, password: string) {
    // 이메일로 사용자 찾기
    const user = await this.userRepository.findOne({ 
      where: { email, provider: 'email' } 
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({ sub: user.socialId, provider: 'email' });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        provider: user.provider,
        point: user.point,
        quoteCount: user.quoteCount,
        socialId: user.socialId,
      },
    };
  }

  // 🛠️ 공통 저장 함수
  private async saveUser(socialId: string, nickname: string, email: string, provider: string) {
    // ✅ 원래 socialId로 DB 조회/저장
    let user = await this.userRepository.findOne({ where: { socialId } });

    if (!user) {
      user = this.userRepository.create({
        socialId, // ✅ 카카오/구글의 원래 socialId 저장
        nickname,
        email,
        provider,
        point: 0,
        quoteCount: 0,
      });
      await this.userRepository.save(user);
    }

    // ✅ 2.0.1 로직: JWT 토큰에 socialId를 포함하여 생성
    // MockAuthGuard가 토큰 전체를 socialId로 사용하므로, 토큰 자체를 socialId로 사용
    const accessToken = this.jwtService.sign({ sub: socialId, provider });
    return { access_token: accessToken, user };
  }
}
