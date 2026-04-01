# RQAlpha 数据查询 API

## 行情数据

### history_bars(order_book_id, bar_count, frequency, field, adjust_type='pre')
获取历史行情数据。**返回 numpy.ndarray**。

参数：
- `order_book_id`: str，合约代码
- `bar_count`: int，获取数据条数
- `frequency`: str，`'1d'`(日) 或 `'1m'`(分钟)
- `field`: str，可选 `'open'`, `'close'`, `'high'`, `'low'`, `'volume'`, `'total_turnover'`, `'datetime'`
- `adjust_type`: str，复权方式 `'pre'`(前复权), `'post'`(后复权), `'none'`(不复权)

```python
# 获取最近20天收盘价
closes = history_bars('000001.XSHE', 20, '1d', 'close')

# 获取最近60根分钟K线的成交量
volumes = history_bars('000001.XSHE', 60, '1m', 'volume')

# 不复权
raw_prices = history_bars('000001.XSHE', 20, '1d', 'close', adjust_type='none')
```

### bar_dict（handle_bar 参数）
当前 bar 数据字典，在 handle_bar 中可直接使用。

```python
def handle_bar(context, bar_dict):
    bar = bar_dict['000001.XSHE']
    print(bar.close)       # 收盘价
    print(bar.open)        # 开盘价
    print(bar.volume)      # 成交量
    print(bar.limit_up)    # 涨停价
    print(bar.limit_down)  # 跌停价
    print(bar.isnan)       # 是否停牌
```

### current_snapshot(order_book_id)
获取当前快照数据（主要用于 tick 级别策略）。

```python
snap = current_snapshot('000001.XSHE')
snap.last            # 最新价
snap.open            # 开盘价
snap.volume          # 成交量
snap.asks            # 卖盘 [(price, volume), ...]
snap.bids            # 买盘 [(price, volume), ...]
```

## 合约信息

### all_instruments(type=None)
获取所有合约基础信息。

```python
# 获取所有股票
stocks = all_instruments(type='CS')
# 获取所有期货
futures = all_instruments(type='Future')
# 获取所有ETF
etfs = all_instruments(type='ETF')
# type 可选: 'CS'(股票), 'Future'(期货), 'ETF', 'INDX'(指数),
#            'LOF', 'FenjiA', 'FenjiB', 'FenjiMu', 'PublicFund'
```

### instruments(order_book_id)
获取单个合约详细信息，返回 Instrument 对象。

```python
inst = instruments('000001.XSHE')
inst.order_book_id   # '000001.XSHE'
inst.symbol          # '平安银行'
inst.type            # 'CS'
inst.listed_date     # 上市日期
inst.de_listed_date  # 退市日期
inst.round_lot       # 100
inst.industry_code   # 行业代码
```

## 交易日历

### get_trading_dates(start_date, end_date)
获取指定范围内的交易日列表。

```python
dates = get_trading_dates('2023-01-01', '2023-12-31')
```

### get_previous_trading_date(date, n=1)
获取前第 n 个交易日。

```python
prev = get_previous_trading_date('2023-06-15')
```

### get_next_trading_date(date, n=1)
获取后第 n 个交易日。

```python
next_day = get_next_trading_date('2023-06-15')
```

## 状态查询

### is_suspended(order_book_id, count=1)
判断股票是否停牌。
```python
if is_suspended('000001.XSHE'):
    logger.info("该股票今日停牌")
```

### is_st_stock(order_book_id, count=1)
判断股票是否为 ST。
```python
if is_st_stock('000001.XSHE'):
    logger.info("该股票为ST股")
```

## 期货专用

### get_future_contracts(underlying_symbol)
获取某品种当前可交易合约列表。

```python
contracts = get_future_contracts('RB')  # 获取螺纹钢所有合约
# 返回: ['RB2401', 'RB2402', ...]
```

## 收益率曲线

### get_yield_curve(date=None, tenor=None)
获取国债收益率曲线。

```python
yc = get_yield_curve(date='2023-06-15')
# tenor: '0S', '1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '10Y', '15Y', '20Y', '30Y'
```

## 扩展 API（需 rqdatac）

以下 API 需要安装 rqdatac 并配置 license：

### get_fundamentals(query, entry_date=None, interval='1d', report_quarter=False)
获取财务数据。使用 SQLAlchemy 风格查询。

```python
from rqalpha.api import *

q = query(
    fundamentals.eod_derivative_indicator.pe_ratio,
    fundamentals.eod_derivative_indicator.pb_ratio
).filter(
    fundamentals.eod_derivative_indicator.stockcode.in_(['000001.XSHE', '600000.XSHG'])
)
df = get_fundamentals(q)
```

### get_price(order_book_id, start_date, end_date, frequency='1d', fields=None, adjust_type='pre')
获取历史价格数据，返回 DataFrame。

### get_factor(order_book_id, factor_name, start_date, end_date, ...)
获取因子数据。

### get_dividend(order_book_id)
获取分红送股信息。

### get_split(order_book_id)
获取拆股信息。

### index_components(index_id, date=None)
获取指数成分股列表。

```python
# 获取沪深300成分股
stocks = index_components('000300.XSHG')
```

### industry_code_to_name(code)
行业代码转名称。

### concept(concept_name, date=None)
获取概念板块成分股。
