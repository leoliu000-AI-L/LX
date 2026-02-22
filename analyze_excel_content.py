import pandas as pd
import os
import json
from datetime import datetime

def safe_read_excel(file_path):
    """安全读取Excel文件"""
    try:
        xl = pd.ExcelFile(file_path)
        sheets_info = {}

        for sheet_name in xl.sheet_names:
            try:
                df = pd.read_excel(xl, sheet_name=sheet_name)
                sheets_info[sheet_name] = {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': list(df.columns),
                    'first_rows': df.head(3).to_dict('records') if len(df) > 0 else [],
                    'data_types': {col: str(dtype) for col, dtype in df.dtypes.items()}
                }
            except Exception as e:
                sheets_info[sheet_name] = {'error': str(e)}

        return {
            'file': os.path.basename(file_path),
            'size_kb': round(os.path.getsize(file_path) / 1024, 2),
            'sheets': sheets_info,
            'sheet_count': len(xl.sheet_names)
        }
    except Exception as e:
        return {
            'file': os.path.basename(file_path),
            'error': str(e)
        }

def analyze_files():
    """分析所有Excel文件"""
    files = [
        'VN热门销售产品-总榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-达人榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-商品卡榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-视频榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-新品榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-直播榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-总榜-7天（20260207-202602-13）.xlsx',
        'VN-商品机会-关键词.xlsx',
        'VN-商品机会-精选.xlsx',
        'VN-商品机会-商品.xlsx',
        'VN-商品机会-新品.xlsx'
    ]

    analysis_results = {}

    for file in files:
        if os.path.exists(file):
            print(f"正在分析: {file}")
            result = safe_read_excel(file)
            analysis_results[file] = result
        else:
            print(f"文件不存在: {file}")
            analysis_results[file] = {'error': 'File not found'}

    # 保存分析结果
    output_file = 'excel_analysis_detailed.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_results, f, ensure_ascii=False, indent=2)

    print(f"\n分析完成! 结果已保存到: {output_file}")
    return analysis_results

def generate_summary_report(analysis_results):
    """生成汇总报告"""
    report = []
    report.append("=" * 80)
    report.append("Excel文件内容详细分析报告")
    report.append("=" * 80)
    report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")

    for file, data in analysis_results.items():
        if 'error' in data:
            report.append(f"❌ {file}")
            report.append(f"   错误: {data['error']}")
        else:
            report.append(f"✅ {file}")
            report.append(f"   文件大小: {data['size_kb']} KB")
            report.append(f"   工作表数量: {data['sheet_count']}")

            for sheet_name, sheet_data in data['sheets'].items():
                if 'error' in sheet_data:
                    report.append(f"   ❌ 工作表 '{sheet_name}': {sheet_data['error']}")
                else:
                    report.append(f"   📊 工作表 '{sheet_name}':")
                    report.append(f"      - 行数: {sheet_data['rows']}")
                    report.append(f"      - 列数: {sheet_data['columns']}")
                    report.append(f"      - 列名: {', '.join(sheet_data['column_names'][:10])}")

                    if sheet_data['first_rows']:
                        report.append(f"      - 示例数据 (前3行):")
                        for i, row in enumerate(sheet_data['first_rows'][:3], 1):
                            report.append(f"        第{i}行: {str(row)[:200]}...")

        report.append("")

    return "\n".join(report)

if __name__ == '__main__':
    print("开始分析Excel文件...")
    results = analyze_files()

    print("\n生成汇总报告...")
    summary = generate_summary_report(results)

    report_file = 'excel_content_analysis_report.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(summary)

    print(f"汇总报告已保存到: {report_file}")
    print(summary[:2000])
