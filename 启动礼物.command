#!/bin/bash
cd "$(dirname "$0")" || exit 1
PORT=8765
# 关掉可能已在运行的旧服务
lsof -ti tcp:$PORT 2>/dev/null | xargs kill 2>/dev/null
python3 -m http.server $PORT >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1
open "http://localhost:$PORT/index.html"
echo "礼物已打开：http://localhost:$PORT/index.html"
echo "（这个窗口保持打开即可；关闭窗口会停止本地服务）"
read -r -p "按回车键停止服务…"
kill $SERVER_PID 2>/dev/null
