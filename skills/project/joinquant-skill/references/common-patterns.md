# 常用策略模式 + 反模式

## 模式 1: 月度调仓（最常用）

```python
def initialize(context):
    set_benchmark('000300.XSHG')
    set_option('use_real_price', True)
    set_slippage(FixedSlippage(0.02))
    set_order_cost(OrderCost(
        open_tax=0, close_tax=0.0005,
        open_commission=0.0003, close_commission=0.0003,
        min_commission=5
    ), type='stock')

    context.stock_num = 20
    run_monthly(rebalance, monthday=-1, time='open')

def rebalance(context):
    # 1. 获取信号日数据（T-1）
    signal_date = get_trade_days(end_date=context.current_dt, count=2)[0]

    # 2. 选股池
    stocks = get_index_stocks('000300.XSHG', date=signal_date)
    stocks = filter_stocks(stocks, context.current_dt)

    # 3. 因子计算 + 选股
    target_stocks = compute_and_select(stocks, signal_date, context.stock_num)

    # 4. 调仓（先卖后买）
    target_value = context.portfolio.total_value / len(target_stocks)

    # 卖出不在目标中的持仓
    for stock in list(context.portfolio.positions):
        if stock not in target_stocks:
            order_target_value(stock, 0)

    # 买入目标持仓
    for stock in target_stocks:
        order_target_value(stock, target_value)
```

## 模式 2: 多因子选股流程

```python
def compute_and_select(stock_list, date, num):
    """多因子选股：选股池 → 获取因子 → 打分 → 排序 → 取前N"""
    # 1. 获取因子数据
    q = query(
        valuation.code,
        valuation.market_cap,
        valuation.pb_ratio,
        indicator.roe,
    ).filter(
        valuation.code.in_(stock_list)
    )
    df = get_fundamentals(q, date=date)

    # 2. 因子预处理（去极值 + 标准化）
    for col in ['market_cap', 'pb_ratio', 'roe']:
        df[col] = winsorize(df[col])
        df[col] = standardlize(df[col])

    # 3. 综合打分（等权合成）
    df['score'] = -df['market_cap'] + (-df['pb_ratio']) + df['roe']
    # 小市值 + 低PB + 高ROE

    # 4. 排序取前N
    df = df.sort_values('score', ascending=False)
    return list(df['code'].head(num))
```

## 模式 3: 先卖后买（释放现金）

```python
def rebalance(context):
    target_stocks = get_target_stocks()
    target_value = context.portfolio.total_value / len(target_stocks)

    # ❌ 错误：同时买卖可能现金不足
    # for stock in target_stocks:
    #     order_target_value(stock, target_value)

    # ✅ 正确：先卖出释放现金，再买入
    current_holdings = set(context.portfolio.positions.keys())
    target_set = set(target_stocks)

    # Step 1: 卖出不在目标中的
    for stock in current_holdings - target_set:
        order_target_value(stock, 0)

    # Step 2: 买入/调整目标持仓
    for stock in target_stocks:
        order_target_value(stock, target_value)
```

## 模式 4: 股票池过滤

```python
def filter_stocks(stock_list, date):
    """标准股票池过滤"""
    current_data = get_current_data()
    filtered = []
    for stock in stock_list:
        # 停牌
        if current_data[stock].paused:
            continue
        # ST
        if current_data[stock].is_st:
            continue
        # 涨停（开盘涨停买不进）
        if current_data[stock].day_open >= current_data[stock].high_limit:
            continue
        # 次新股（上市不满60天）
        info = get_security_info(stock)
        if (date - info.start_date).days < 60:
            continue
        filtered.append(stock)
    return filtered
```

## 模式 5: 均线择时

```python
def initialize(context):
    # ... 基本配置 ...
    context.index = '000300.XSHG'
    run_daily(timing, time='open')

def timing(context):
    """指数均线择时：指数在均线上方做多，下方空仓"""
    df = get_price(context.index, count=20, end_date=context.current_dt,
                   fields=['close'], panel=False)
    ma20 = df['close'].mean()
    current_price = df['close'].iloc[-1]

    if current_price > ma20:
        # 指数在20日均线上方 → 满仓
        do_rebalance(context)
    else:
        # 指数在20日均线下方 → 清仓
        for stock in list(context.portfolio.positions):
            order_target_value(stock, 0)
```

## 模式 6: 止损机制

```python
def initialize(context):
    context.max_drawdown = 0.15  # 最大回撤15%止损
    context.peak_value = 0
    run_daily(check_drawdown, time='open')

def check_drawdown(context):
    """个股止损 + 组合止损"""
    # 组合止损
    context.peak_value = max(context.peak_value, context.portfolio.total_value)
    drawdown = 1 - context.portfolio.total_value / context.peak_value
    if drawdown > context.max_drawdown:
        log.warn(f'触发组合止损: 回撤{drawdown:.2%}')
        for stock in list(context.portfolio.positions):
            order_target_value(stock, 0)
        return

    # 个股止损（亏损超过10%）
    for stock, pos in list(context.portfolio.positions.items()):
        if pos.last_sale_price / pos.avg_cost - 1 < -0.10:
            log.info(f'止损卖出: {stock}')
            order_target_value(stock, 0)
```

## 模式 7: 记录自定义指标

```python
def after_trading_end(context):
    # 记录持仓数和现金比例（在回测图表中显示）
    positions_count = len(context.portfolio.positions)
    cash_ratio = context.portfolio.cash / context.portfolio.total_value
    record(
        positions=positions_count,
        cash_ratio=cash_ratio,
    )
```

## 反模式（常见错误）

### 反模式 1: 未来函数
```python
# ❌ 日频策略中用当天收盘价做决策
df = get_price(stock, end_date=context.current_dt, count=1)
close_today = df['close'].iloc[-1]  # 09:30时收盘价还不存在！

# ✅ 用前一天数据
df = get_price(stock, end_date=context.current_dt, count=2)
close_yesterday = df['close'].iloc[-2]  # 或 iloc[0] if count=2
```

### 反模式 2: 用 statDate 获取财务数据
```python
# ❌ 有未来函数风险
df = get_fundamentals(q, statDate='2024q1')  # 2024Q1报表4月底才出

# ✅ 用 date 参数
df = get_fundamentals(q, date='2024-03-15')  # 获取截止该日已公布的数据
```

### 反模式 3: 不过滤股票池
```python
# ❌ 直接用指数成分股
stocks = get_index_stocks('000300.XSHG')
for stock in stocks[:20]:
    order_target_value(stock, value)  # 可能买到停牌/涨停/ST股

# ✅ 过滤后再交易
stocks = filter_stocks(get_index_stocks('000300.XSHG'), context.current_dt)
```

### 反模式 4: 小资金+多标的
```python
# ❌ 10万本金持50只 = 2000元/只，高价股买不了1手
context.stock_num = 50  # 对10万本金来说太多

# ✅ 匹配资金规模
# 10万本金建议: 10-15只
# 50万本金建议: 20-30只
# 100万本金建议: 30-50只
```

### 反模式 5: 买卖不分先后
```python
# ❌ 先买后卖可能现金不足
for stock in to_buy:
    order_target_value(stock, value)
for stock in to_sell:
    order_target_value(stock, 0)

# ✅ 先卖后买
for stock in to_sell:
    order_target_value(stock, 0)
for stock in to_buy:
    order_target_value(stock, value)
```

## 研究环境 → 回测迁移清单

将研究环境的分析代码迁移到回测策略时，检查以下事项：

- [ ] 将交互式代码重构为生命周期函数结构
- [ ] 所有硬编码日期改为 `context.current_dt` 或相对时间
- [ ] `get_price` 的 `end_date` 不能超过当前时间点
- [ ] `get_fundamentals` 使用 `date` 参数（非 `statDate`）
- [ ] matplotlib 绘图替换为 `record()` 记录指标
- [ ] 添加 `set_benchmark`、`set_option`、成本模型等配置
- [ ] 添加股票池过滤（ST/停牌/涨停/次新股）
- [ ] 确保调仓逻辑先卖后买
