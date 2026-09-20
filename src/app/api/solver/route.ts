import { NextRequest, NextResponse } from 'next/server';
import { solveHighsNutritionMenu } from '@/engine/highs-solver';
import { AgeGroup, MenuItem } from '@/types/nutrition';
import { SolverOptions, SolverResult } from '@/engine/milp-solver';
import { spawn } from 'child_process';
import path from 'path';

function runPythonMilpSolver(
  items: MenuItem[],
  studentCount: number,
  ageGroup: AgeGroup,
  options: SolverOptions
): Promise<SolverResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'python', 'milp_solver.py');
    const proc = spawn('python3', [scriptPath]);
    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Python solver timeout sau 10s'));
    }, 10000);

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
      try {
        const json = JSON.parse(stdout);
        if (json.success) {
          resolve(json);
        } else {
          reject(new Error(json.message || 'Lỗi từ Python solver'));
        }
      } catch (err) {
        reject(new Error(`JSON parse error from Python stdout: ${err}`));
      }
    });

    proc.stdin.write(
      JSON.stringify({
        items,
        studentCount,
        ageGroup,
        options,
      })
    );
    proc.stdin.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, studentCount, ageGroup, options } = body as {
      items: MenuItem[];
      studentCount: number;
      ageGroup?: AgeGroup;
      options?: SolverOptions;
    };

    if (!items || !studentCount) {
      return NextResponse.json(
        { success: false, message: 'Thiếu dữ liệu món ăn hoặc số lượng học sinh' },
        { status: 400 }
      );
    }

    let result: SolverResult;
    try {
      // 1. Ưu tiên giải bằng module Python SciPy MILP
      result = await runPythonMilpSolver(
        items,
        studentCount,
        ageGroup || 'maugiao',
        options || {}
      );
    } catch (pyErr) {
      console.warn('[Solver Bridge] Python solver failed/unavailable, falling back to HiGHS WASM:', pyErr);
      // 2. Fallback sang bộ giải HiGHS WASM C++
      result = await solveHighsNutritionMenu(
        items,
        studentCount,
        ageGroup || 'maugiao',
        options || {}
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi bộ giải MILP';
    console.error('API Solver Error:', error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

