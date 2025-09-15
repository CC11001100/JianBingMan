#!/bin/bash

# 煎饼侠启动脚本
# 功能：一键启动煎饼计时器服务，自动处理进程管理

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="煎饼侠"
PORT=52459
DEV_COMMAND="npm run dev"

echo -e "${BLUE}=== ${PROJECT_NAME} 启动脚本 ===${NC}"
echo -e "${BLUE}端口: ${PORT}${NC}"
echo ""

# 函数：检查并杀死占用端口的进程
kill_process_on_port() {
    local port=$1
    echo -e "${YELLOW}检查端口 ${port} 是否被占用...${NC}"
    
    # 查找占用端口的进程
    local pids=$(lsof -ti tcp:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}发现占用端口 ${port} 的进程: ${pids}${NC}"
        echo -e "${YELLOW}正在终止这些进程...${NC}"
        
        # 尝试优雅地终止进程
        for pid in $pids; do
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}终止进程 ${pid}...${NC}"
                kill $pid 2>/dev/null || true
                sleep 1
                
                # 如果进程还在运行，强制杀死
                if ps -p $pid > /dev/null 2>&1; then
                    echo -e "${RED}强制杀死进程 ${pid}...${NC}"
                    kill -9 $pid 2>/dev/null || true
                fi
            fi
        done
        
        # 等待端口释放
        echo -e "${YELLOW}等待端口释放...${NC}"
        sleep 2
        
        # 再次检查端口是否被释放
        local remaining_pids=$(lsof -ti tcp:$port 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${RED}警告: 端口 ${port} 仍被进程占用: ${remaining_pids}${NC}"
            echo -e "${RED}请手动处理这些进程或稍后重试${NC}"
            exit 1
        else
            echo -e "${GREEN}端口 ${port} 已成功释放${NC}"
        fi
    else
        echo -e "${GREEN}端口 ${port} 未被占用${NC}"
    fi
}

# 函数：检查Node.js和npm
check_dependencies() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未找到 npm，请先安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Node.js 版本: $(node --version)${NC}"
    echo -e "${GREEN}npm 版本: $(npm --version)${NC}"
}

# 函数：安装依赖
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}node_modules 目录不存在，正在安装依赖...${NC}"
        npm install
    else
        echo -e "${GREEN}依赖已安装${NC}"
    fi
}

# 函数：启动服务
start_service() {
    echo -e "${YELLOW}正在启动 ${PROJECT_NAME} 服务...${NC}"
    echo -e "${BLUE}访问地址: http://localhost:${PORT}${NC}"
    echo -e "${BLUE}按 Ctrl+C 停止服务${NC}"
    echo ""
    
    # 启动开发服务器
    $DEV_COMMAND
}

# 主程序
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        echo -e "${RED}错误: 当前目录不是项目根目录，请在项目根目录执行此脚本${NC}"
        exit 1
    fi
    
    # 检查package.json中的项目名称
    if ! grep -q "jianbingman" package.json; then
        echo -e "${RED}错误: 这不是煎饼侠项目目录${NC}"
        exit 1
    fi
    
    # 执行检查和启动流程
    check_dependencies
    kill_process_on_port $PORT
    install_dependencies
    start_service
}

# 设置陷阱处理Ctrl+C
trap 'echo -e "\n${YELLOW}正在停止服务...${NC}"; kill_process_on_port $PORT; echo -e "${GREEN}服务已停止${NC}"; exit 0' INT

# 执行主程序
main "$@"
