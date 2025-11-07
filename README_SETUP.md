# TeamUp UIUC! - Setup Instructions

## 项目结构

```
.
├── frontend/          # React前端应用
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   ├── components/ # 可复用组件
│   │   └── services/ # API服务
│   └── package.json
├── backend/           # FastAPI后端应用
│   ├── main.py       # 主应用文件
│   └── requirements.txt
└── README_SETUP.md   # 本文件
```

## 前端设置

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

前端将在 `http://localhost:3000` 运行

## 后端设置

### 1. 创建虚拟环境（推荐）

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置数据库

复制 `.env.example` 为 `.env` 并填入数据库连接信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
DB_HOST=34.172.159.62
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=team001_db
```

### 4. 运行后端服务器

```bash
python main.py
```

或者使用 uvicorn：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端将在 `http://localhost:8000` 运行

## API文档

后端启动后，可以访问：
- API文档: `http://localhost:8000/docs`
- 替代文档: `http://localhost:8000/redoc`

## 功能说明

### Entry页面 (`/`)
- 显示热门帖子列表
- 搜索栏（功能待完善）
- 左侧导航菜单
- 点击帖子卡片可跳转到Post页面

### Post页面 (`/posts/:postId`)
- 显示帖子详细信息
- 显示作者、课程、班级信息
- 显示所需技能
- 发送加入请求功能

## 数据库表结构

确保数据库中有以下表：
- `Post` - 帖子表
- `User` - 用户表
- `Team` - 团队表
- `Course` - 课程表
- `Section` - 班级表
- `MatchRequest` - 匹配请求表
- `PostSkill` - 帖子技能关联表
- `Skill` - 技能表

## 注意事项

1. 确保数据库连接信息正确
2. 确保数据库表已创建并包含数据
3. 前端和后端需要同时运行
4. 如果遇到CORS错误，检查后端CORS配置

## 下一步开发

- [ ] 实现用户认证（JWT）
- [ ] 完善搜索功能
- [ ] 添加更多筛选选项
- [ ] 实现通知功能
- [ ] 添加个人资料页面

