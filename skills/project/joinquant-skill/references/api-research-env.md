# 研究环境 API 参考

## 环境规格

- **类型**：IPython Notebook（类 Jupyter），Docker 隔离
- **Python 版本**：支持 Python 2、Python 3（推荐 Python 3）
- **内核选择**：Python 2、Python 3、PacVer 2.0

## 可用库

研究环境预装以下常用库：

| 类别 | 库 |
|------|-----|
| 数据处理 | numpy, pandas, scipy |
| 机器学习 | scikit-learn, statsmodels, xgboost, lightgbm |
| 可视化 | matplotlib, seaborn |
| 聚宽专用 | jqdata, jqfactor, jqlib |

## 文件读写

### write_file(path, data, append=False)
写入文件到研究环境的文件系统。

```python
# 写入文本
write_file('output/result.txt', '分析结果...')

# 写入 CSV（DataFrame）
import pandas as pd
df.to_csv('output/data.csv')

# 写入 JSON
import json
write_file('output/config.json', json.dumps(config, ensure_ascii=False))
```

- 上传限制：单文件 20MB
- 下载：无限制
- `append=True`：追加模式

### read_file(path)
读取研究环境中的文件。

```python
content = read_file('data/my_data.csv')
```

## 自定义模块

可以在研究环境根目录放置自定义 Python 模块，在 notebook 和策略中导入：

```python
# 假设研究环境根目录有 my_utils.py
from my_utils import my_function

# 也可以创建包目录
# my_package/
#   __init__.py
#   factor.py
from my_package.factor import MyFactor
```

**代码共享**：研究环境和回测/模拟交易共享同一文件系统，可在研究中开发模块后直接在策略中导入。

```python
# 在策略中导入研究环境的自定义模块
from kuanke.user_space_api import *
# 或直接 import（如果模块在根目录）
```

## 研究环境 vs 回测环境差异

| 特性 | 研究环境 | 回测环境 |
|------|---------|---------|
| 执行方式 | 交互式（cell by cell） | 按生命周期函数自动执行 |
| 数据范围 | 全历史可访问 | 仅回测区间内 |
| context 对象 | 不可用 | 可用 |
| 下单函数 | 不可用 | 可用 |
| get_price | 可用，需指定日期 | 可用，自动限制在当前时点前 |
| get_fundamentals | 可用 | 可用 |
| 自定义因子计算 | 推荐在此开发测试 | 集成到策略中使用 |
| matplotlib 绑图 | 直接显示 | 不支持（用 record() 替代） |

## 研究环境专用 API

### get_price（研究环境用法）
```python
# 研究环境中必须显式指定日期
df = get_price('000001.XSHE',
               start_date='2023-01-01',
               end_date='2024-01-01',
               frequency='daily',
               fq='post',     # 研究中推荐后复权
               panel=False)
```

### SQL 查询
```python
from jqdata import finance

# 使用 run_query 查询金融数据库
df = run_query(
    query(finance.STK_EXCHANGE_TRADE_INFO).filter(
        finance.STK_EXCHANGE_TRADE_INFO.date >= '2024-01-01'
    ).limit(1000)
)
```

## 研究环境最佳实践

1. **因子开发**：在研究环境中开发和测试因子，验证有效后再集成到策略
2. **数据探索**：利用交互式环境探索数据分布、相关性
3. **可视化**：用 matplotlib/seaborn 绘制分析图表
4. **模块化**：将通用函数封装到自定义模块，在策略中复用
5. **缓存**：大量计算的中间结果用 `write_file` 缓存，避免重复计算

## 资源限制

| 项目 | 限制 |
|------|------|
| 单个 notebook | 运行时间视会员等级而定 |
| 文件上传 | 单文件 20MB |
| 内存 | Docker 容器限制 |
| CPU | 共享资源，避免长时间密集计算 |
