#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import xml.etree.ElementTree as ET
import zipfile
import json
import os
import re
from collections import defaultdict

def extract_shared_strings(xlsx_file):
    """提取共享字符串"""
    try:
        with zipfile.ZipFile(xlsx_file, 'r') as zip_ref:
            if 'xl/sharedStrings.xml' in zip_ref.namelist():
                xml_content = zip_ref.read('xl/sharedStrings.xml')
                root = ET.fromstring(xml_content)
                strings = []
                for si in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    text_elements = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    if text_elements:
                        strings.append(text_elements[0].text)
                return strings
    except:
        pass
    return []

def parse_worksheet(xml_content, shared_strings):
    """解析工作表数据"""
    root = ET.fromstring(xml_content)
    rows_data = []

    # 命名空间
    ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

    # 查找所有行
    for row in root.findall('.//main:row', ns):
        row_data = {}
        for cell in row.findall('.//main:c', ns):
            cell_ref = cell.get('r', '')
            cell_type = cell.get('t', '')

            # 提取列字母和行号
            col_match = re.match(r'([A-Z]+)(\d+)', cell_ref)
            if col_match:
                col = col_match.group(1)

                # 获取单元格值
                value_elem = cell.find('main:v', ns)
                if value_elem is not None:
                    value = value_elem.text

                    # 如果是共享字符串类型
                    if cell_type == 's' and value and shared_strings:
                        try:
                            idx = int(value)
                            if idx < len(shared_strings):
                                value = shared_strings[idx]
                        except:
                            pass

                    row_data[col] = value

        if row_data:
            rows_data.append(row_data)

    return rows_data

def analyze_excel_file(file_path):
    """分析单个Excel文件"""
    try:
        file_info = {
            'file_name': os.path.basename(file_path),
            'file_size_kb': round(os.path.getsize(file_path) / 1024, 2),
            'sheets': {}
        }

        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            # 提取共享字符串
            shared_strings = extract_shared_strings(file_path)

            # 查找所有工作表
            sheet_files = [f for f in zip_ref.namelist() if f.startswith('xl/worksheets/sheet')]

            for sheet_file in sheet_files:
                sheet_name = os.path.basename(sheet_file)
                xml_content = zip_ref.read(sheet_file)
                rows_data = parse_worksheet(xml_content, shared_strings)

                if rows_data:
                    # 分析数据
                    file_info['sheets'][sheet_name] = {
                        'row_count': len(rows_data),
                        'sample_data': rows_data[:10],  # 前10行数据
                        'all_data': rows_data
                    }

        return file_info

    except Exception as e:
        return {
            'file_name': os.path.basename(file_path),
            'error': str(e)
        }

def generate_insight_report(all_data):
    """生成深度分析报告"""
    report = []
    report.append("=" * 100)
    report.append("越南市场热门销售产品深度数据分析报告")
    report.append("=" * 100)
    report.append("")

    # 1. 总体数据概况
    report.append("【总体数据概况】")
    total_files = len([f for f in all_data if 'error' not in f])
    total_rows = sum(sum(sheet['row_count'] for sheet in file_data['sheets'].values())
                     for file_data in all_data if 'error' not in file_data)

    report.append(f"• 分析文件总数: {total_files} 个")
    report.append(f"• 数据总行数: {total_rows:,} 行")
    report.append("")

    # 2. 各榜单详细分析
    report.append("【各榜单详细分析】")

    rank_files = {
        '总榜-28天': 'VN热门销售产品-总榜-28天（20260115-202602-13）.xlsx',
        '达人榜-28天': 'VN热门销售产品-达人榜-28天（20260115-202602-13）.xlsx',
        '商品卡榜-28天': 'VN热门销售产品-商品卡榜-28天（20260115-202602-13）.xlsx',
        '视频榜-28天': 'VN热门销售产品-视频榜-28天（20260115-202602-13）.xlsx',
        '新品榜-28天': 'VN热门销售产品-新品榜-28天（20260115-202602-13）.xlsx',
        '直播榜-28天': 'VN热门销售产品-直播榜-28天（20260115-202602-13）.xlsx'
    }

    for rank_name, file_name in rank_files.items():
        file_data = next((f for f in all_data if f['file_name'] == file_name), None)
        if file_data and 'error' not in file_data:
            report.append(f"\n📊 {rank_name}:")
            for sheet_name, sheet_data in file_data['sheets'].items():
                report.append(f"   • 数据量: {sheet_data['row_count']} 行")

                if sheet_data['sample_data']:
                    sample = sheet_data['sample_data'][0]
                    report.append(f"   • 数据字段: {', '.join(list(sample.keys())[:10])}")

                    # 尝试提取商品名称
                    if 'C' in sample:
                        report.append(f"   • TOP1商品: {sample.get('C', 'N/A')}")

    # 3. 商品机会分析
    report.append("\n\n【商品机会深度分析】")

    opportunity_files = {
        '关键词机会': 'VN-商品机会-关键词.xlsx',
        '精选机会': 'VN-商品机会-精选.xlsx',
        '商品机会': 'VN-商品机会-商品.xlsx',
        '新品机会': 'VN-商品机会-新品.xlsx'
    }

    for opp_name, file_name in opportunity_files.items():
        file_data = next((f for f in all_data if f['file_name'] == file_name), None)
        if file_data and 'error' not in file_data:
            report.append(f"\n💡 {opp_name}:")
            for sheet_name, sheet_data in file_data['sheets'].items():
                report.append(f"   • 机会数量: {sheet_data['row_count']} 条")

                if sheet_data['sample_data']:
                    sample = sheet_data['sample_data'][0]
                    report.append(f"   • 数据示例: {str(sample)[:150]}...")

    # 4. 关键发现
    report.append("\n\n【关键发现与洞察】")

    # 统计高频词汇
    all_products = []
    for file_data in all_data:
        if 'error' not in file_data:
            for sheet_data in file_data['sheets'].values():
                for row in sheet_data['sample_data']:
                    if 'C' in row:  # 商品名称通常在C列
                        all_products.append(row['C'])

    # 提取品牌和品类
    brands = defaultdict(int)
    categories = defaultdict(int)

    keywords = ['iPhone', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Apple', 'Điện thoại',
                'Tai nghe', 'Sạc', 'Ốp lưng', 'Đồng hồ', 'Laptop', 'Máy ảnh']

    for product in all_products[:50]:  # 分析前50个商品
        if product:
            product_str = str(product)
            for keyword in keywords:
                if keyword.lower() in product_str.lower():
                    categories[keyword] += 1

    if categories:
        report.append("\n🔥 热门品类TOP5:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]:
            report.append(f"   • {cat}: {count} 次")

    # 5. 价格区间分析
    report.append("\n💰 价格区间分析:")
    price_ranges = defaultdict(int)

    for file_data in all_data:
        if 'error' not in file_data:
            for sheet_data in file_data['sheets'].values():
                for row in sheet_data['sample_data']:
                    if 'F' in row:  # 销量/数据通常在F列
                        value = str(row['F'])
                        if '~' in value:
                            try:
                                parts = value.split('~')
                                if parts:
                                    price_ranges['有价格区间数据'] += 1
                            except:
                                pass

    for range_name, count in price_ranges.items():
        report.append(f"   • {range_name}: {count} 条")

    # 6. 业务建议
    report.append("\n\n【基于数据的业务建议】")
    report.append("1. 🎯 产品策略: 关注榜单TOP商品,分析其价格、评分、销量等关键指标")
    report.append("2. 📈 营销策略: 结合视频榜和直播榜数据,加大内容营销投入")
    report.append("3. 🔍 选品方向: 参考新品榜和商品机会,提前布局潜力品类")
    report.append("4. 📊 数据监控: 建立7天/28天双重监控机制,及时发现趋势变化")
    report.append("5. 🏆 竞品分析: 持续追踪头部商品和商家,学习成功经验")

    report.append("\n" + "=" * 100)
    report.append(f"报告生成时间: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("=" * 100)

    return "\n".join(report)

def main():
    # 要分析的文件列表
    files_to_analyze = [
        'VN热门销售产品-总榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-达人榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-商品卡榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-视频榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-新品榜-28天（20260115-202602-13）.xlsx',
        'VN热门销售产品-直播榜-28天（20260115-202602-13）.xlsx',
        'VN-商品机会-关键词.xlsx',
        'VN-商品机会-精选.xlsx',
        'VN-商品机会-商品.xlsx',
        'VN-商品机会-新品.xlsx'
    ]

    print("开始深度分析Excel文件...")

    all_data = []
    for file_name in files_to_analyze:
        if os.path.exists(file_name):
            print(f"正在分析: {file_name}")
            file_data = analyze_excel_file(file_name)
            all_data.append(file_data)
        else:
            print(f"文件不存在: {file_name}")

    print(f"\n共分析 {len(all_data)} 个文件")

    # 生成分析报告
    print("生成深度分析报告...")
    report = generate_insight_report(all_data)

    # 保存报告
    report_file = '深度数据分析报告.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"报告已保存: {report_file}")
    print(report)

if __name__ == '__main__':
    import pandas as pd
    main()
