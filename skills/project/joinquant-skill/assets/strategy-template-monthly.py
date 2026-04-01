# 聚宽月度调仓策略模板
# 使用说明：在聚宽平台"策略回测"中新建策略，将此模板粘贴后根据需要修改

from jqdata import *
from jqfactor import *


# ============================================================
# 策略初始化
# ============================================================
def initialize(context):
    """策略初始化（仅执行一次）"""
    # 基准
    set_benchmark('000300.XSHG')  # 沪深300

    # 使用真实价格
    set_option('use_real_price', True)

    # 滑点
    set_slippage(FixedSlippage(0.02))  # 每股0.02元

    # 交易成本（实证验证参数）
    set_order_cost(OrderCost(
        open_tax=0,               # 买入无印花税
        close_tax=0.0005,         # 卖出印花税 0.05%（2023-08-28后）
        open_commission=0.0003,   # 买入佣金 0.03%
        close_commission=0.0003,  # 卖出佣金 0.03%
        close_today_commission=0,
        min_commission=5,         # 最低佣金 5 元
    ), type='stock')

    # 全局参数
    context.stock_num = 20        # 持仓数量
    context.index = '000300.XSHG' # 选股池对应指数

    # 每月最后一个交易日调仓
    run_monthly(rebalance, monthday=-1, time='open')


# ============================================================
# 选股逻辑（请根据策略修改此函数）
# ============================================================
def select_stocks(context):
    """选股：返回目标股票列表"""
    # 获取信号日（T-1，避免未来函数）
    signal_date = get_trade_days(end_date=context.current_dt, count=2)[0]

    # 获取指数成分股
    stock_list = get_index_stocks(context.index, date=signal_date)

    # 获取财务数据
    q = query(
        valuation.code,
        valuation.market_cap,
        valuation.pb_ratio,
    ).filter(
        valuation.code.in_(stock_list),
        valuation.pb_ratio > 0,  # 过滤负PB
    ).order_by(
        valuation.market_cap.asc()  # 按市值升序（小市值优先）
    )
    df = get_fundamentals(q, date=signal_date)

    # 过滤不可交易股票
    candidates = filter_stocks(list(df['code']), context)

    # 取前N只
    return candidates[:context.stock_num]


# ============================================================
# 股票池过滤
# ============================================================
def filter_stocks(stock_list, context):
    """过滤停牌、ST、涨停、次新股"""
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
        if (context.current_dt.date() - info.start_date).days < 60:
            continue
        filtered.append(stock)
    return filtered


# ============================================================
# 调仓执行
# ============================================================
def rebalance(context):
    """月度调仓：先卖后买"""
    # 获取目标持仓
    target_stocks = select_stocks(context)

    if not target_stocks:
        log.warn('无可选股票，跳过本次调仓')
        return

    # 计算每只股票目标市值
    target_value = context.portfolio.total_value / len(target_stocks)

    # Step 1: 卖出不在目标中的持仓
    for stock in list(context.portfolio.positions):
        if stock not in target_stocks:
            order_target_value(stock, 0)

    # Step 2: 买入/调整目标持仓
    for stock in target_stocks:
        order_target_value(stock, target_value)

    log.info(f'调仓完成: 目标{len(target_stocks)}只, '
             f'每只{target_value:.0f}元')


# ============================================================
# 收盘后记录
# ============================================================
def after_trading_end(context):
    """记录持仓和现金比例"""
    positions_count = len(context.portfolio.positions)
    cash_ratio = context.portfolio.cash / context.portfolio.total_value
    record(
        positions=positions_count,
        cash_ratio=cash_ratio,
    )
