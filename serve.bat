echo Nginx is running on http://localhost:8080
@echo off
docker run --rm -p 8080:80 -v "%~dp0dist:/usr/share/nginx/html" -v "%~dp0nginx.conf:/etc/nginx/conf.d/default.conf" nginx
pause