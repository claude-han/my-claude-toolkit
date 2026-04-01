# RQAlpha Mod 扩展与数据源对接

## Mod 系统概述

RQAlpha 基于事件驱动架构，通过 Mod（模块）系统实现扩展。所有功能（包括内置功能）都以 Mod 形式存在。

### 核心架构组件

| 组件 | 职责 | 替换方法 |
|------|------|----------|
| **Environment (env)** | 全局环境，持有所有核心组件引用 | - |
| **EventBus** | 事件总线，订阅/发布事件 | - |
| **DataProxy** | 数据接口封装层 | - |
| **AbstractDataSource** | 数据源 | `env.set_data_source()` |
| **AbstractEventSource** | 事件生成器 | `env.set_event_source()` |
| **AbstractBroker** | 订单撮合 | `env.set_broker()` |
| **AbstractStrategyLoader** | 策略加载器 | `env.set_strategy_loader()` |
| **AbstractPriceBoard** | 最新行情价格板 | `env.set_price_board()` |
| **AbstractPersistProvider** | 持久化服务 | `env.set_persist_provider()` |
| **AbstractFrontendValidator** | 前端风控 | `env.add_frontend_validator()` |

运行流程：EventSource 生成事件 -> EventBus 分发 -> 各模块响应（策略函数、账户更新、风控等）

### 内置 Mod 列表

| Mod | 说明 |
|-----|------|
| `sys_accounts` | 账户管理、分红退市、下单控制、风控选项 |
| `sys_analyser` | 回测输出：图表、记录文件、benchmark |
| `sys_progress` | 回测进度条 |
| `sys_risk` | 前端风控 |
| `sys_simulation` | 撮合引擎 |
| `sys_transaction_cost` | 税费计算 |

### Mod 管理命令

```bash
# 查看已安装的 Mod
rqalpha mod list

# 启用/禁用 Mod
rqalpha mod enable mod_name
rqalpha mod disable mod_name

# 安装第三方 Mod
rqalpha mod install mod_package_name
```

## 自定义 Mod 开发

### 基本结构

每个 Mod 需要继承 `AbstractMod` 并实现 `start_up` 和 `tear_down` 方法。

```python
from rqalpha.interface import AbstractMod

class MyMod(AbstractMod):
    def start_up(self, env, mod_config):
        """
        Mod 启动时调用
        env: Environment 对象，提供对 RQAlpha 核心组件的访问
        mod_config: 该 Mod 的配置
        """
        # 注册事件监听
        env.event_bus.add_listener(EVENT.BEFORE_TRADING, self._before_trading)
        env.event_bus.add_listener(EVENT.TRADE, self._on_trade)

    def tear_down(self, success, exception=None):
        """Mod 关闭时调用"""
        pass

    def _before_trading(self, event):
        """盘前处理"""
        pass

    def _on_trade(self, event):
        """成交事件处理"""
        trade = event.trade
        logger.info(f"成交: {trade.order_book_id} {trade.last_quantity}@{trade.last_price}")
```

### Mod 包结构

```
rqalpha_mod_my_mod/
├── __init__.py      # 必须包含 load_mod() 函数
├── mod.py           # Mod 实现
└── README.rst       # 说明文档
```

`__init__.py` 需要包含：
```python
__config__ = {
    'option1': 'default_value',
}

def load_mod():
    from .mod import MyMod
    return MyMod()
```

## 事件系统

RQAlpha 使用 `event_bus` 进行事件注册和分发。

### 核心事件列表

**系统事件：**

| 事件 | 触发时机 |
|------|---------|
| `EVENT.POST_SYSTEM_INIT` | 系统初始化完成后 |
| `EVENT.POST_USER_INIT` | 策略 init 执行后 |
| `EVENT.POST_SYSTEM_RESTORED` | 系统状态恢复后（实盘用）|

**市场事件（核心事件有 PRE_/POST_ 前后钩子）：**

| 事件 | 触发时机 |
|------|---------|
| `EVENT.BEFORE_TRADING` | 每日盘前 |
| `EVENT.OPEN_AUCTION` | 集合竞价 |
| `EVENT.BAR` | 每个 bar 数据更新 |
| `EVENT.TICK` | tick 数据更新 |
| `EVENT.AFTER_TRADING` | 每日盘后 |
| `EVENT.PRE_SETTLEMENT` / `SETTLEMENT` / `POST_SETTLEMENT` | 结算流程 |
| `EVENT.POST_UNIVERSE_CHANGED` | 证券池变化 |

**交易事件：**

| 事件 | 触发时机 |
|------|---------|
| `EVENT.ORDER_PENDING_NEW` | 订单创建 |
| `EVENT.ORDER_CREATION_PASS` | 订单通过风控 |
| `EVENT.ORDER_CREATION_REJECT` | 订单被拒 |
| `EVENT.ORDER_PENDING_CANCEL` | 撤单请求 |
| `EVENT.ORDER_CANCELLATION_PASS` | 撤单成功 |
| `EVENT.ORDER_CANCELLATION_REJECT` | 撤单被拒 |
| `EVENT.TRADE` | 成交 |

### 注册事件监听

```python
from rqalpha.events import EVENT

def start_up(self, env, mod_config):
    env.event_bus.add_listener(EVENT.BAR, self._on_bar)
    env.event_bus.add_listener(EVENT.TRADE, self._on_trade)
    env.event_bus.add_listener(EVENT.SETTLEMENT, self._on_settlement)
```

## 扩展数据源

### AbstractDataSource 接口

要对接自有数据源，需实现 `AbstractDataSource` 接口：

```python
from rqalpha.interface import AbstractDataSource

class MyDataSource(AbstractDataSource):
    def get_all_instruments(self):
        """返回所有合约信息列表"""
        pass

    def get_trading_calendar(self):
        """返回交易日历 (numpy array of datetime)"""
        pass

    def history_bars(self, instrument, bar_count, frequency, fields,
                     dt, skip_suspended=True, include_now=False,
                     adjust_type='pre', adjust_orig=None):
        """获取历史K线数据"""
        pass

    def current_snapshot(self, instrument, frequency, dt):
        """获取当前快照"""
        pass

    def get_bar(self, instrument, dt, frequency):
        """获取指定时间的bar"""
        pass

    def available_data_range(self, frequency):
        """返回数据可用的起止日期 (start_date, end_date)"""
        pass

    def is_suspended(self, order_book_id, dates):
        """查询停牌状态"""
        pass

    def is_st_stock(self, order_book_id, dates):
        """查询ST状态"""
        pass
```

### 通过 Mod 注入自定义数据源

```python
class MyDataMod(AbstractMod):
    def start_up(self, env, mod_config):
        # 替换默认数据源
        env.set_data_source(MyDataSource())

    def tear_down(self, success, exception=None):
        pass
```

## 扩展事件源

事件源控制回测的推进节奏。实现 `AbstractEventSource`：

```python
from rqalpha.interface import AbstractEventSource

class MyEventSource(AbstractEventSource):
    def events(self, start_date, end_date, frequency):
        """
        生成器，按时间顺序产生事件
        yield (event_type, calendar_dt, trading_dt)
        """
        for dt in trading_dates:
            yield EVENT.BEFORE_TRADING, dt, dt
            yield EVENT.BAR, dt, dt
            yield EVENT.AFTER_TRADING, dt, dt
```

## 配置文件

RQAlpha 支持 YAML 配置文件：

```yaml
# config.yml
base:
  start_date: '2020-01-01'
  end_date: '2023-12-31'
  accounts:
    stock: 100000
  benchmark: '000300.XSHG'
  frequency: '1d'

mod:
  sys_analyser:
    enabled: true
    plot: true
    output_file: result.pkl
  sys_simulation:
    matching_type: current_bar  # 或 next_bar
    slippage: 0.01
  sys_transaction_cost:
    commission_multiplier: 1
  sys_risk:
    validate_position: true
  my_custom_mod:
    enabled: true
    option1: value1
```

使用配置文件运行：
```bash
rqalpha run --config config.yml -f strategy.py
```
