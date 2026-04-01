# RQAlpha 策略运行指南

## 安装与数据准备

```bash
# 安装 RQAlpha
pip install rqalpha

# 下载免费 A 股日线数据
rqalpha download-bundle

# 生成示例策略
rqalpha examples -d ./
```

## 命令行运行

### 基本语法
```bash
rqalpha run -f <策略文件> -s <起始日期> -e <结束日期> --account <类型> <金额> [选项]
```

### 核心参数

| 参数 | 全称 | 说明 |
|------|------|------|
| `-f` | `--strategy-file` | 策略文件路径 |
| `-s` | `--start-date` | 回测起始日期 |
| `-e` | `--end-date` | 回测结束日期 |
| `-a` | `--account` | 账户类型及资金，如 `stock 100000` |
| `-d` | `--data-bundle-path` | 数据源路径 |
| `-fq` | `--frequency` | `1d`(日线) 或 `1m`(分钟线) |
| `-rt` | `--run-type` | `b`(回测) / `p`(模拟) / `r`(实盘) |
| `-l` | `--log-level` | `verbose` / `info` / `warning` / `error` |

### 常用 Mod 参数

| 参数 | 说明 |
|------|------|
| `-bm` / `--benchmark` | 基准，如 `000300.XSHG` |
| `-o` / `--output-file` | 输出结果文件路径 (.pkl) |
| `-p` / `--plot` | 回测后显示收益曲线图 |
| `--plot-save` | 保存收益图到文件 |
| `--progress` | 显示回测进度条 |
| `--report` | 保存交易详情 |
| `-sp` / `--slippage` | 设置滑点 |
| `-cm` / `--commission-multiplier` | 手续费乘数 |
| `-mm` / `--margin-multiplier` | 保证金乘数 |
| `-me` / `--match-engine` | 撮合引擎: `current_bar` / `next_bar` |
| `--signal` | 信号模式（不撮合，直接成交）|
| `--short-stock` | 允许股票卖空 |

### 通过 -mc 传递 Mod 配置
```bash
# 启动资金不足时自动用全部剩余资金下单
rqalpha run -f strategy.py --account stock 100000 \
    -mc sys_accounts.auto_switch_order_value True
```

### 完整示例
```bash
# 股票回测，带图形、进度条、输出文件
rqalpha run -f strategy.py \
    -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 \
    --benchmark 000300.XSHG \
    --plot --progress \
    -o result.pkl

# 期货回测
rqalpha run -f futures_strategy.py \
    -s 2020-01-01 -e 2023-12-31 \
    --account future 500000 \
    -fq 1m

# 股票+期货混合
rqalpha run -f mixed_strategy.py \
    -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 --account future 200000
```

## Python API 运行

### run_file - 运行策略文件
```python
from rqalpha.api import run_file

result = run_file('strategy.py', config={
    'base': {
        'start_date': '2020-01-01',
        'end_date': '2023-12-31',
        'accounts': {'stock': 100000},
        'benchmark': '000300.XSHG',
        'frequency': '1d',
    },
    'mod': {
        'sys_analyser': {
            'enabled': True,
            'plot': True,
            'output_file': 'result.pkl',
        },
        'sys_progress': {
            'enabled': True,
        },
    }
})
```

### run_code - 运行策略代码字符串
```python
from rqalpha.api import run_code

code = """
def init(context):
    context.s1 = '000001.XSHE'

def handle_bar(context, bar_dict):
    order_shares(context.s1, 100)
"""

run_code(code, config=config)
```

### run_func - 运行策略函数
```python
from rqalpha.api import run_func

def my_init(context):
    context.s1 = '000001.XSHE'

def my_handle_bar(context, bar_dict):
    order_shares(context.s1, 100)

config = {
    'base': {
        'start_date': '2020-01-01',
        'end_date': '2023-12-31',
        'accounts': {'stock': 100000},
    }
}

run_func(init=my_init, handle_bar=my_handle_bar, config=config)
```

## 回测结果分析

```python
import pandas as pd

result = pd.read_pickle('result.pkl')
result.keys()
# dict_keys(['total_portfolios', 'summary', 'benchmark_portfolios',
#            'benchmark_positions', 'stock_positions', 'trades',
#            'stock_portfolios'])

# 查看回测摘要
print(result['summary'])

# 查看持仓变化
result['stock_portfolios']

# 查看交易记录
result['trades']
```

## 参数配置优先级

策略代码中配置 > 命令行传参 = run_file/run_code/run_func 函数传参 > 用户配置文件 > 系统默认配置文件

## 参数调优

通过 `--extra-vars` 传递变量到策略中：
```bash
rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 \
    --extra-vars short_period=10 long_period=60

# 策略中通过 context 获取
def init(context):
    context.short_period = context.extra_vars.get('short_period', 20)
```

或在配置中使用 `extra.context_vars`：
```python
config = {
    'base': {...},
    'extra': {
        'context_vars': {
            'short_period': 10,
            'long_period': 60,
        }
    }
}
```

## 绘制历史回测结果

```bash
rqalpha plot result.pkl
```

## IPython / Jupyter 使用

```python
# 加载 RQAlpha magic
%load_ext rqalpha

# 查看帮助
%rqalpha?

# 在 cell 中运行回测
%%rqalpha -s 2020-01-01 -e 2023-12-31 --account stock 100000 --plot
def init(context):
    context.s1 = '000001.XSHE'

def handle_bar(context, bar_dict):
    order_shares(context.s1, 100)
```
