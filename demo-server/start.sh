#!/bin/bash
### 
# 启动 GPT‑Vis‑SSR
docker compose up -d

# 启动 mcp-server-chart
# VIS_REQUEST_SERVER="http://host.docker.internal:3000/render" \
VIS_REQUEST_SERVER="http://localhost:3000/render" \
mcp-server-chart --transport streamable &
chart_pid=$!

# 启动主服务
tsx watch --tsconfig ./tsconfig.dev.json src/index.ts &
app_pid=$!

# 捕获退出信号，优雅终止
trap "kill $chart_pid $app_pid" EXIT

wait