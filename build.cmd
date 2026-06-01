@echo off
REM 双击运行：npm run build（生成 dist/，本地调试加载用）
REM 产物目录：与本文件同级的 dist\

setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [build] 未检测到 Node.js，请先安装 Node 18+：https://nodejs.org/
  pause
  exit /b 1
)

echo.
echo [%TIME%] 本地构建: npm run build
echo 输出目录: "%~dp0dist"
echo.

call npm run build
set "EXIT=%ERRORLEVEL%"

echo.
if %EXIT% neq 0 (
  echo [失败] 退出码 %EXIT%，请向上查看报错。
) else (
  echo [完成] 在 chrome://extensions/ 对已加载的扩展点「重新加载」即可生效。
  echo [完成] 产物: "%~dp0dist"
)

echo.
pause
exit /b %EXIT%
