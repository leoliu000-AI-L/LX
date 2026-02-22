import pandas as pd
import os
import json
import sys

try:
    files = [f for f in os.listdir('.') if f.endswith('.xlsx') and not f.startswith('~$')]

    data_summary = {}
    for file in files:
        try:
            xl = pd.ExcelFile(file)
            sheet_info = {}
            for sheet in xl.sheet_names:
                df = pd.read_excel(xl, sheet_name=sheet)
                sheet_info[sheet] = {
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_names': list(df.columns)[:10]
                }
            data_summary[file] = {
                'sheets': sheet_info,
                'sheet_count': len(xl.sheet_names)
            }
        except Exception as e:
            data_summary[file] = {'error': str(e)}

    with open('data_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(data_summary, f, ensure_ascii=False, indent=2)

    print(json.dumps(data_summary, ensure_ascii=False, indent=2))
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
