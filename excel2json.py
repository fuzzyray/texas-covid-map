#!/usr/bin/env python3
import json
import sys
from openpyxl import load_workbook
from urllib.request import Request, urlopen
from urllib.error import URLError

URL = 'https://dshs.texas.gov/coronavirus/TexasCOVID19CaseCountData.xlsx'
BASENAME = 'TexasCOVID19CaseCountData'

req = Request(URL)
try:
    response = urlopen(req)
except URLError as e:
    if hasattr(e, 'reason'):
        print('We failed to reach a server.')
        print('Reason: ', e.reason)
    elif hasattr(e, 'code'):
        print('The server couldn\'t fulfill the request.')
        print('Error code: ', e.code)
    sys.exit(-1)
else:
    excel_data = bytes(response.read())
    with open(BASENAME + '.xlsx', 'wb') as excelFile:
        excelFile.write(excel_data)

    wb = load_workbook(filename=BASENAME + '.xlsx')
    ws = wb['Case and Fatalities']

    TXCases = {
        "date": None,
        "hospitalizations": None,
        "positivity rate": None,
        "counts": []
    }

    for row in ws.iter_rows(min_row=1, max_row=1, values_only=True):
        TXCases["date"] = row[0]
        print(TXCases["date"])

    for row in ws.iter_rows(min_row=3, values_only=True):
        entry = {
            "county": row[0],
            "cases": row[1],
            "fatalities": row[2]
        }
        TXCases["counts"].append(entry)

    ws = wb['Hospitalizations']
    for row in ws.iter_rows(min_row=3, max_row=3, values_only=True):
        TXCases["hospitalizations"] = row[1]

    ws = wb['Tests by Day']
    for row in ws.iter_rows(min_row=4, max_row=4, values_only=True):
        TXCases["positivity rate"] = row[3]

    with open(BASENAME + '.json', 'w', encoding='utf-8') as jsonFile:
        jsonFile.write(json.dumps(TXCases))
