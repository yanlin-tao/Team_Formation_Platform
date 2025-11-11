# 配置文件说明

## 环境变量配置

### 1. 创建 `.env` 文件

在 `backend/` 目录下创建 `.env` 文件，复制 `.env.example` 并填入实际值：

```bash
cd backend
cp .env.example .env
```

### 2. 配置数据库连接

编辑 `.env` 文件，填入你的数据库凭证：

```env
# Database Host (Cloud SQL Public IP)
DB_HOST=34.172.159.62

# Database Port
DB_PORT=3306

# Database User
DB_USER=root

# Database Password (填入你的实际密码)
DB_PASSWORD=your_actual_password

# Database Name
DB_NAME=team001_db
```

### 3. 数据库连接信息

根据项目文档，数据库信息如下：

- **Host**: `34.172.159.62` (Cloud SQL Public IP)
- **Port**: `3306`
- **Database**: `team001_db`
- **User**: `root` (或你的用户名)
- **Password**: 需要从团队获取或使用你的个人凭证

### 4. 验证配置

运行后端服务器时，如果配置正确，健康检查端点应该返回：

```json
{
  "status": "healthy",
  "database": "connected"
}
```

如果返回 `"database": "disconnected"`，请检查：
1. `.env` 文件是否存在
2. 数据库密码是否正确
3. 网络连接是否正常
4. 数据库服务器是否可访问

### 5. 安全提示

⚠️ **重要**: `.env` 文件包含敏感信息，**不要**提交到 Git 仓库！

`.gitignore` 文件已经配置为忽略 `.env` 文件。

### 6. 测试连接

可以使用以下命令测试数据库连接：

```bash
python3 -c "
from config import DB_CONFIG
import mysql.connector
try:
    conn = mysql.connector.connect(**DB_CONFIG)
    print('✓ Database connection successful!')
    conn.close()
except Exception as e:
    print(f'✗ Database connection failed: {e}')
"
```

