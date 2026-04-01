# 财务数据表字段完整参考

使用 `get_fundamentals(query(...), date=...)` 查询，通过 SQLAlchemy `query()` 构建查询对象。

**重要规则**：
- `date` 参数：返回截止该日已公布的数据（**推荐，无未来函数**）
- `statDate` 参数：返回指定财报期数据（如 `'2024q1'`），**有未来函数风险**
- 回测中 `date` 默认值 = `context.current_dt` 前一天
- 每次最多返回 5000 行
- `valuation` 表每天更新，其他财务表按季度更新

## valuation — 市值数据（每日更新）

| 字段 | 含义 | 说明/公式 |
|------|------|----------|
| `code` | 股票代码 | 带 .XSHE/.XSHG 后缀 |
| `day` | 日期 | — |
| `capitalization` | 总股本(万股) | A+B+H股总股本 |
| `circulating_cap` | 流通股本(万股) | A股流通股本 |
| `market_cap` | 总市值(亿元) | A股收盘价 × 总股本 |
| `circulating_market_cap` | 流通市值(亿元) | A股收盘价 × A股流通股数 |
| `turnover_ratio` | 换手率(%) | 成交量(手)×100 / 流通股本(股) ×100% |
| `pe_ratio` | 市盈率(PE, TTM) | 总市值 / 归母净利润TTM |
| `pe_ratio_lyr` | 市盈率(PE, LYR) | 总市值 / 最近年报归母净利润 |
| `pb_ratio` | 市净率(PB) | 总市值 / (归母权益MRQ - 其他权益工具) |
| `ps_ratio` | 市销率(PS, TTM) | 总市值 / 营业总收入TTM |
| `pcf_ratio` | 市现率(PCF, TTM) | 总市值 / 现金净增加额TTM |

**注意**：PE/PB等依赖收盘价的指标是**盘后更新**的，不要用当天日期获取。

```python
# 示例：查询市值和估值
q = query(
    valuation.code,
    valuation.market_cap,
    valuation.pe_ratio,
    valuation.pb_ratio,
    valuation.turnover_ratio,
).filter(
    valuation.market_cap > 100,   # 总市值 > 100亿
    valuation.pe_ratio < 20,      # PE < 20
    valuation.pe_ratio > 0,       # 排除亏损股
).order_by(
    valuation.market_cap.asc()
).limit(100)
df = get_fundamentals(q, date='2024-03-15')
```

## income — 利润数据（按季更新）

| 字段 | 含义 |
|------|------|
| `code` | 股票代码 |
| `pubDate` | 财报发布日期 |
| `statDate` | 财报统计季度最后一天 |
| `total_operating_revenue` | 营业总收入(元) |
| `operating_revenue` | 营业收入(元) |
| `total_operating_cost` | 营业总成本(元) |
| `operating_cost` | 营业成本(元) |
| `operating_tax_surcharges` | 营业税金及附加(元) |
| `sale_expense` | 销售费用(元) |
| `administration_expense` | 管理费用(元) |
| `financial_expense` | 财务费用(元) |
| `asset_impairment_loss` | 资产减值损失(元) |
| `fair_value_variable_income` | 公允价值变动收益(元) |
| `investment_income` | 投资收益(元) |
| `invest_income_associates` | 对联营/合营企业投资收益(元) |
| `operating_profit` | 营业利润(元) |
| `non_operating_revenue` | 营业外收入(元) |
| `non_operating_expense` | 营业外支出(元) |
| `total_profit` | 利润总额(元) |
| `income_tax_expense` | 所得税费用(元) |
| `net_profit` | 净利润(元) |
| `np_parent_company_owners` | 归属于母公司股东的净利润(元) |
| `minority_profit` | 少数股东损益(元) |
| `basic_eps` | 基本每股收益(元) |
| `diluted_eps` | 稀释每股收益(元) |
| `other_composite_income` | 其他综合收益(元) |
| `total_composite_income` | 综合收益总额(元) |

```python
# 示例：查询利润数据
q = query(
    income.code,
    income.total_operating_revenue,
    income.net_profit,
    income.np_parent_company_owners,
).filter(
    income.code.in_(stock_list)
)
df = get_fundamentals(q, date='2024-03-15')
```

## balance — 资产负债数据（按季更新）

### 资产类（常用）

| 字段 | 含义 |
|------|------|
| `code` | 股票代码 |
| `pubDate` | 财报发布日期 |
| `statDate` | 财报统计季度最后一天 |
| `cash_equivalents` | 货币资金(元) |
| `trading_assets` | 交易性金融资产(元) |
| `bill_receivable` | 应收票据(元) |
| `account_receivable` | 应收账款(元) |
| `advance_payment` | 预付款项(元) |
| `other_receivable` | 其他应收款(元) |
| `inventories` | 存货(元) |
| `total_current_assets` | 流动资产合计(元) |
| `hold_for_sale_assets` | 可供出售金融资产(元) |
| `hold_to_maturity_investments` | 持有至到期投资(元) |
| `longterm_equity_invest` | 长期股权投资(元) |
| `investment_property` | 投资性房地产(元) |
| `fixed_assets` | 固定资产(元) |
| `constru_in_process` | 在建工程(元) |
| `intangible_assets` | 无形资产(元) |
| `good_will` | 商誉(元) |
| `deferred_tax_assets` | 递延所得税资产(元) |
| `total_non_current_assets` | 非流动资产合计(元) |
| `total_assets` | 资产总计(元) |

### 负债类（常用）

| 字段 | 含义 |
|------|------|
| `shortterm_loan` | 短期借款(元) |
| `notes_payable` | 应付票据(元) |
| `accounts_payable` | 应付账款(元) |
| `advance_peceipts` | 预收款项(元) |
| `salaries_payable` | 应付职工薪酬(元) |
| `taxs_payable` | 应交税费(元) |
| `total_current_liability` | 流动负债合计(元) |
| `longterm_loan` | 长期借款(元) |
| `bindloan_payable` | 应付债券(元) |
| `total_non_current_liability` | 非流动负债合计(元) |
| `total_liability` | 负债合计(元) |

### 所有者权益类（常用）

| 字段 | 含义 |
|------|------|
| `capital_bindloan_paid_in` | 实收资本(或股本)(元) |
| `bindloan_premium_reserve` | 资本公积(元) |
| `bindloan_special_reserve` | 专项储备(元) |
| `surplus_bindloan_reserve` | 盈余公积(元) |
| `bindloan_undistributed_profit` | 未分配利润(元) |
| `bindloan_parent_company_owners_equity` | 归属于母公司股东权益合计(元) |
| `minority_bindloan_interest` | 少数股东权益(元) |
| `total_owner_bindloan_equities` | 所有者权益合计(元) |
| `total_sheet_owner_bindloan_equities` | 负债和所有者权益总计(元) |

**注意**：balance 表是存量性质，查询年度数据时返回第四季度数据。

## cash_flow — 现金流数据（按季更新）

### 经营活动

| 字段 | 含义 |
|------|------|
| `code` | 股票代码 |
| `pubDate` | 财报发布日期 |
| `statDate` | 财报统计季度最后一天 |
| `goods_sale_and_service_render_cash` | 销售商品、提供劳务收到的现金(元) |
| `tax_levy_refund` | 收到的税费返还(元) |
| `other_cashin_related_operate` | 收到其他与经营活动有关的现金(元) |
| `subtotal_operate_cash_inflow` | 经营活动现金流入小计(元) |
| `goods_and_services_cash_paid` | 购买商品、接受劳务支付的现金(元) |
| `staff_behalf_paid` | 支付给职工以及为职工支付的现金(元) |
| `tax_payments` | 支付的各项税费(元) |
| `other_operate_cash_paid` | 支付其他与经营活动有关的现金(元) |
| `subtotal_operate_cash_outflow` | 经营活动现金流出小计(元) |
| `net_operate_cash_flow` | **经营活动产生的现金流量净额**(元) |

### 投资活动

| 字段 | 含义 |
|------|------|
| `invest_withdrawal_cash` | 收回投资收到的现金(元) |
| `invest_proceeds` | 取得投资收益收到的现金(元) |
| `fix_intan_other_asset_dispo_cash` | 处置固定/无形资产收回现金净额(元) |
| `subtotal_invest_cash_inflow` | 投资活动现金流入小计(元) |
| `fix_intan_other_asset_acqui_cash` | 购建固定/无形资产支付的现金(元) |
| `invest_cash_paid` | 投资支付的现金(元) |
| `subtotal_invest_cash_outflow` | 投资活动现金流出小计(元) |
| `net_invest_cash_flow` | **投资活动产生的现金流量净额**(元) |

### 筹资活动

| 字段 | 含义 |
|------|------|
| `cash_from_invest` | 吸收投资收到的现金(元) |
| `cash_from_borrowing` | 取得借款收到的现金(元) |
| `cash_from_bonds_issue` | 发行债券收到的现金(元) |
| `subtotal_finance_cash_inflow` | 筹资活动现金流入小计(元) |
| `borrowing_repayment` | 偿还债务支付的现金(元) |
| `dividend_interest_payment` | 分配股利/偿付利息支付的现金(元) |
| `subtotal_finance_cash_outflow` | 筹资活动现金流出小计(元) |
| `net_finance_cash_flow` | **筹资活动产生的现金流量净额**(元) |
| `cash_equivalent_increase` | 现金及现金等价物净增加额(元) |
| `cash_equivalents_at_beginning` | 期初现金及现金等价物余额(元) |
| `cash_and_equivalents_at_end` | 期末现金及现金等价物余额(元) |

## indicator — 财务指标数据（按季更新）

| 字段 | 含义 | 公式/说明 |
|------|------|----------|
| `code` | 股票代码 | — |
| `pubDate` | 财报发布日期 | — |
| `statDate` | 财报统计季度最后一天 | — |
| `eps` | 每股收益EPS(元) | 归母净利润 / 期末股本 |
| `adjusted_profit` | 扣除非经常损益后的净利润(元) | — |
| `operating_profit` | 经营活动净收益(元) | 营业总收入 - 营业总成本 |
| `value_change_profit` | 价值变动净收益(元) | 公允价值变动 + 投资收益 + 汇兑收益 |
| `roe` | 净资产收益率ROE(%) | 归母净利润×2 / (期初+期末归母净资产) |
| `inc_return` | 净资产收益率(扣非)(%) | 扣非净利润×2 / (期初+期末归母净资产) |
| `roa` | 总资产净利率ROA(%) | 净利润×2 / (期初+期末总资产) |
| `net_profit_margin` | 销售净利率(%) | 净利润 / 营业收入 |
| `gross_profit_margin` | 销售毛利率(%) | 毛利 / 营业收入 |
| `expense_to_total_revenue` | 营业总成本/营业总收入(%) | — |
| `operation_profit_to_total_revenue` | 营业利润/营业总收入(%) | — |
| `net_profit_to_total_revenue` | 净利润/营业总收入(%) | — |
| `operating_expense_to_total_revenue` | 营业费用/营业总收入(%) | — |
| `ga_expense_to_total_revenue` | 管理费用/营业总收入(%) | — |
| `financing_expense_to_total_revenue` | 财务费用/营业总收入(%) | — |
| `operating_profit_to_profit` | 经营活动净收益/利润总额(%) | — |
| `invesment_profit_to_profit` | 价值变动净收益/利润总额(%) | — |
| `adjusted_profit_to_profit` | 扣非净利润/净利润(%) | — |
| `goods_sale_and_service_to_revenue` | 销售收现/营业收入(%) | — |
| `ocf_to_revenue` | 经营现金流净额/营业收入(%) | — |
| `ocf_to_operating_profit` | 经营现金流净额/经营活动净收益(%) | — |
| `inc_total_revenue_year_on_year` | 营业总收入同比增长率(%) | — |
| `inc_total_revenue_annual` | 营业总收入环比增长率(%) | — |
| `inc_revenue_year_on_year` | 营业收入同比增长率(%) | — |
| `inc_revenue_annual` | 营业收入环比增长率(%) | — |
| `inc_operation_profit_year_on_year` | 营业利润同比增长率(%) | — |
| `inc_operation_profit_annual` | 营业利润环比增长率(%) | — |
| `inc_net_profit_year_on_year` | 净利润同比增长率(%) | — |
| `inc_net_profit_annual` | 净利润环比增长率(%) | — |
| `inc_net_profit_to_shareholders_year_on_year` | 归母净利润同比增长率(%) | — |
| `inc_net_profit_to_shareholders_annual` | 归母净利润环比增长率(%) | — |

```python
# 示例：查询财务指标
q = query(
    indicator.code,
    indicator.roe,
    indicator.roa,
    indicator.gross_profit_margin,
    indicator.inc_revenue_year_on_year,
    indicator.inc_net_profit_year_on_year,
).filter(
    indicator.code.in_(stock_list)
)
df = get_fundamentals(q, date='2024-03-15')
```

## 多表联合查询

```python
# valuation + income + indicator 联合查询
q = query(
    valuation.code,
    valuation.market_cap,
    valuation.pe_ratio,
    valuation.pb_ratio,
    income.total_operating_revenue,
    income.net_profit,
    indicator.roe,
    indicator.inc_revenue_year_on_year,
).filter(
    valuation.code.in_(stock_list),
    valuation.pe_ratio > 0,
    indicator.roe > 10,
).order_by(
    valuation.market_cap.asc()
).limit(200)
df = get_fundamentals(q, date='2024-03-15')
```

## query 对象高级用法

```python
from sqlalchemy.sql.expression import or_

# OR 条件
q = query(valuation.code).filter(
    or_(
        valuation.market_cap > 1000,  # 总市值>1000亿 或
        valuation.pe_ratio < 10       # PE<10
    )
)

# IN 条件（必须用 .in_()，不能用 python 的 in）
q = query(valuation).filter(
    valuation.code.in_(['000001.XSHE', '600000.XSHG'])
)

# 排序 + 限制
q = query(valuation).order_by(
    valuation.market_cap.desc()    # 降序
).limit(100)                       # 最多100条
```

## finance.run_query — 扩展财务数据查询

聚宽通过 `finance` 模块提供大量扩展数据表，统一使用 `finance.run_query()` 查询。

```python
from jqdata import finance

df = finance.run_query(
    query(finance.表名).filter(
        finance.表名.字段 == 条件
    ).limit(n)
)
```

**限制**：每次最多返回 **4000 行**，不能连表查询。

### 常用 finance 数据表

| 表名 | 说明 | 场景 |
|------|------|------|
| `finance.STK_INCOME_STATEMENT` | 合并利润表 | 报告期详细利润数据 |
| `finance.STK_BALANCE_SHEET` | 合并资产负债表 | 报告期详细资产负债 |
| `finance.STK_CASHFLOW_STATEMENT` | 合并现金流量表 | 报告期详细现金流 |
| `finance.STK_XR_XD` | 除权除息/分红送股 | 分红策略、股息率计算 |
| `finance.STK_EXCHANGE_TRADE_INFO` | 沪深市场每日成交概况 | 市场情绪、换手率分析 |
| `finance.STK_SHAREHOLDER_TOP10` | 十大股东 | 股东结构分析 |
| `finance.STK_SHAREHOLDER_FLOATING_TOP10` | 十大流通股东 | 机构持仓分析 |
| `finance.STK_SHAREHOLDERS_SHARE_CHANGE` | 大股东增减持 | 事件驱动策略 |
| `finance.STK_HOLDER_NUM` | 股东户数 | 筹码集中度 |
| `finance.STK_COMPANY_INFO` | 上市公司基本信息 | 主营业务、注册资本等 |
| `finance.STK_AUDIT_OPINION` | 审计意见 | 风控过滤 |
| `finance.STK_FIN_FORCAST` | 业绩预告 | 事件驱动策略 |
| `finance.STK_MT_TOTAL` | 融资融券汇总 | 市场杠杆分析 |

```python
# 示例：查询分红数据
df = finance.run_query(
    query(finance.STK_XR_XD).filter(
        finance.STK_XR_XD.code == '600519.XSHG',
        finance.STK_XR_XD.report_date >= '2020-01-01',
    ).order_by(
        finance.STK_XR_XD.report_date
    ).limit(20)
)

# 示例：查询十大股东
df = finance.run_query(
    query(finance.STK_SHAREHOLDER_TOP10).filter(
        finance.STK_SHAREHOLDER_TOP10.code == '000001.XSHE',
        finance.STK_SHAREHOLDER_TOP10.pub_date >= '2024-01-01',
    ).limit(20)
)
```
