# RQAlpha 策略模式与示例

## 策略模式一：买入持有

最简单的策略，买入后一直持有。

```python
def init(context):
    context.s1 = "000001.XSHE"

def handle_bar(context, bar_dict):
    cur_position = get_position(context.s1).quantity
    if cur_position == 0:
        order_percent(context.s1, 1)  # 满仓买入
```

运行：
```bash
rqalpha run -f buy_and_hold.py -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 --benchmark 000300.XSHG --plot
```

## 策略模式二：双均线交叉（Golden Cross）

经典技术指标策略，短均线上穿长均线买入，下穿卖出。

```python
import talib

def init(context):
    context.s1 = "000001.XSHE"
    context.SHORTPERIOD = 20
    context.LONGPERIOD = 120

def handle_bar(context, bar_dict):
    prices = history_bars(context.s1, context.LONGPERIOD + 1, '1d', 'close')
    short_avg = talib.SMA(prices, context.SHORTPERIOD)
    long_avg = talib.SMA(prices, context.LONGPERIOD)

    cur_position = get_position(context.s1).quantity
    shares = context.portfolio.cash / bar_dict[context.s1].close

    # 死叉：清仓
    if short_avg[-1] < long_avg[-1] and short_avg[-2] > long_avg[-2] and cur_position > 0:
        order_target_value(context.s1, 0)

    # 金叉：满仓
    if short_avg[-1] > long_avg[-1] and short_avg[-2] < long_avg[-2]:
        order_shares(context.s1, shares)
```

## 策略模式三：多因子选股+定期调仓

```python
import numpy as np

def init(context):
    context.stock_pool = ['000001.XSHE', '600000.XSHG', '601318.XSHG',
                          '000002.XSHE', '600036.XSHG']
    context.hold_num = 3
    context.rebalance_days = 0

def handle_bar(context, bar_dict):
    context.rebalance_days += 1
    if context.rebalance_days % 20 != 1:  # 每20个交易日调仓
        return

    # 计算动量因子
    scores = {}
    for stock in context.stock_pool:
        if is_suspended(stock) or is_st_stock(stock):
            continue
        prices = history_bars(stock, 21, '1d', 'close')
        if len(prices) < 21:
            continue
        momentum = prices[-1] / prices[0] - 1
        scores[stock] = momentum

    # 选择动量最高的 N 只
    sorted_stocks = sorted(scores, key=scores.get, reverse=True)[:context.hold_num]

    # 调仓：使用 order_target_portfolio 一步到位
    target = {stock: 1.0 / context.hold_num for stock in sorted_stocks}
    order_target_portfolio(target)
```

## 策略模式四：期货双均线

```python
import talib

def init(context):
    context.s1 = 'RB2401'  # 螺纹钢
    context.SHORTPERIOD = 10
    context.LONGPERIOD = 30

def handle_bar(context, bar_dict):
    prices = history_bars(context.s1, context.LONGPERIOD + 1, '1d', 'close')
    short_avg = talib.SMA(prices, context.SHORTPERIOD)
    long_avg = talib.SMA(prices, context.LONGPERIOD)

    long_pos = get_position(context.s1, POSITION_DIRECTION.LONG)
    short_pos = get_position(context.s1, POSITION_DIRECTION.SHORT)

    # 金叉：平空开多
    if short_avg[-1] > long_avg[-1] and short_avg[-2] < long_avg[-2]:
        if short_pos.quantity > 0:
            buy_close(context.s1, short_pos.quantity)
        buy_open(context.s1, 1)

    # 死叉：平多开空
    if short_avg[-1] < long_avg[-1] and short_avg[-2] > long_avg[-2]:
        if long_pos.quantity > 0:
            sell_close(context.s1, long_pos.quantity)
        sell_open(context.s1, 1)
```

运行：
```bash
rqalpha run -f futures_strategy.py -s 2023-01-01 -e 2023-12-31 \
    --account future 100000 --plot
```

## 策略模式五：RSI 策略

```python
import talib

def init(context):
    context.s1 = "000001.XSHE"
    context.rsi_period = 14
    context.rsi_buy = 30
    context.rsi_sell = 70

def handle_bar(context, bar_dict):
    prices = history_bars(context.s1, context.rsi_period + 1, '1d', 'close')
    rsi = talib.RSI(prices, context.rsi_period)[-1]

    cur_position = get_position(context.s1).quantity

    if rsi < context.rsi_buy and cur_position == 0:
        order_percent(context.s1, 0.9)  # 90%仓位买入

    if rsi > context.rsi_sell and cur_position > 0:
        order_target_value(context.s1, 0)  # 清仓
```

## 策略模式六：止损止盈

```python
def init(context):
    context.s1 = "000001.XSHE"
    context.stop_loss = -0.05   # 止损线 -5%
    context.take_profit = 0.10  # 止盈线 +10%

def handle_bar(context, bar_dict):
    pos = get_position(context.s1)

    if pos.quantity > 0:
        # 计算收益率
        pnl_rate = (bar_dict[context.s1].close - pos.avg_price) / pos.avg_price

        if pnl_rate <= context.stop_loss:
            logger.info(f"止损: 收益率 {pnl_rate:.2%}")
            order_target_value(context.s1, 0)
            return

        if pnl_rate >= context.take_profit:
            logger.info(f"止盈: 收益率 {pnl_rate:.2%}")
            order_target_value(context.s1, 0)
            return

    # 入场逻辑...
```

## 常用工具函数

### 使用 plot 绘制自定义指标
```python
def handle_bar(context, bar_dict):
    prices = history_bars(context.s1, 21, '1d', 'close')
    ma20 = prices.mean()
    plot("MA20", ma20)
    plot("price", bar_dict[context.s1].close)
```

### 使用 logger 输出日志
```python
def handle_bar(context, bar_dict):
    logger.info("当前现金: {:.2f}".format(context.portfolio.cash))
    logger.warn("警告信息")
    logger.error("错误信息")
```

## 反模式（应避免）

### 1. 用当天未来数据
```python
# 错误：日频回测中，handle_bar 触发时当天的 close 还不确定
# history_bars 返回的最后一条是当天数据（收盘后才确定）
# 如果使用 current_bar 撮合引擎，需注意数据时点
```

### 2. 不过滤停牌/ST
```python
# 错误
for stock in stocks:
    order_shares(stock, 100)  # 停牌股无法成交

# 正确
for stock in stocks:
    if not is_suspended(stock) and not is_st_stock(stock):
        order_shares(stock, 100)
```

### 3. 不检查数据长度
```python
# 错误
prices = history_bars(stock, 120, '1d', 'close')
ma120 = prices.mean()  # 如果上市不足120天会出错

# 正确
prices = history_bars(stock, 120, '1d', 'close')
if len(prices) < 120:
    return
ma120 = prices.mean()
```
