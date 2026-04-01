# 数据查询 API 完整参考

## get_price — 获取行情数据

```python
get_price(
    security,          # str 或 list[str]：标的代码
    start_date=None,   # str/date：开始日期
    end_date=None,     # str/date：结束日期
    frequency='daily', # str：'daily' / '1m'(1分钟) / '5m' / '15m' / '30m' / '60m' / '120m'
    fields=None,       # list：字段列表，默认全部
    skip_paused=False, # bool：是否跳过停牌日
    fq='pre',          # str：复权方式 'pre'(前复权) / 'post'(后复权) / None(不复权)
    count=None,        # int：返回数据条数（与 start_date 二选一）
    panel=False,       # bool：False 返回 DataFrame（推荐），True 返回 Panel（已废弃）
    fill_paused=True,  # bool：是否用前一个值填充停牌日数据
)
```

**可用字段**：
- `open`, `close`, `high`, `low` — OHLC 价格
- `volume` — 成交量（股）
- `money` — 成交额（元）
- `pre_close` — 前收盘价
- `high_limit` — 涨停价
- `low_limit` — 跌停价
- `avg` — 均价（仅分钟数据）
- `paused` — 是否停牌（1=停牌）

**返回格式**（`panel=False`）：
- 单标的：DataFrame，index=日期，columns=字段
- 多标的：DataFrame，MultiIndex=(日期, 标的)，columns=字段

**注意事项**：
- 回测中建议使用 `count` 参数而非 `start_date`（避免未来函数风险）
- 回测中不需要手动设置 `fq`，引擎自动使用真实价格
- 研究环境中：`fq='post'` 用于因子研究，`fq=None` 用于查看原始价格
- 始终使用 `panel=False`

```python
# 示例：获取最近20个交易日收盘价
df = get_price('000001.XSHE', count=20, end_date='2024-01-15',
               fields=['close'], panel=False)

# 示例：获取多只股票数据
df = get_price(['000001.XSHE', '600000.XSHG'],
               start_date='2024-01-01', end_date='2024-03-01',
               fields=['open', 'close', 'volume'], panel=False)
```

## get_fundamentals — 获取财务数据

```python
get_fundamentals(
    query_object,   # SQLAlchemy Query 对象
    date=None,      # str/date：查询日期（返回截止该日已公布的数据）
    statDate=None,  # str：财报期 如 '2024q1'（注意：有未来函数风险）
)
```

**query 对象构建**：
```python
from jqdata import *

q = query(
    valuation.code,
    valuation.market_cap,        # 总市值（亿元）
    valuation.pe_ratio,          # 市盈率
    valuation.pb_ratio,          # 市净率
    valuation.turnover_ratio,    # 换手率
).filter(
    valuation.code.in_(stock_list)
).order_by(
    valuation.market_cap.asc()
).limit(100)

df = get_fundamentals(q, date='2024-03-15')
```

**可查询数据表**（完整字段详见 `references/financial-tables.md`）：

| 表名 | 说明 | 常用字段 |
|------|------|---------|
| `valuation` | 市值估值（每日更新） | market_cap, pe_ratio, pb_ratio, ps_ratio, pcf_ratio, turnover_ratio, capitalization, circulating_cap |
| `balance` | 资产负债表 | total_assets, total_liability, total_owner_equities |
| `income` | 利润表 | total_operating_revenue, operating_revenue, net_profit, basic_eps |
| `cash_flow` | 现金流量表 | net_operate_cash_flow, net_invest_cash_flow, net_finance_cash_flow |
| `indicator` | 财务指标 | roe, roa, inc_revenue_year_on_year, inc_net_profit_year_on_year, gross_profit_margin |
| `bank_indicator` | 银行专用指标 | — |
| `security_indicator` | 券商专用指标 | — |
| `insurance_indicator` | 保险专用指标 | — |

**重要**：
- `date` 参数：返回截止该日已公布的最新数据（**推荐使用，避免未来函数**）
- `statDate` 参数：返回指定财报期数据（如 `'2024q1'`），但该期报表可能尚未公布，**存在未来函数风险**
- `valuation` 表每日更新，其他财务表按财报公布时间更新

```python
# 安全用法：获取截止某日已公布的财务数据
df = get_fundamentals(q, date='2024-03-15')

# 危险用法：2024Q1 报表到4月底才公布，3月查询会用到未来数据
df = get_fundamentals(q, statDate='2024q1')
```

## get_fundamentals_continuously — 连续多日财务数据

```python
get_fundamentals_continuously(
    query_object,    # SQLAlchemy Query 对象
    end_date=None,   # str/date：结束日期
    count=1,         # int：天数
    panel=False,     # bool：推荐 False
)
```

```python
# 获取最近10个交易日的市值数据
df = get_fundamentals_continuously(
    query(valuation.code, valuation.market_cap),
    end_date='2024-03-15', count=10, panel=False
)
```

## get_current_data — 获取当前快照

```python
current_data = get_current_data()
# 返回: dict {security: SecurityUnitData}

current_data['000001.XSHE'].day_open     # 今日开盘价
current_data['000001.XSHE'].last_price   # 最新价
current_data['000001.XSHE'].high_limit   # 涨停价
current_data['000001.XSHE'].low_limit    # 跌停价
current_data['000001.XSHE'].paused       # 是否停牌
current_data['000001.XSHE'].is_st        # 是否ST
current_data['000001.XSHE'].name         # 股票名称
```

## get_extras — 获取附加信息

```python
get_extras(
    info,              # str：信息类型
    security_list,     # list：标的列表
    start_date=None,
    end_date=None,
    count=None,
)
```

**info 可选值**：
- `'is_st'` — 是否ST（bool）
- `'acc_net_value'` — 基金累计净值
- `'unit_net_value'` — 基金单位净值
- `'futures_sett_price'` — 期货结算价
- `'futures_positions'` — 期货持仓量
- `'adj_net_value'` — 基金复权净值

```python
# 获取ST状态
st_df = get_extras('is_st', stock_list,
                   end_date='2024-03-15', count=1)
```

## 股票池函数

### get_all_securities(types, date)
获取所有标的列表。

```python
# 获取所有A股
stocks = get_all_securities(types=['stock'], date='2024-03-15')
# 返回: DataFrame，index=代码，columns=[display_name, name, start_date, end_date, type]

# types 可选: 'stock', 'fund', 'index', 'futures', 'options', 'etf', 'lof', 'fja', 'fjb'
```

### get_index_stocks(index_code, date)
获取指数成分股。

```python
stocks = get_index_stocks('000300.XSHG', date='2024-03-15')  # 沪深300成分股
stocks = get_index_stocks('000905.XSHG')  # 中证500成分股
# 返回: list[str]
```

### get_industry_stocks(industry_code, date)
获取行业成分股。

```python
stocks = get_industry_stocks('I64', date='2024-03-15')  # 申万行业
# 行业代码通过 get_industries 获取
```

### get_industries(name)
获取行业分类。

```python
industries = get_industries(name='sw_l1')  # 申万一级行业
# name: 'sw_l1'(申万一级), 'sw_l2'(申万二级), 'sw_l3'(申万三级),
#       'jq_l1'(聚宽一级), 'jq_l2'(聚宽二级), 'zjw'(证监会行业)
```

### get_industry(security, date)
查询股票所属行业（反向查询）。

```python
d = get_industry('600519.XSHG', date='2024-03-15')
# 返回: dict，包含 sw_l1/sw_l2/sw_l3/zjw/jq_l1/jq_l2 全部分类
# d['600519.XSHG']['sw_l1'] → {'industry_code': '801120', 'industry_name': '食品饮料I'}

# 批量查询
d = get_industry(['000001.XSHE', '600519.XSHG'], date='2024-03-15')
```

### get_concept_stocks(concept_code, date)
获取概念板块成分股。

```python
stocks = get_concept_stocks('GN036', date='2024-03-15')
# 概念代码通过 get_concepts 获取
```

### get_concepts()
获取所有概念板块。

```python
concepts = get_concepts()
# 返回: DataFrame，columns=[code, name, start_date]
```

## get_security_info — 标的信息

```python
info = get_security_info('000001.XSHE')
info.display_name   # '平安银行'
info.name           # 'PAYH'
info.start_date     # 上市日期
info.end_date       # 退市日期
info.type           # 'stock'
```

## history — 获取历史数据（多标的单字段）♠

```python
history(
    count,         # int：数据条数
    unit='1d',     # str：'1d'(日) / '1m'(分钟) / '5m' / '15m' / '30m' / '60m' / '120m' / '240m'
    field='avg',   # str：单个字段名
    security_list=None,  # list：标的列表（None=当前 universe）
    df=True,       # bool：True 返回 DataFrame，False 返回 dict
    skip_paused=True,
    fq='pre',
)
# 返回: DataFrame，index=日期，columns=标的代码
```

**与 get_price 的区别**：
- `history` 只能查一个字段，但可同时查多个标的
- 仅在回测/模拟中可用（♠），研究环境不可用
- 自动基于当前回测时间点，无需指定 end_date

```python
# 获取股票池过去5天的收盘价
close_df = history(5, '1d', 'close', g.stocks)
```

## attribute_history — 获取历史数据（单标的多字段）♠

```python
attribute_history(
    security,      # str：标的代码
    count,         # int：数据条数
    unit='1d',     # str：频率
    fields=['open', 'close', 'high', 'low', 'volume', 'money'],
    skip_paused=True,
    df=True,
    fq='pre',
)
# 返回: DataFrame，index=日期，columns=字段
```

```python
# 获取单只股票过去5天的 OHLCV
df = attribute_history('000001.XSHE', 5, '1d', ['close', 'volume'])
MA5 = df['close'].mean()
```

## get_bars — 获取K线数据（支持非标准频率）

```python
get_bars(
    security,        # str 或 list[str]
    count,           # int：Bar 数量
    unit='1d',       # str：'1d'/'1m'/'5m'/'15m'/'30m'/'60m'/'120m'/'1w'/'1M'
    fields=['date', 'open', 'close', 'high', 'low', 'volume', 'money'],
    include_now=False,  # bool：是否包含当前未完成的 bar
    end_dt=None,     # datetime：结束时间
    fq_ref_date=None,  # date：复权基准日期
    df=True,
)
```

**特点**：支持周线(`'1w'`)和月线(`'1M'`)频率，这是 get_price 不支持的。

## get_valuation — 获取市值数据（批量）

```python
get_valuation(
    security,       # str 或 list[str]
    start_date=None,
    end_date=None,
    fields=None,    # 同 valuation 表字段
    count=None,
)
```

比 `get_fundamentals` + `query(valuation)` 更简洁的市值数据获取方式。

## get_history_fundamentals — 获取历史财务数据

```python
get_history_fundamentals(
    security,       # str 或 list[str]
    fields,         # list：财务字段列表
    watch_date,     # str/date：观察日期
    count=1,        # int：获取几个季度/年度
    interval='1q',  # str：'1q'(季度) / '1y'(年度)
)
```

获取多个季度/年度的历史财务数据，避免了 `get_fundamentals` 只能获取单日数据的限制。

## get_money_flow — 资金流向

```python
df = get_money_flow(
    security_list,     # list：标的列表
    start_date=None,
    end_date=None,
    fields=None,       # list：字段列表
    count=None,
)
```

**可用字段**：
- `sec_code` — 标的代码
- `change_pct` — 涨跌幅
- `net_amount_main` — 主力净额（万）
- `net_pct_main` — 主力净占比
- `net_amount_xl` — 超大单净额
- `net_amount_l` — 大单净额
- `net_amount_m` — 中单净额
- `net_amount_s` — 小单净额

## get_billboard_list — 龙虎榜

```python
df = get_billboard_list(
    stock_list=None,   # list：标的列表（None=全部）
    start_date=None,
    end_date=None,
    board_type=None,   # str：榜单类型
    count=None,
)
```

## get_ticks — Tick 数据

```python
df = get_ticks(
    security,       # str：标的代码
    start_dt=None,  # str/datetime：开始时间
    end_dt=None,    # str/datetime：结束时间
    count=None,
    fields=None,
)
```

**字段**：time, current, high, low, volume, money, a1_v~a5_v, a1_p~a5_p, b1_v~b5_v, b1_p~b5_p

## 交易日函数

### get_trade_days(start_date, end_date, count)
获取交易日列表。

```python
# 获取日期范围内的交易日
days = get_trade_days(start_date='2024-01-01', end_date='2024-03-15')
# 返回: numpy.ndarray of datetime.date

# 获取最近N个交易日
days = get_trade_days(end_date='2024-03-15', count=20)
```

### get_all_trade_days()
获取所有交易日（从上市至今）。

```python
all_days = get_all_trade_days()
```

## run_query — 通用数据查询

```python
from jqdata import finance

# 查询财务数据（非 valuation 等常规表）
df = run_query(
    query(finance.STK_EXCHANGE_TRADE_INFO).filter(
        finance.STK_EXCHANGE_TRADE_INFO.date == '2024-03-15'
    ).limit(100)
)
```

**注意**：`run_query` 单次最多返回 5000 条。大量数据使用 `run_offset_query` 分页。

## normalize_code — 代码标准化

```python
normalize_code('000001')       # → '000001.XSHE'
normalize_code('SH600000')     # → '600000.XSHG'
normalize_code('000001.XSHE')  # → '000001.XSHE' (已标准化)
```
