# RQAlpha 策略生命周期与交易 API

## 约定函数（生命周期）

### init(context)
策略初始化，回测启动时触发一次。用于设置全局变量、订阅标的等。
```python
def init(context):
    context.s1 = "000001.XSHE"
    context.lookback = 20
    logger.info("RunInfo: {}".format(context.run_info))
```

### handle_bar(context, bar_dict)
每个 bar 数据更新时触发。日频=每天1次，分钟频=每分钟1次。策略核心逻辑在此实现。
- `bar_dict`: Dict，key 为 order_book_id，value 为 BarObject

### handle_tick(context, tick)
tick 级别策略中，快照数据更新时触发。不同合约分别触发。

### open_auction(context, bar_dict)
盘前集合竞价时触发，发出的订单以当日开盘价成交。
注意：bar_dict 中的 bar 对象仅有 open, limit_up, limit_down 字段，没有 close。

### before_trading(context)
每天策略交易开始前调用。**不能在此函数中发送订单**。
注意：如订阅了夜盘期货，可能在前一日 20:00 触发。

### after_trading(context)
每天收盘后调用。**不能在此函数中发送订单**。可做当日收盘后计算。

## 交易接口

### 订单类型
```python
from rqalpha.model.order import MarketOrder, LimitOrder, TWAPOrder, VWAPOrder

# 市价单（默认）
order_shares("000001.XSHE", 100)
# 限价单
order_shares("000001.XSHE", 100, price_or_style=LimitOrder(10))
# TWAP 算法单（时间加权）
order_shares("000001.XSHE", 100, price_or_style=TWAPOrder(931, 945))
# VWAP 算法单（成交量加权）
order_shares("000001.XSHE", 100, price_or_style=VWAPOrder(931, 945))
```

### 通用下单函数

**submit_order(id_or_ins, amount, side, price_or_style=None, position_effect=None)**
自由参数下单。
```python
submit_order('000001.XSHE', 2000, SIDE.BUY)
submit_order('RB1812', 10, SIDE.SELL, price=4000, position_effect=POSITION_EFFECT.CLOSE_TODAY)
```

**order(id_or_ins, quantity, price_or_style=None)**
智能调仓。股票等同 order_shares；期货自动处理开平：
- quantity > 0: 先平空仓，再开多仓
- quantity < 0: 先平多仓，再开空仓

**order_to(id_or_ins, quantity, price_or_style=None)**
调仓至目标量。
- quantity > 0: 调至多头 quantity 手
- quantity < 0: 调至空头 |quantity| 手

### 股票专用下单

| 函数 | 说明 |
|------|------|
| `order_shares(id, amount)` | 按股数，正买负卖，自动取整100股 |
| `order_lots(id, amount)` | 按手数，1手=100股 |
| `order_value(id, cash_amount)` | 按金额，资金不足用最大可用资金 |
| `order_percent(id, percent)` | 按组合比例下单，0.5=50% |
| `order_target_value(id, cash_amount)` | 调仓到目标市值 |
| `order_target_percent(id, percent)` | 调仓到目标比例 |
| `order_target_portfolio(target_dict)` | 批量调仓，未列出的会被平仓 |

**order_target_portfolio 示例：**
```python
# 调仓至等权持有两只股票，各占50%
order_target_portfolio({
    '000001.XSHE': 0.5,
    '600000.XSHG': 0.5
})
# 注意：未出现在 target_dict 中的持仓会被全部平掉
```

### 期货专用下单

| 函数 | 说明 |
|------|------|
| `buy_open(id, amount, price_or_style)` | 买开仓 |
| `sell_close(id, amount, price_or_style, close_today=False)` | 平多仓 |
| `sell_open(id, amount, price_or_style)` | 卖开仓 |
| `buy_close(id, amount, price_or_style, close_today=False)` | 平空仓 |

### 订单管理

```python
cancel_order(order)       # 撤单
get_open_orders()         # 获取所有未成交订单，返回 dict {order_id: Order}
```

## 关键对象

### context.portfolio
```python
context.portfolio.starting_cash    # 初始资金
context.portfolio.cash             # 可用现金
context.portfolio.frozen_cash      # 冻结资金
context.portfolio.total_value      # 总权益（现金+市值）
context.portfolio.market_value     # 持仓市值
context.portfolio.pnl              # 累计盈亏
context.portfolio.daily_pnl        # 当日盈亏
context.portfolio.daily_returns    # 当日收益率
context.portfolio.total_returns    # 累计收益率
context.portfolio.positions        # 持仓字典
```

### Position 对象
```python
pos = get_position('000001.XSHE')
pos.order_book_id    # 合约ID
pos.quantity         # 持有数量
pos.market_value     # 当前市值
pos.avg_price        # 开仓均价
pos.pnl              # 累计盈亏
pos.sellable         # 可卖数量（考虑T+1）
```

### Order 对象
```python
order.order_book_id   # 合约ID
order.quantity        # 委托数量
order.filled_quantity # 已成交数量
order.price           # 委托价格
order.side            # 买卖方向 SIDE.BUY / SIDE.SELL
order.status          # 订单状态
```

### BarObject
```python
bar = bar_dict['000001.XSHE']
bar.open, bar.close, bar.high, bar.low
bar.volume           # 成交量
bar.total_turnover   # 成交额
bar.datetime         # 时间
bar.limit_up         # 涨停价
bar.limit_down       # 跌停价
bar.isnan            # 是否为空（停牌）
```

### Instrument 对象
```python
inst = instruments('000001.XSHE')
inst.order_book_id   # 合约ID
inst.symbol          # 中文名
inst.listed_date     # 上市日期
inst.de_listed_date  # 退市日期
inst.type            # 类型: 'CS'(股票), 'Future'(期货), 'ETF', 'INDX'(指数)
inst.round_lot       # 最小交易单位（股票=100）
```

## 常量枚举

```python
from rqalpha.const import SIDE, POSITION_EFFECT, ORDER_TYPE, POSITION_DIRECTION

SIDE.BUY / SIDE.SELL
POSITION_EFFECT.OPEN / POSITION_EFFECT.CLOSE / POSITION_EFFECT.CLOSE_TODAY
ORDER_TYPE.MARKET / ORDER_TYPE.LIMIT
POSITION_DIRECTION.LONG / POSITION_DIRECTION.SHORT
```
