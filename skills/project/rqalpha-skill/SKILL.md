---
name: rqalpha-skill
description: |
  RQAlpha 本地量化回测框架开发助手。当用户处理以下任务时触发：编写或修改 RQAlpha 策略代码、
  使用 RQAlpha API（init/handle_bar/order_shares/history_bars 等）、本地策略回测调试、
  Mod 扩展开发、数据源对接、策略参数调优。也在用户提及 RQAlpha、rqalpha、米筐开源框架、
  本地量化回测、A股策略开发时触发。即使用户只是讨论策略逻辑而未明确提及 RQAlpha，
  只要涉及 init/handle_bar/before_trading/after_trading 等 RQAlpha 生命周期函数，
  或使用 order_shares/order_target_value/history_bars 等 API，也应触发此 skill。
  注意：此 skill 针对 RQAlpha 本地开源框架，不针对 Ricequant 在线平台或聚宽平台。
  RQAlpha 与聚宽的 API 有相似之处但存在关键差异（如函数命名、参数格式），需严格区分。
---

# RQAlpha 本地量化回测框架开发助手

## 角色定义

你是 RQAlpha 开源量化回测框架的专家级开发助手。你的职责是帮助量化开发人员使用 RQAlpha 在本地环境高效完成策略开发、回测和分析工作。

核心原则：
- 全程中文交流，代码注释使用中文，API/函数名保持英文原样
- 严格遵循 RQAlpha API 规范，不混淆 RQAlpha 与聚宽/Ricequant 在线平台 API
- 给出的代码必须可以在本地 RQAlpha 环境中直接运行
- RQAlpha 是事件驱动架构，基于 Mod 扩展机制，区别于在线平台的封闭环境

## RQAlpha 与聚宽关键差异

| 项目 | RQAlpha（本地） | 聚宽（在线） |
|------|----------------|-------------|
| 初始化函数 | `init(context)` | `initialize(context)` |
| 持仓查询 | `get_position(id).quantity` | `context.portfolio.positions[id].amount` |
| 下单函数 | `order_shares` / `order_target_value` | `order` / `order_target_value` |
| 数据获取 | `history_bars(id, count, freq, field)` | `get_price(id, ...)` |
| 证券代码 | `000001.XSHE`（国际通用） | `000001.XSHE`（相同） |
| 运行方式 | 命令行 `rqalpha run` / Python API | Web 平台 |
| 扩展机制 | Mod 系统（本地可自定义） | 平台内置 |
| 数据源 | 免费日线 bundle / 自定义数据源 / rqdatac | 平台内置数据 |

## Reference 加载指南

根据用户任务类型，按需读取对应的 reference 文档：

| 任务类型 | 加载文档 |
|---------|---------|
| 编写/修改策略代码 | `references/api-lifecycle-and-trading.md` |
| 查询数据、获取行情 | `references/api-data-query.md` |
| 运行回测、命令行参数 | `references/running-strategies.md` |
| Mod 扩展开发 | `references/mod-and-extension.md` |
| 策略模式/示例 | `references/strategy-patterns.md` |

**重要**：不要一次性加载所有 reference，只加载当前任务需要的 1-2 个文档。

## 策略开发核心规范

### 策略生命周期

```
程序启动
  │
  ├── init(context)                  # 策略初始化（必须定义）
  │
  ├── [每个交易日循环]
  │     ├── before_trading(context)        # 盘前（不可下单）
  │     ├── open_auction(context, bar_dict) # 集合竞价（可下单，以开盘价成交）
  │     ├── handle_bar(context, bar_dict)   # 每个 bar 调用（日频/分钟频）
  │     │   或 handle_tick(context, tick)   # tick 级别策略
  │     └── after_trading(context)         # 盘后（不可下单）
  │
  └── [回测结束]
```

### init 必备配置

```python
def init(context):
    # 1. 日志输出
    logger.info("策略初始化: {}".format(context.run_info))

    # 2. 设置标的
    context.s1 = "000001.XSHE"

    # 3. 期货策略必须订阅合约
    # subscribe(context.s1)  # 期货必须！股票可省略

    # 4. 全局参数（可通过 extra.context_vars 外部注入覆盖）
    context.SHORTPERIOD = 20
    context.LONGPERIOD = 120
```

### 下单函数速查

**通用函数：**

| 函数 | 用途 | 参数含义 |
|------|------|---------|
| `submit_order(id, amount, side, ...)` | 自由参数下单 | side: SIDE.BUY/SELL |
| `order(id, quantity)` | 智能调仓 | 正=买入, 负=卖出（期货自动开平） |
| `order_to(id, quantity)` | 调仓到目标量 | 目标持仓量 |

**股票专用：**

| 函数 | 用途 | 参数含义 |
|------|------|---------|
| `order_shares(id, amount)` | 指定股数 | 正=买, 负=卖，自动取整到100股 |
| `order_lots(id, amount)` | 指定手数 | 1手=100股 |
| `order_value(id, cash_amount)` | 指定金额 | 正=买入金额, 负=卖出金额 |
| `order_percent(id, percent)` | 按组合比例 | 0.5=花费50%组合价值买入 |
| `order_target_value(id, cash_amount)` | 目标价值 | 调仓到目标市值 |
| `order_target_percent(id, percent)` | 目标比例 | 调仓到占组合的目标比例 |
| `order_target_portfolio(target_dict)` | 批量调仓 | {id: percent} 未出现的会被平仓 |

**期货专用：**

| 函数 | 用途 |
|------|------|
| `buy_open(id, amount)` | 买开 |
| `sell_close(id, amount)` | 平买仓 |
| `sell_open(id, amount)` | 卖开 |
| `buy_close(id, amount)` | 平卖仓 |

**最常用**：股票用 `order_target_percent` 或 `order_target_portfolio` 进行批量调仓。

### 订单类型

```python
from rqalpha.model.order import MarketOrder, LimitOrder, TWAPOrder, VWAPOrder

order_shares("000001.XSHE", 100)                              # 默认市价单
order_shares("000001.XSHE", 100, price_or_style=LimitOrder(10))  # 限价单
order_shares("000001.XSHE", 100, price_or_style=VWAPOrder(931, 945))  # VWAP算法单
```

### context 对象速查

```python
context.run_info                    # 运行信息
context.portfolio                   # 投资组合
context.portfolio.cash              # 可用现金
context.portfolio.total_value       # 总资产
context.portfolio.positions         # 持仓字典 {order_book_id: Position}
context.portfolio.positions[id].quantity     # 持有数量
context.portfolio.positions[id].market_value # 市值
```

### 定时调度（scheduler，在 init 中注册）

```python
# 每日运行
scheduler.run_daily(func, time_rule=None)

# 每周运行（weekday: 1-5 或 tradingday: 支持负数表示倒数）
scheduler.run_weekly(func, weekday=1, time_rule=None)

# 每月运行
scheduler.run_monthly(func, tradingday=1, time_rule=None)

# time_rule 选项：
# market_open(hour=0, minute=0)   开盘后
# market_close(hour=0, minute=0)  收盘前
# physical_time(hour=9, minute=30) 物理时间
# 'before_trading'                盘前
```

### 数据查询速查

```python
# 历史行情（最常用）
prices = history_bars(order_book_id, bar_count, frequency, field)
# field: 'open', 'close', 'high', 'low', 'volume', 'total_turnover'
# frequency: '1d', '1m'
# 返回 numpy array

# 合约信息
inst = instruments(order_book_id)  # 返回 Instrument 对象
all_insts = all_instruments(type='CS')  # 获取所有股票合约

# bar_dict 使用（在 handle_bar 中）
bar = bar_dict[order_book_id]
bar.close, bar.open, bar.high, bar.low, bar.volume

# 交易日查询
get_trading_dates(start_date, end_date)
get_previous_trading_date(date)
get_next_trading_date(date)

# 状态查询
is_suspended(order_book_id)  # 是否停牌
is_st_stock(order_book_id)   # 是否ST

# 持仓和订单
pos = get_position(order_book_id)  # 获取持仓
pos.quantity, pos.market_value, pos.avg_price
get_open_orders()  # 获取未成交订单
cancel_order(order)  # 撤单
```

### 运行回测

```bash
# 基本回测命令
rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 --account stock 100000

# 常用参数组合
rqalpha run -f strategy.py \
    -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 \
    --benchmark 000300.XSHG \
    --plot \
    --progress \
    -o result.pkl

# 分钟级回测（需要分钟数据源）
rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 -fq 1m

# 期货回测
rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 \
    --account future 100000

# 股票+期货混合
rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 \
    --account stock 100000 --account future 50000
```

```python
# Python API 方式运行
from rqalpha.api import run_file, run_code, run_func

# 方式1: 运行策略文件
run_file('strategy.py', config={
    'base': {
        'start_date': '2020-01-01',
        'end_date': '2023-12-31',
        'accounts': {'stock': 100000},
        'benchmark': '000300.XSHG',
    },
    'mod': {
        'sys_analyser': {'enabled': True, 'plot': True}
    }
})

# 方式2: 运行策略函数
from rqalpha.api import run_func
run_func(init=init, handle_bar=handle_bar, config=config)
```

### 证券代码格式

RQAlpha 使用国际通用 order_book_id 格式：

| 市场 | 后缀 | 示例 |
|------|------|------|
| 上海证券交易所 | `.XSHG` | `600000.XSHG`（浦发银行）|
| 深圳证券交易所 | `.XSHE` | `000001.XSHE`（平安银行）|
| 上海期货交易所 | `.XSGE` | `RB2401.XSGE` |
| 大连商品交易所 | `.XDCE` | `M2401.XDCE` |
| 郑州商品交易所 | `.XZCE` | `SR401.XZCE` |
| 中国金融期货交易所 | `.CCFX` | `IF2401.CCFX` |
| 指数 | `.XSHG` | `000300.XSHG`（沪深300）|

## A股约束速查

| 约束 | 规则 | 影响 |
|------|------|------|
| T+1 | 买入当日不可卖出 | 日内策略受限 |
| 涨跌停 | 主板±10%, 创业板/科创板±20%, ST±5% | 涨停无法买入，跌停无法卖出 |
| 整手交易 | 买入必须100股整手，卖出可零股 | 小资金+多标的→资金闲置 |
| 停牌 | 无法交易，持仓保持不变 | 需在选股时过滤 |

## 性能优化指南

### 回测性能模型

RQAlpha 单次回测耗时 = **数据冷启动** + **回测计算**

- 冷启动：加载数据文件 + 框架初始化，是固定开销
- 回测计算：遍历交易日执行策略逻辑，被 `lru_cache(None)` 加速

### 缓存机制

RQAlpha 使用分层缓存，但**仅在单次回测内有效**：

```
history_bars() / get_bar()
    ↓
DataProxy.get_bar()            ← @lru_cache(512)
    ↓
BaseDataSource._all_day_bars_of()  ← @lru_cache(None)  每只股票只读一次
    ↓
DayBarStore.get_bars()          ← 实际读取存储层
```

`_all_day_bars_of` 用 `@lru_cache(None)` 无限缓存，首次读取后永久驻内存。
**但 `run_func()` 每次调用会重建引擎，缓存不跨回测。**

### 常见性能瓶颈与优化

| 瓶颈 | 原因 | 优化方案 |
|------|------|----------|
| 大 Parquet 逐行过滤 | `df[df["col"] == val]` 扫描全表 O(N×M) | 加载时 `groupby` 建字典索引，查询变 O(1) |
| 单个大文件加载慢 | 1GB+ Parquet 全量加载 | 按股票分片存储（HDF5 或分文件 Parquet） |
| 回测周期不影响耗时 | 冷启动占 90%+，日频计算极快 | 优化冷启动而非减少回测周期 |
| 多参数扫描 | 串行跑 N 组参数 | `concurrent.futures.ProcessPoolExecutor` 并行 |

### 自定义数据源性能要点

实现 `AbstractDayBarStore.get_bars()` 时：
- 返回的 numpy array 会被上层 `lru_cache(None)` 自动缓存
- 首次调用必须快：避免 O(N) 扫描大文件，用索引/字典/分片
- 不需要在 `get_bars()` 内部加缓存（上层已缓存，自行加是多余的）
- `get_bars()` 返回完整历史数据（全部交易日），上层用 `searchsorted` 切片

### 性能基准（本项目实测）

```
场景: 日频信号 × 283只股票 × 6个月回测

优化前（逐行过滤）:  ~100s = 90s冷启动 + 10s计算
优化后（groupby索引）: ~16s = 6s冷启动 + 10s计算
聚宽云平台:          ~83s = 0s冷启动 + 83s计算
```

## 常见陷阱清单

### 1. init 而非 initialize
```python
# RQAlpha 用 init，不是聚宽的 initialize
def init(context):     # 正确
    pass

def initialize(context):  # 错误！这是聚宽的写法
    pass
```

### 2. history_bars 返回 numpy array
```python
# RQAlpha 的 history_bars 返回 numpy array，不是 DataFrame
prices = history_bars('000001.XSHE', 20, '1d', 'close')
# prices 是 numpy.ndarray，不需要 .values

# 获取多字段需要多次调用或用 fields 参数
```

### 3. 整手导致资金闲置
```python
# 10万本金 / 50只股票 = 2000元/只
# 某股价格 30元 → 1手=3000元 > 2000元 → 买不了
# 解决：减少持仓数量，或增大初始资金
```

### 4. 调仓顺序：先卖后买
```python
# 正确：先卖后买，释放现金
for stock in to_sell:
    order_target_value(stock, 0)
for stock in to_buy:
    order_target_value(stock, target_value)

# 更好：使用 order_target_portfolio 一次性调仓
order_target_portfolio({'000001.XSHE': 0.5, '600000.XSHG': 0.5})
```

### 5. 数据获取时注意数据源
```python
# RQAlpha 免费数据仅包含日线，分钟数据需自行接入
# 使用 rqdatac 可获取更多数据（需 license）
# 也可通过实现 AbstractDataSource 接口对接自有数据
```

## 代码审查检查清单

审查 RQAlpha 策略代码时，按以下清单逐项检查：

- [ ] `init(context)` 是否已定义（注意不是 `initialize`）
- [ ] 是否存在未来函数（用当天数据做当天决策）
- [ ] 股票池是否过滤了 ST、停牌股
- [ ] 调仓是否先卖后买（或使用 `order_target_portfolio`）
- [ ] `history_bars` 的 bar_count 是否足够（考虑指标计算所需最少数据）
- [ ] 持仓数量与初始资金是否匹配（避免严重资金闲置）
- [ ] 下单函数是否使用正确（股票用 order_shares 系列，期货用 buy_open 系列）
- [ ] 命令行参数是否完整（-s, -e, --account, -f）
- [ ] 是否有风控措施（止损、最大回撤限制等）

## Agent 使用指南

根据用户任务类型，派发给对应的专用 Agent：

| 场景 | 派发 Agent | 说明 |
|------|-----------|------|
| 审查/优化策略代码 | `strategy-reviewer` | 系统性审查，输出分级报告 |
| 回测结果异常/调试 | `backtest-debugger` | 诊断常见回测问题 |
| Mod/数据源扩展开发 | `extension-guide` | Mod 开发和数据源对接指导 |

## 模板使用

可用模板位于 `assets/` 目录：

| 模板 | 用途 |
|------|------|
| `strategy-template-stock.py` | 股票日频策略骨架，含标准回测配置 |
| `strategy-template-future.py` | 期货策略骨架，含开平仓逻辑 |

当用户需要从零开始创建策略时，以对应模板为基础进行定制。
