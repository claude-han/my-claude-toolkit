# 策略生命周期 + 配置 + 下单 API

## 生命周期函数

### initialize(context)
**必须定义**。策略启动时调用一次，用于设置全局参数。

```python
def initialize(context):
    set_benchmark('000300.XSHG')
    set_option('use_real_price', True)
    # 设置全局变量
    context.stock_num = 20
```

- `context`: 全局上下文对象，可在所有生命周期函数间共享数据
- 在此函数中设置 benchmark、cost、slippage 等

### before_trading_start(context)
每个交易日开盘前调用（09:00前）。适合更新股票池、获取最新数据。

```python
def before_trading_start(context):
    # 获取当日可交易股票池
    context.stocks = get_index_stocks('000300.XSHG')
```

### handle_data(context, data)
每个交易 bar 调用。日频=每天调用1次(09:30)，分钟频=每分钟调用1次。

```python
def handle_data(context, data):
    # data 参数已废弃，不建议使用
    # 使用 get_price / get_current_data 获取数据
    pass
```

**注意**：如果使用了 `run_daily`/`run_weekly`/`run_monthly`，可以不定义 `handle_data`。

### after_trading_end(context)
每个交易日收盘后调用（15:00后）。适合记录日志、统计分析。

```python
def after_trading_end(context):
    log.info(f'今日总资产: {context.portfolio.total_value}')
```

### process_initialize(context)
进程级初始化。模拟交易中重启进程时不会重复调用 `initialize`，而是调用此函数恢复进程级变量。

```python
def process_initialize(context):
    # 恢复需要每次进程启动时初始化的变量
    context.trade_count = 0
```

### on_strategy_end(context)
策略运行结束时回调（可选）。回测完成或模拟交易停止时调用。

```python
def on_strategy_end(context):
    log.info('策略运行结束')
```

### after_code_changed(context)
模拟交易中更换策略代码后运行（可选）。用于在不重新执行 `initialize` 的情况下修改全局变量。

```python
def after_code_changed(context):
    # 模拟交易更换代码后，initialize 不会重新执行
    # 需要在此函数中修改全局变量
    g.stock = '000002.XSHE'  # 更新操作标的
```

### 全局变量对象 g

`g` 是跨函数共享变量的全局对象，模拟交易中会用 pickle 序列化保存。

```python
def initialize(context):
    g.security = '000001.XSHE'
    g.stock_num = 20
```

**模拟交易中的注意事项**：
- `g` 中以 `__` 开头的变量**不会被序列化保存**，每次进程启动需在 `process_initialize` 中恢复
- 不可序列化的对象（query对象、文件句柄、网络连接）**不能存入 g**，需用 `__` 前缀并在 `process_initialize` 中初始化
- 序列化后状态大小不能超过 30M

```python
def process_initialize(context):
    # 不可序列化的对象用 __ 前缀
    g.__q = query(valuation)  # query 对象无法 pickle
```

### 生命周期执行顺序

同一时间点的执行顺序：
1. `run_xxx` 指定的函数
2. `before_trading_start`
3. `handle_data`
4. `after_trading_end`

**重要**：`run_xxx` 和 `handle_data` 不要在同一个策略中使用，建议使用 `run_xxx`。

## 配置函数

### set_benchmark(security)
设置基准指数，用于计算超额收益、Alpha、Beta 等。

```python
set_benchmark('000300.XSHG')   # 沪深300
set_benchmark('000905.XSHG')   # 中证500
set_benchmark('000852.XSHG')   # 中证1000
```

### set_option(key, value)
设置策略选项。

```python
set_option('use_real_price', True)   # 必须设置：使用真实价格（非信号价格）
set_option('order_volume_ratio', 1)  # 成交量限制比例（默认0.25，即不超过当日成交量25%）
set_option('avoid_future_data', True) # 开启未来函数检测（会降低回测速度）
```

### set_slippage(slippage_obj)
设置滑点模型。

```python
# 固定滑点：每股固定金额（推荐）
set_slippage(FixedSlippage(0.02))  # 每股0.02元

# 比例滑点：按价格百分比
set_slippage(PriceRelatedSlippage(0.002))  # 价格的0.2%
```

### set_order_cost(cost_obj, type)
设置交易成本。

```python
# 股票成本（实证验证参数）
set_order_cost(OrderCost(
    open_tax=0,               # 买入印花税（股票为0）
    close_tax=0.0005,         # 卖出印花税 0.05%（2023-08-28后生效）
    open_commission=0.0003,   # 买入佣金 0.03%
    close_commission=0.0003,  # 卖出佣金 0.03%
    close_today_commission=0, # 今仓佣金（股票为0）
    min_commission=5,         # 最低佣金 5 元
), type='stock')

# 期货成本
set_order_cost(OrderCost(
    open_commission=0.000023,
    close_commission=0.000023,
    close_today_commission=0.000023,
    min_commission=0,
), type='index_futures')
```

**印花税历史档位**：
- 2023-08-28 前：卖出 0.1% (`close_tax=0.001`)
- 2023-08-28 后：卖出 0.05% (`close_tax=0.0005`)

## 定时调度函数

### run_daily(func, time, reference_security)
每个交易日定时执行。

```python
run_daily(market_open, time='open')           # 09:30 开盘时
run_daily(market_open, time='09:31')          # 09:31
run_daily(market_close, time='14:50')         # 14:50
run_daily(after_close, time='after_close')    # 收盘后
run_daily(every_min_func, time='every_bar')   # 每分钟执行（分钟频策略）
```

- `func`: 接受 `context` 参数的函数（注意：不接受 `data` 参数）
- `time`: `'open'` / `'after_close'` / `'every_bar'` / `'HH:MM'` 格式
- `reference_security`: 参考标的（可选），用于确定交易日
- 一个策略可注册多个 `run_daily`，分别在不同时间执行

### run_weekly(func, weekday, time, reference_security)
每周定时执行。

```python
run_weekly(rebalance, weekday=1, time='open')  # 每周一开盘执行
# weekday: 1=周一, 2=周二, ..., 5=周五, -1=每周最后一个交易日
```

### run_monthly(func, monthday, time, reference_security)
每月定时执行。

```python
run_monthly(rebalance, monthday=1, time='open')    # 每月第1个交易日
run_monthly(rebalance, monthday=-1, time='open')   # 每月最后一个交易日
```

## 下单函数

### order(security, amount, style=None)
按股数下单。

```python
order('000001.XSHE', 500)      # 买入500股
order('000001.XSHE', -500)     # 卖出500股
```

- `amount`: 正=买入, 负=卖出, 单位：股
- `style`: `MarketOrderStyle()` 或 `LimitOrderStyle(price)`
- 返回：`Order` 对象或 `None`（下单失败）

### order_target(security, amount, style=None)
调整持仓到目标股数。

```python
order_target('000001.XSHE', 1000)  # 调整到持有1000股
order_target('000001.XSHE', 0)     # 清仓
```

### order_value(security, value, style=None)
按金额下单。

```python
order_value('000001.XSHE', 10000)   # 买入1万元
order_value('000001.XSHE', -10000)  # 卖出1万元
```

### order_target_value(security, value, style=None)
调整持仓到目标市值。**最常用的下单函数**。

```python
order_target_value('000001.XSHE', 50000)  # 调整到持有5万元市值
order_target_value('000001.XSHE', 0)      # 清仓
```

**内部逻辑**（实证验证）：
1. 目标股数 = `int(value / price / 100) * 100` （向下取整到整手）
2. 如果目标股数 < 100（即 price × 100 > value），不下单
3. 计算差额 = 目标股数 - 当前持有股数
4. 差额 > 0 → 买入，差额 < 0 → 卖出，差额 = 0 → 不操作

### order_target_percent(security, pct, style=None)
调整持仓到目标比例（占总资产百分比）。

```python
order_target_percent('000001.XSHE', 0.1)  # 调整到占总资产10%
```

### 下单风格

```python
# 市价单（默认）
order('000001.XSHE', 100, style=MarketOrderStyle())

# 限价单
order('000001.XSHE', 100, style=LimitOrderStyle(15.50))
```

### get_open_orders()
获取所有未完成订单。

```python
open_orders = get_open_orders()
# 返回: dict {order_id: Order}
```

### cancel_order(order)
取消未完成订单。

```python
for _id, _order in get_open_orders().items():
    cancel_order(_order)
```

## Order 对象属性

```python
order.status           # 订单状态: OrderStatus.new/open/filled/canceled/rejected/held
order.amount           # 下单数量
order.filled           # 已成交数量
order.price            # 委托价格
order.avg_cost         # 成交均价
order.side             # 买卖方向: 'long' / 'short'
order.action           # 开平方向: 'open' / 'close'
order.is_buy           # 是否买入
order.security         # 标的代码
```

## context.portfolio 详解

```python
p = context.portfolio
p.cash                        # 可用现金
p.positions_value             # 持仓总市值
p.total_value                 # 总资产 = cash + positions_value
p.returns                     # 累计收益率
p.starting_cash               # 初始资金

# 持仓信息
pos = p.positions['000001.XSHE']
pos.security                  # 标的代码
pos.amount                    # 持有股数
pos.cost_basis                # 持仓均价（含交易成本）
pos.avg_cost                  # 持仓均价（不含交易成本）
pos.last_sale_price           # 最新价格
pos.value                     # 持仓市值 = amount * last_sale_price
pos.closeable_amount          # 可卖出数量（考虑T+1）
```

## context.subportfolios（分仓）

```python
# 在 initialize 中设置分仓
set_subportfolios([
    SubPortfolioConfig(cash=50000, type='stock'),
    SubPortfolioConfig(cash=50000, type='index_futures'),
])

# 使用分仓下单
context.subportfolios[0]  # 第一个子账户
```

**type 可选值**：
- `'stock'` — 股票和场内基金（默认）
- `'index_futures'` — 金融期货
- `'futures'` — 商品期货
- `'stock_margin'` — 融资融券

## 撮合机制

### 未启用盘口撮合时（回测默认）

| 频率 | 市价单 | 限价单 |
|------|--------|--------|
| 日频 | 按最新价+滑点撮合 | 下单时尝试撮合，剩余按分钟Bar撮合 |
| 分钟 | 按最新价+滑点撮合 | 下单时尝试撮合，剩余按分钟Bar撮合 |
| Tick | 按最新价+滑点撮合 | 下单时尝试撮合，剩余按Tick撮合 |

**交易价格**：最新价 + 滑点。开盘时刻运行时，最新价为开盘价。

**成交量限制**（回测）：不超过当日总成交量 × `order_volume_ratio`（默认 0.25）。

**涨跌停处理**：
- 跌停时市价卖单被撤销，涨停时市价买单被撤销
- 限价单会挂单等待撮合

### 非交易时段下单
- 市价单/限价单都会挂单
- 日频策略在下一个开盘时尝试撮合
- 每个交易日结束时自动撤销所有未完成订单

## 投资组合优化器

```python
from jqlib.optimizer import *

optimized_weight = portfolio_optimizer(
    date=context.previous_date,   # 优化日期（注意未来函数）
    securities=stock_list,         # 标的列表
    target=RiskParity(),           # 优化目标
    constraints=[                  # 约束条件
        WeightConstraint(low=0.9, high=1.0),
    ],
    bounds=[Bound(0, 0.1)],        # 单标的权重范围
    default_port_weight_range=[0., 1.0],
    return_none_if_fail=True,
)
# 返回: pd.Series，index=标的代码，values=权重
```

**优化目标**：
- `MinVariance(count=250)` — 最小化组合方差
- `MaxProfit(count=250)` — 最大化组合收益
- `MaxSharpeRatio(rf=0.0, count=250)` — 最大化夏普比率
- `MinTrackingError(index, count=250)` — 最小化跟踪误差
- `RiskParity(count=250)` — 风险平价
- `MaxFactorValue(factor, count)` — 因子值最大化
- `MinFactorValue(factor, count)` — 因子值最小化

**约束条件**：
- `WeightConstraint(low, high)` — 组合总权重范围
- `MarketConstraint(market, low, high)` — 按市场分类约束（'stock'/'etf'等）
- `AnnualProfitConstraint(limit, count)` — 年化收益下限

**边界条件**：
- `Bound(low, high)` — 单标的权重范围
