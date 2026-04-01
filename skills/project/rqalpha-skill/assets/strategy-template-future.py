# -*- coding: utf-8 -*-
"""
RQAlpha 期货策略模板（双均线）

运行命令:
    rqalpha run -f futures_strategy.py -s 2023-01-01 -e 2023-12-31 \
        --account future 500000 --plot --progress

注意: 期货需要分钟数据或自定义数据源才能做分钟级回测
"""
import talib


def init(context):
    """策略初始化"""
    # --- 合约设置 ---
    context.s1 = 'RB2401'  # 螺纹钢主力合约

    # --- 策略参数 ---
    context.SHORT_PERIOD = 10   # 短均线周期
    context.LONG_PERIOD = 30    # 长均线周期
    context.trade_lots = 1      # 每次交易手数

    logger.info("期货策略初始化: {}".format(context.s1))


def handle_bar(context, bar_dict):
    """核心逻辑"""
    # 获取历史数据
    prices = history_bars(context.s1, context.LONG_PERIOD + 1, '1d', 'close')
    if len(prices) < context.LONG_PERIOD + 1:
        return

    # 计算均线
    short_avg = talib.SMA(prices, context.SHORT_PERIOD)
    long_avg = talib.SMA(prices, context.LONG_PERIOD)

    # 获取当前持仓
    long_pos = get_position(context.s1, POSITION_DIRECTION.LONG)
    short_pos = get_position(context.s1, POSITION_DIRECTION.SHORT)

    # --- 金叉：平空开多 ---
    if short_avg[-1] > long_avg[-1] and short_avg[-2] <= long_avg[-2]:
        # 先平空仓
        if short_pos.quantity > 0:
            buy_close(context.s1, short_pos.quantity)
            logger.info("平空仓: {} 手".format(short_pos.quantity))
        # 再开多仓
        buy_open(context.s1, context.trade_lots)
        logger.info("开多仓: {} 手".format(context.trade_lots))

    # --- 死叉：平多开空 ---
    if short_avg[-1] < long_avg[-1] and short_avg[-2] >= long_avg[-2]:
        # 先平多仓
        if long_pos.quantity > 0:
            sell_close(context.s1, long_pos.quantity)
            logger.info("平多仓: {} 手".format(long_pos.quantity))
        # 再开空仓
        sell_open(context.s1, context.trade_lots)
        logger.info("开空仓: {} 手".format(context.trade_lots))

    # 绘制指标
    plot("short_ma", short_avg[-1])
    plot("long_ma", long_avg[-1])
    plot("price", bar_dict[context.s1].close)
