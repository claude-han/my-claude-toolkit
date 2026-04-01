# 聚宽因子研究模板（研究环境 Notebook 使用）
# 使用说明：在聚宽"研究环境"中新建 notebook，将此模板粘贴后逐 cell 运行

# ============================================================
# Cell 1: 导入和参数设置
# ============================================================
from jqdata import *
from jqfactor import *
from jqfactor_analyzer import analyze_factor
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# 研究参数
INDEX = '000300.XSHG'       # 选股池对应指数
START_DATE = '2020-01-01'   # 回测起始日
END_DATE = '2024-01-01'     # 回测结束日
QUANTILES = 5               # 分组数量
PERIODS = (1, 5, 10, 20)    # 持有期（交易日）

# ============================================================
# Cell 2: 获取股票池
# ============================================================
# 获取交易日列表
trade_days = get_trade_days(start_date=START_DATE, end_date=END_DATE)
print(f'研究区间: {trade_days[0]} ~ {trade_days[-1]}, 共 {len(trade_days)} 个交易日')

# 获取指数成分股（使用最后一天的成分）
stock_list = get_index_stocks(INDEX, date=END_DATE)
print(f'股票池: {INDEX} 成分股 {len(stock_list)} 只')

# ============================================================
# Cell 3: 计算因子值
# ============================================================
# 方式A: 使用聚宽内置因子
factor_data = get_factor_values(
    securities=stock_list,
    factors=['turnover_ratio_20'],  # 替换为你要研究的因子
    start_date=START_DATE,
    end_date=END_DATE,
)
factor_df = factor_data['turnover_ratio_20']

# 方式B: 使用自定义因子（取消注释使用）
# class MyFactor(Factor):
#     name = 'my_factor'
#     max_window = 20
#     dependencies = ['close', 'volume']
#
#     def calc(self, data):
#         close = data['close']
#         volume = data['volume']
#         # 在此实现因子计算逻辑
#         return close.iloc[-1] / close.iloc[0] - 1
#
# results = calc_factors(
#     securities=stock_list,
#     factors=[MyFactor()],
#     start_date=START_DATE,
#     end_date=END_DATE,
# )
# factor_df = results['my_factor']

print(f'因子矩阵形状: {factor_df.shape}')
print(f'因子覆盖率: {factor_df.notna().mean().mean():.2%}')
factor_df.head()

# ============================================================
# Cell 4: 因子预处理（可选）
# ============================================================
# 逐日预处理
factor_processed = pd.DataFrame(index=factor_df.index, columns=factor_df.columns)

for date in factor_df.index:
    raw = factor_df.loc[date].dropna()
    if len(raw) < 10:
        continue
    # Step 1: 去极值
    processed = winsorize(raw, n=3)
    # Step 2: 标准化
    processed = standardlize(processed)
    # Step 3: 中性化（可选，取消注释使用）
    # processed = neutralize(processed, how=['industry', 'market_cap'],
    #                        date=date, industry='sw_l1')
    factor_processed.loc[date, processed.index] = processed

factor_processed = factor_processed.astype(float)
print('预处理完成')

# ============================================================
# Cell 5: 单因子分析
# ============================================================
far = analyze_factor(
    factor_processed,        # 使用预处理后的因子（或 factor_df 使用原始因子）
    industry='jq_l1',        # 行业分类
    quantiles=QUANTILES,     # 分组数
    periods=PERIODS,         # 持有期
    weight_method='avg',     # 等权
    max_loss_ratio=0.25,     # 最大损失比例
)
print('分析完成')

# ============================================================
# Cell 6: 查看完整分析报告
# ============================================================
far.create_full_tear_sheet()

# ============================================================
# Cell 7: 查看关键指标
# ============================================================
# IC 分析
ic = far.calc_mean_information_coefficient()
print('=== IC 分析 ===')
print(ic)
print()

# 分位组平均收益
mean_ret = far.calc_mean_return_by_quantile()
print('=== 分位组平均收益 ===')
print(mean_ret)
print()

# 判断因子有效性
print('=== 因子有效性判断 ===')
for period in PERIODS:
    ic_val = ic.loc[period, 'IC Mean'] if 'IC Mean' in ic.columns else None
    if ic_val:
        print(f'  {period}日持有期 IC={ic_val:.4f}', end='')
        if abs(ic_val) > 0.03:
            print(' ✓ 有效')
        else:
            print(' ✗ 偏弱')
