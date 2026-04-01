# 因子分析 API 参考

## get_factor_values — 获取因子库因子值

```python
from jqfactor import get_factor_values

factor_data = get_factor_values(
    securities,       # list[str]：标的列表（最多1000只）
    factors,          # list[str]：因子名称列表
    start_date=None,  # str/date
    end_date=None,    # str/date
    count=None,       # int
)
# 返回: dict {factor_name: DataFrame}
# DataFrame: index=日期, columns=标的代码
```

```python
# 示例
from jqfactor import get_factor_values

stocks = get_index_stocks('000300.XSHG')
factor_data = get_factor_values(
    securities=stocks,
    factors=['turnover_ratio_20', 'market_cap', 'roe_ttm'],
    end_date='2024-03-15',
    count=20
)
# factor_data['market_cap'] → DataFrame
```

**注意**：单次最多查询 1000 只标的。超出需分批查询。

## 聚宽因子库分类

### 技术指标因子
常用：`turnover_ratio_20`(20日换手率)、`VOL20`(20日成交量均值)、`REVS5`/`REVS10`/`REVS20`(5/10/20日收益)

### 基本面因子
常用：`market_cap`(总市值)、`circulating_market_cap`(流通市值)、`pe_ratio`(市盈率)、`pb_ratio`(市净率)、`roe_ttm`(ROE-TTM)、`inc_revenue_year_on_year`(营收同比增速)

### Alpha 101 因子
```python
from jqlib.alpha101 import *
# 使用 alpha_001, alpha_002, ... alpha_101
```

### Alpha 191 因子
```python
from jqlib.alpha191 import *
# 使用 alpha_001, alpha_002, ... alpha_191
```

### 风险模型因子
- **CNE5**：SIZE, BETA, MOMENTUM, RESIDUAL_VOLATILITY, NON_LINEAR_SIZE, BOOK_TO_PRICE, LIQUIDITY, EARNINGS_YIELD, GROWTH, LEVERAGE
- **CNE6**：升级版风险模型

## 自定义因子 — jqfactor.Factor 类

```python
from jqfactor import Factor
import pandas as pd

class MyFactor(Factor):
    # 因子名称（必须）
    name = 'my_custom_factor'

    # 最大回溯窗口（必须）
    max_window = 20

    # 数据依赖（必须）
    dependencies = ['close', 'volume']

    # 计算逻辑（必须）
    def calc(self, data):
        # data: dict，key=dependency名称，value=DataFrame(index=日期, columns=标的)
        close = data['close']
        volume = data['volume']
        # 返回 pd.Series 或 pd.DataFrame
        # Series: index=标的代码，当日截面因子值
        return (close.iloc[-1] / close.iloc[0] - 1) / volume.mean()
```

### dependencies 可用类型

**行情数据**：
- `'open'`, `'close'`, `'high'`, `'low'` — OHLC
- `'volume'` — 成交量
- `'money'` — 成交额
- `'pre_close'` — 前收盘价
- `'avg'` — 均价

**因子库因子**：
- 直接使用因子名，如 `'market_cap'`, `'turnover_ratio_20'`

**财务数据（季频）**：
- `'net_profit'`(净利润), `'total_revenue'`(总营收) 等

**行业/概念**：
- `'industry_sw_l1'`(申万一级行业) 等

## calc_factors — 批量计算自定义因子

```python
from jqfactor import calc_factors

factor_dict = calc_factors(
    securities,         # list[str]：标的列表
    factors,            # list[Factor]：Factor 实例列表
    start_date=None,
    end_date=None,
    count=None,
)
# 返回: dict {factor_name: DataFrame}
```

## 数据预处理函数

### winsorize — 去极值（MAD法）
```python
from jqfactor import winsorize

# 基于中位数绝对偏差(MAD)，将极端值缩尾到 n 倍 MAD
factor_winsorized = winsorize(factor_series, n=3)
```

### winsorize_med — 去极值（百分位法）
```python
from jqfactor import winsorize_med

factor_winsorized = winsorize_med(factor_series, scale=3, inclusive=True)
```

### standardlize — 标准化
```python
from jqfactor import standardlize

# z-score 标准化: (x - mean) / std
factor_standardized = standardlize(factor_series)
```

**注意**：聚宽拼写为 `standardlize`（少一个 i），非 `standardize`。

### neutralize — 中性化
```python
from jqfactor import neutralize

# 对行业和市值进行中性化（回归取残差）
factor_neutralized = neutralize(
    factor_series,
    how=['industry', 'market_cap'],   # 中性化维度
    date='2024-03-15',                # 日期
    industry='sw_l1',                 # 行业分类标准
)
```

## analyze_factor — 单因子分析（jqfactor_analyzer）

```python
from jqfactor_analyzer import analyze_factor

far = analyze_factor(
    factor,                # pd.DataFrame：index=日期, columns=标的, values=因子值
    industry='jq_l1',      # str：行业分类 'jq_l1'/'sw_l1'
    quantiles=5,           # int：分组数量
    periods=(1, 5, 10),    # tuple：持有期（交易日）
    weight_method='avg',   # str：'avg'(等权) / 'mktcap'(市值加权)
    max_loss_ratio=0.25,   # float：最大允许损失比例
    use_cache=True,        # bool：是否使用缓存
    show_progress=True,    # bool：是否显示进度
)
```

### 分析结果对象 (far) 方法

**收益分析**：
```python
far.create_returns_tear_sheet()           # 因子收益分析
far.create_information_tear_sheet()       # IC 分析
far.create_turnover_tear_sheet()          # 换手率分析
far.create_full_tear_sheet()              # 完整分析报告
```

**获取数据**：
```python
far.calc_mean_return_by_quantile()        # 各分位组平均收益
far.calc_factor_information_coefficient()  # IC 时间序列
far.calc_mean_information_coefficient()    # 平均 IC
far.calc_average_cumulative_return_by_quantile()  # 分位组累计收益
far.calc_autocorrelation()                # 因子自相关
far.calc_factor_alpha_beta()              # Alpha/Beta
```

**关键指标解读**：
- **IC (Information Coefficient)**：因子值与未来收益的相关性，|IC| > 0.03 有效
- **IC_IR (IC Information Ratio)**：IC均值/IC标准差，> 0.5 较好
- **分位组单调性**：第1组到第5组收益应单调递增（或递减）
- **换手率**：过高意味着交易成本大

## 因子缓存

### save_factor_values_by_group — 缓存因子数据
```python
from jqfactor import save_factor_values_by_group

save_factor_values_by_group(
    factors,           # list[str]：因子名称列表
    securities,        # list[str]：标的列表
    start_date,
    end_date,
    group_name='my_cache',  # str：缓存组名
)
```

### get_factor_values_by_cache — 读取缓存
```python
from jqfactor import get_factor_values_by_cache

factor_data = get_factor_values_by_cache(
    group_name='my_cache',
    factors=['market_cap'],
    securities=stock_list,
    start_date='2024-01-01',
    end_date='2024-03-15',
)
```

## 因子研究完整流程

```
1. 定义因子（自定义Factor类 或 使用因子库）
       ↓
2. 获取因子值（calc_factors 或 get_factor_values）
       ↓
3. 数据预处理
   ├── 去极值 (winsorize)
   ├── 标准化 (standardlize)
   └── 中性化 (neutralize)  ← 可选
       ↓
4. 单因子分析 (analyze_factor)
       ↓
5. 解读 tear sheet
   ├── IC/IC_IR 是否显著
   ├── 分位组是否单调
   ├── 换手率是否可接受
   └── 不同持有期表现
       ↓
6. 因子改进或纳入多因子模型
```
