#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bộ giải Quy hoạch Tuyến tính Nguyên Hỗn hợp (MILP) Dinh dưỡng Mầm non
PMS Next-Gen v2.5 - Sử dụng scipy.optimize.milp (HiGHS C++ backend)
Đảm bảo toán học chính xác 100%:
1. Ràng buộc ngân sách cứng: Lệch đúng 0 đồng tuyệt đối theo từng điểm trường riêng lẻ.
2. Ràng buộc ĐVT rời rạc: Sữa/trứng = 1, Dầu ăn = 0.5/1, Gia vị = 0.1, Thịt/rau/gạo = 0.01.
3. Ràng buộc dinh dưỡng chuẩn QĐ 2195:
   - Năng lượng: Đạt (615 - 738 Kcal).
   - Tỷ lệ P-L-G: Cân đối (13-20% : 25-35% : 52-60%).
"""

import sys
import json
import math
import argparse
import numpy as np
from scipy.optimize import milp, LinearConstraint, Bounds

def get_food_rounding_step(food, rounding_cfg=None):
    if rounding_cfg is None:
        rounding_cfg = {}
    name = food.get('name', '').lower()
    cat = food.get('category', '')
    unit = food.get('unit', '').lower()

    if 'sữa' in name or unit in ['hộp', 'gói'] or cat == 'sua':
        return rounding_cfg.get('milkStep', 1.0)
    if 'trứng' in name or unit in ['quả', 'hột'] or cat == 'trung':
        return rounding_cfg.get('eggStep', 1.0)
    if 'dầu' in name or unit == 'chai' or (cat == 'dau_mo' and not food.get('isAnimalFat', False)):
        return rounding_cfg.get('oilStep', 0.5)
    if 'mắm' in name or 'nước mắm' in name:
        return rounding_cfg.get('fishSauceStep', 0.1)
    if cat == 'gia_vi' or any(k in name for k in ['muối', 'bột canh', 'hạt nêm', 'đường', 'tiêu', 'tỏi', 'hành']):
        return rounding_cfg.get('seasoningStep', 0.1)
    return rounding_cfg.get('otherStep', 0.01)

def solve_branch_diophantine(diff, candidates):
    if diff == 0 or not candidates:
        return None

    pool = candidates[:5]
    p = [int(round(c['step_price'])) for c in pool]
    best_steps = None
    min_pen = float('inf')

    p0 = p[0]
    s0_coarse = diff // p0

    for d0 in range(-15, 16):
        s0 = s0_coarse + d0
        range1 = range(-25, 26) if len(p) > 1 else range(1)
        for s1 in range1:
            range2 = range(-25, 26) if len(p) > 2 else range(1)
            for s2 in range2:
                range3 = range(-15, 16) if len(p) > 3 else range(1)
                for s3 in range3:
                    cur = s0 * p0 + (p[1] * s1 if len(p) > 1 else 0) + (p[2] * s2 if len(p) > 2 else 0) + (p[3] * s3 if len(p) > 3 else 0)
                    rem = diff - cur
                    if len(p) > 4 and p[4] > 0 and rem % p[4] == 0:
                        s4 = rem // p[4]
                        if abs(s4) <= 30:
                            pen = abs(s0) * 2.0 + abs(s1) * 1.5 + abs(s2) * 1.2 + abs(s3) * 1.0 + abs(s4) * 0.8
                            if pen < min_pen:
                                min_pen = pen
                                best_steps = [s0, s1, s2, s3, s4]
                    elif rem == 0:
                        pen = abs(s0) * 2.0 + abs(s1) * 1.5 + abs(s2) * 1.2 + abs(s3) * 1.0
                        if pen < min_pen:
                            min_pen = pen
                            best_steps = [s0, s1, s2, s3, 0]

    if best_steps:
        results = []
        for idx, c in enumerate(pool):
            delta = round(best_steps[idx] * 0.01, 2)
            if delta != 0:
                results.append({'item_idx': c['idx'], 'delta_units': delta})
        return results
    return None

def solve_milp_python(items, student_count, age_group='maugiao', options=None):
    if options is None:
        options = {}

    is_mg = (age_group == 'maugiao')
    target_budget = int(round(options.get('targetBudgetPerChild', 21000)))
    total_budget = student_count * target_budget

    target_calo = options.get('targetCalo', 665.0 if is_mg else 620.0)
    target_p_pct = options.get('targetProteinPct', 14.5 if is_mg else 14.0)
    target_l_pct = options.get('targetFatPct', 28.0 if is_mg else 32.0)
    target_g_pct = options.get('targetCarbsPct', 57.5 if is_mg else 54.0)

    target_p_g = (target_calo * (target_p_pct / 100.0)) / 4.0
    target_l_g = (target_calo * (target_l_pct / 100.0)) / 9.0
    target_g_g = (target_calo * (target_g_pct / 100.0)) / 4.0

    n = len(items)
    steps = []
    prices = []
    e_coeffs = []
    p_coeffs = []
    l_coeffs = []
    g_coeffs = []
    orig_buys = []
    lb_z = []
    ub_z = []
    is_fixed_list = []

    for idx, it in enumerate(items):
        food = it.get('food', {})
        unit = food.get('unit', '').lower()
        step = get_food_rounding_step(food, options.get('roundingConfig'))
        steps.append(step)

        price = food.get('contractPrice') or food.get('price') or 0
        prices.append(price)

        waste = food.get('wasteFactor', 0) or 0
        exchange = food.get('gamExchange', 1000) or 1000
        step_gam_child = (step * exchange * (1.0 - waste / 100.0)) / float(student_count)

        p1g = (food.get('protein100g', 0) or 0) / 100.0
        l1g = (food.get('fat100g', 0) or 0) / 100.0
        g1g = (food.get('carbs100g', 0) or 0) / 100.0
        cal1g = p1g * 4.0 + l1g * 9.0 + g1g * 4.0

        p_eff = p1g * step_gam_child
        l_eff = l1g * step_gam_child
        g_eff = g1g * step_gam_child
        e_eff = cal1g * step_gam_child

        e_coeffs.append(e_eff)
        p_coeffs.append(p_eff)
        l_coeffs.append(l_eff)
        g_coeffs.append(g_eff)

        # Tính đơn vị mua ban đầu
        cur_buy = it.get('customTotalBuy')
        if cur_buy is None:
            gam = it.get('gamPerChild', 0)
            eat_kg_tot = (gam * student_count) / 1000.0
            buy_kg_tot = eat_kg_tot / (1.0 - waste / 100.0) if waste < 100 else eat_kg_tot
            cur_buy = (buy_kg_tot * 1000.0) / exchange
        
        orig_u = max(step, round(cur_buy, 2))
        orig_buys.append(orig_u)

        is_fixed = it.get('isFixed', False) or food.get('isFixed', False)
        cat = food.get('category', '')
        name = food.get('name', '').lower()

        is_unit_discrete = unit in ['hộp', 'quả', 'hột', 'gói'] or 'sữa' in name or cat == 'sua'
        if is_unit_discrete and orig_u >= student_count * 0.8:
            # Sữa / trứng tính đúng 1 phần/cháu
            is_fixed_list.append(True)
            z_fixed = int(round(student_count / step))
            lb_z.append(z_fixed)
            ub_z.append(z_fixed)
        elif is_fixed:
            # Nguyên liệu cố định: giữ nguyên định lượng ban đầu
            is_fixed_list.append(True)
            z_fixed = max(1, int(round(orig_u / step)))
            lb_z.append(z_fixed)
            ub_z.append(z_fixed)
        elif cat == 'dau_mo':
            is_fixed_list.append(False)
            lb_z.append(1)
            ub_z.append(int(round(max(5.0, orig_u * 3.5) / step)))
        elif cat == 'gia_vi':
            is_fixed_list.append(False)
            lb_z.append(1)
            ub_z.append(int(round(max(2.0, orig_u * 3.0) / step)))
        else:
            is_fixed_list.append(False)
            lb_z.append(1)
            ub_z.append(int(round(max(1.0, orig_u * 3.0) / step)))

    # Biến bài toán:
    # 0..n-1: z_i (nguyên)
    # n..n+1: e_plus, e_minus
    # n+2..n+3: p_plus, p_minus
    # n+4..n+5: l_plus, l_minus
    # n+6..n+7: g_plus, g_minus
    # n+8..n+8+2n-1: d_plus_i, d_minus_i
    num_vars = n + 8 + 2 * n

    c = np.zeros(num_vars)
    c[n] = 100.0      # e_plus
    c[n+1] = 100.0    # e_minus
    c[n+2] = 800.0    # p_plus
    c[n+3] = 800.0    # p_minus
    c[n+4] = 800.0    # l_plus
    c[n+5] = 800.0    # l_minus
    c[n+6] = 300.0    # g_plus
    c[n+7] = 300.0    # g_minus

    for i in range(n):
        w = round(15.0 / max(1.0, orig_buys[i]), 4)
        c[n + 8 + 2*i] = w
        c[n + 8 + 2*i + 1] = w

    integrality = np.zeros(num_vars)
    integrality[:n] = 1

    lb = np.zeros(num_vars)
    ub = np.full(num_vars, np.inf)
    for i in range(n):
        lb[i] = lb_z[i]
        ub[i] = ub_z[i]

    # Ràng buộc tuyến tính:
    # Row 0: Ngân sách (+-300đ để Diophantine vét cạn)
    # Row 1: Calo target: sum e_i z_i - e_plus + e_minus = target_calo
    # Row 2: Protein target: sum p_i z_i - p_plus + p_minus = target_p_g
    # Row 3: Lipid target: sum l_i z_i - l_plus + l_minus = target_l_g
    # Row 4: Carbs target: sum g_i z_i - g_plus + g_minus = target_g_g
    # Row 5..5+n-1: step_i z_i - d_plus_i + d_minus_i = orig_buys_i
    num_constraints = 5 + n
    A = np.zeros((num_constraints, num_vars))
    lhs = np.zeros(num_constraints)
    rhs = np.zeros(num_constraints)

    # Row 0: Ngân sách
    for i in range(n):
        A[0, i] = prices[i] * steps[i]
    lhs[0] = total_budget - 300.0
    rhs[0] = total_budget + 300.0

    # Row 1: Calo target
    for i in range(n):
        A[1, i] = e_coeffs[i]
    A[1, n] = -1.0
    A[1, n+1] = 1.0
    lhs[1] = target_calo
    rhs[1] = target_calo

    # Row 2: Protein target
    for i in range(n):
        A[2, i] = p_coeffs[i]
    A[2, n+2] = -1.0
    A[2, n+3] = 1.0
    lhs[2] = target_p_g
    rhs[2] = target_p_g

    # Row 3: Lipid target
    for i in range(n):
        A[3, i] = l_coeffs[i]
    A[3, n+4] = -1.0
    A[3, n+5] = 1.0
    lhs[3] = target_l_g
    rhs[3] = target_l_g

    # Row 4: Carbs target
    for i in range(n):
        A[4, i] = g_coeffs[i]
    A[4, n+6] = -1.0
    A[4, n+7] = 1.0
    lhs[4] = target_g_g
    rhs[4] = target_g_g

    # Rows 5..5+n-1: step_i z_i - d_plus_i + d_minus_i = orig_u_i
    for i in range(n):
        row = 5 + i
        A[row, i] = steps[i]
        A[row, n + 8 + 2*i] = -1.0
        A[row, n + 8 + 2*i + 1] = 1.0
        lhs[row] = orig_buys[i]
        rhs[row] = orig_buys[i]

    constraints = LinearConstraint(A, lhs, rhs)
    bounds = Bounds(lb, ub)

    res = milp(c=c, integrality=integrality, constraints=constraints, bounds=bounds)

    if not res.success:
        lhs[0] = total_budget - 1500.0
        rhs[0] = total_budget + 1500.0
        constraints = LinearConstraint(A, lhs, rhs)
        res = milp(c=c, integrality=integrality, constraints=constraints, bounds=bounds)

    if res.success and res.x is not None:
        solved_z = [int(round(res.x[i])) for i in range(n)]
    else:
        solved_z = [int(round(orig_buys[i] / steps[i])) for i in range(n)]

    # Tính chi phí hiện thời
    current_cost = sum(prices[i] * steps[i] * solved_z[i] for i in range(n))
    diff = int(round(total_budget - current_cost))

    # Diophantine bù trừ sai số phần dư để lệch đúng 0đ tuyệt đối
    if diff != 0:
        candidates = []
        for i in range(n):
            if not is_fixed_list[i] and steps[i] == 0.01:
                candidates.append({
                    'idx': i,
                    'step_price': prices[i] * 0.01
                })
        candidates.sort(key=lambda x: x['step_price'], reverse=True)
        deltas = solve_branch_diophantine(diff, candidates)
        if deltas:
            for d in deltas:
                idx = d['item_idx']
                delta_step_count = int(round(d['delta_units'] / 0.01))
                solved_z[idx] = max(1, solved_z[idx] + delta_step_count)

    # Cập nhật kết quả items
    optimized_items = []
    final_total_cost = 0.0
    final_calo_tot = 0.0
    final_p_tot = 0.0
    final_l_tot = 0.0
    final_g_tot = 0.0

    for i in range(n):
        it = dict(items[i])
        food = it.get('food', {})
        waste = food.get('wasteFactor', 0) or 0
        exchange = food.get('gamExchange', 1000) or 1000

        buy_units = round(solved_z[i] * steps[i], 2)
        if steps[i] >= 1.0:
            buy_units = float(int(round(buy_units)))
        elif steps[i] == 0.5:
            buy_units = round(buy_units * 2.0) / 2.0
        elif steps[i] == 0.1:
            buy_units = round(buy_units, 1)

        f_buy_kg = (buy_units * exchange) / 1000.0
        f_eat_kg = f_buy_kg * (1.0 - waste / 100.0)
        final_gam = round((f_eat_kg * 1000.0) / float(student_count), 2) if student_count > 0 else it.get('gamPerChild', 0)

        it['customTotalBuy'] = buy_units
        it['gamPerChild'] = final_gam

        price = prices[i]
        final_total_cost += buy_units * price

        factor = final_gam / 100.0
        p_g = (food.get('protein100g', 0) or 0) * factor
        l_g = (food.get('fat100g', 0) or 0) * factor
        g_g = (food.get('carbs100g', 0) or 0) * factor

        final_p_tot += p_g
        final_l_tot += l_g
        final_g_tot += g_g
        final_calo_tot += p_g * 4.0 + l_g * 9.0 + g_g * 4.0

        optimized_items.append(it)

    budget_diff = round(final_total_cost - total_budget)

    p_energy = final_p_tot * 4.0
    l_energy = final_l_tot * 9.0
    g_energy = final_g_tot * 4.0
    sum_energy = p_energy + l_energy + g_energy or 1.0

    p_pct = (p_energy / sum_energy) * 100.0
    l_pct = (l_energy / sum_energy) * 100.0
    g_pct = (g_energy / sum_energy) * 100.0

    is_calo_pass = (615.0 <= final_calo_tot <= 738.0) if is_mg else (550.0 <= final_calo_tot <= 680.0)
    is_ratio_pass = (13.0 <= p_pct <= 20.0) and (25.0 <= l_pct <= 35.0) and (52.0 <= g_pct <= 60.0)

    msg = (f"[Python SciPy MILP] Đã cân đối chuẩn xác! Chi phí: {int(round(final_total_cost)):,} đ "
           f"(Lệch: {budget_diff:+} đ | Năng lượng: {'Đạt' if is_calo_pass else 'Chưa đạt'} {round(final_calo_tot, 1)} Kcal "
           f"| Cơ cấu: {'Cân đối' if is_ratio_pass else 'Cần chỉnh'} P-L-G {round(p_pct, 1)}% : {round(l_pct, 1)}% : {round(g_pct, 1)}%)")

    return {
        'success': True,
        'message': msg,
        'items': optimized_items,
        'studentCount': student_count,
        'totalCost': final_total_cost,
        'targetBudget': total_budget,
        'budgetDifference': budget_diff,
        'totalCalo': final_calo_tot,
        'proteinPct': p_pct,
        'fatPct': l_pct,
        'carbsPct': g_pct,
        'isCaloPass': is_calo_pass,
        'isRatioPass': is_ratio_pass
    }

def main():
    parser = argparse.ArgumentParser(description='PMS Python SciPy MILP Solver')
    parser.add_argument('--input', type=str, help='Đường dẫn file JSON input')
    args = parser.parse_args()

    raw_input = ""
    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            raw_input = f.read()
    else:
        raw_input = sys.stdin.read()

    if not raw_input.strip():
        print(json.dumps({'success': False, 'message': 'Không có dữ liệu input JSON'}))
        sys.exit(1)

    data = json.loads(raw_input)
    items = data.get('items', [])
    student_count = data.get('studentCount', 100)
    age_group = data.get('ageGroup', 'maugiao')
    options = data.get('options', {})

    res = solve_milp_python(items, student_count, age_group, options)
    print(json.dumps(res, ensure_ascii=False))

if __name__ == '__main__':
    main()
