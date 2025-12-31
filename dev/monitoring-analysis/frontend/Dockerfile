FROM nginx:alpine

# 불필요한 파일 제거 및 최적화
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /etc/nginx/conf.d/default.conf

# HTML 파일 복사
COPY index.html /usr/share/nginx/html/

# Nginx 최적화 설정
RUN echo 'worker_processes auto;' > /etc/nginx/nginx.conf && \
    echo 'events { worker_connections 1024; }' >> /etc/nginx/nginx.conf && \
    echo 'http { include /etc/nginx/mime.types; default_type application/octet-stream;' >> /etc/nginx/nginx.conf && \
    echo 'sendfile on; tcp_nopush on; tcp_nodelay on; keepalive_timeout 65;' >> /etc/nginx/nginx.conf && \
    echo 'gzip on; gzip_types text/plain text/css application/json application/javascript;' >> /etc/nginx/nginx.conf && \
    echo 'server { listen 80; root /usr/share/nginx/html; index index.html;' >> /etc/nginx/nginx.conf && \
    echo 'location / { try_files $uri $uri/ /index.html; }' >> /etc/nginx/nginx.conf && \
    echo 'location /api { proxy_pass http://monitoring-analysis-backend:5000; }' >> /etc/nginx/nginx.conf && \
    echo '} }' >> /etc/nginx/nginx.conf

# 포트 노출
EXPOSE 80

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
