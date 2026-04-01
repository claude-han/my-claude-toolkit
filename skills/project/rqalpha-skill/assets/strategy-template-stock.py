# -*- coding: utf-8 -*-
"""
RQAlpha 股票日频策略模板

运行命令:
    rqalpha run -f strategy.py -s 2020-01-01 -e 2023-12-31 \
        --account stock 100000 --benchmark 000300.XSHG --plot --progress

Python API 运行:
    from rqalpha.api import run_file
    run_file('strategy.py', config={
        'base': {
            'start_date': '2020-01-01',
            'end_date': '2023-12-31',
            'accounts': {'stock': 100000},
            'benchmark': '000300.XSHG',
        },
        'mod': {
            'sys_analyser': {'enabled': True, 'plot': True},
        }
    })
"""
import numpy as np


def init(context):
    """策略初始化（必须定义）"""
    # --- 标的设置 ---
    context.stock_pool = ['000001.XSHE', '600000.XSHG', '601318.XSHG']
    context.hold_num = 3          # 最大持仓数量

    # --- 策略参数 ---
    context.lookback = 20         # 回溯天数
    context.rebalance_days = 0    # 调仓计数器
    context.rebalance_period = 20 # 调仓周期（交易日）

    logger.info("策略初始化完成: {}".format(context.run_info))


def before_trading(context):
    """盘前处理（不可下单）"""
    pass


def handle_bar(context, bar_dict):
    """每日行情更新时调用（核心逻辑）"""
    context.rebalance_days += 1

    # 非调仓日跳过
    if context.rebalance_days % context.rebalance_period != 1:
        return

    # --- 选股逻辑 ---
    scores = {}
    for stock in context.stock_pool:
        # 过滤停牌和ST
        if is_suspended(stock) or is_st_stock(stock):
            continue

        # 获取历史数据
        prices = history_bars(stock, context.lookback + 1, '1d', 'close')
        if len(prices) < context.lookback + 1:
            continue

        # 计算因子（示例：动量因子）
        momentum = prices[-1] / prices[0] - 1
        scores[stock] = momentum

    # --- 排序选股 ---
    sorted_stocks = sorted(scores, key=scores.get, reverse=True)[:context.hold_num]

    if not sorted_stocks:
        return

    # --- 调仓 ---
    # 方式1: 等权调仓（推荐）
    target = {stock: 1.0 / len(sorted_stocks) for stock in sorted_stocks}
    order_target_portfolio(target)

    # 方式2: 手动先卖后买（备选）
    # current_holdings = set(context.portfolio.positions.keys())
    # target_holdings = set(sorted_stocks)
    #
    # # 先卖
    # for stock in current_holdings - target_holdings:
    #     order_target_value(stock, 0)
    #
    # # 后买
    # target_value = context.portfolio.total_value / len(sorted_stocks)
    # for stock in sorted_stocks:
    #     order_target_value(stock, target_value)

    logger.info("调仓完成，目标持仓: {}".format(sorted_stocks))


def after_trading(context):
    """盘后处理（不可下单）"""
    # 记录当日持仓信息
    for order_book_id, pos in context.portfolio.positions.items():
        if pos.quantity > 0:
            logger.info(f"持仓: {order_book_id} 数量={pos.quantity} "
                       f"市值={pos.market_value:.2f}")
