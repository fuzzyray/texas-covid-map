#!/usr/bin/env python3
import json
import sys

import pandas as pd
import requests

BASENAME = 'TexasCOVID19CaseCountData'
URL = f'https://dshs.texas.gov/coronavirus/{BASENAME}.xlsx'


def main():
    excel_filename = f'{BASENAME}.xlsx'
    json_filename = f'{BASENAME}.json'
    population_filename = 'tx48s050.csv'

    # Retrieve the latest copy of the spreadsheet
    try:
        print('Retrieving:', URL)
        r = requests.get(URL)
    except requests.RequestException as e:
        sys.exit(e)
    else:
        if r:
            with open(excel_filename, 'wb') as fd:
                for chunk in r.iter_content():
                    fd.write(chunk)
        else:
            sys.exit(f'Unable to retrieve file. Status Code: {r.status_code}')

    # 2020 Census data:
    # https://demographics.texas.gov/Resources/Decennial/2020/Redistrict/pl94-171/csvdata/totpop/sumlev/tx48s050.zip
    # Columns: BASENAME, POP100
    county_population_df = pd.read_csv(population_filename, encoding='utf-8')
    county_population_df = county_population_df[['BASENAME', 'POP100']]
    county_population_df = county_population_df.rename(columns={'BASENAME': 'county', 'POP100': 'population'})
    county_population_df = county_population_df.set_index('county')

    # Read the Covid Data from the spreadsheet
    all_data = pd.read_excel(excel_filename, sheet_name=None, header=None, engine='openpyxl')

    # Get the Case and Fatality data
    cases_df = all_data['Case and Fatalities_ALL'].copy().dropna().reset_index(drop=True)
    cases_df.columns = cases_df.iloc[0]
    cases_df = cases_df[1:]
    cases_df = cases_df.rename(columns={'County': 'county', 'Confirmed Cases': 'cases', 'Fatalities': 'fatalities'})
    cases_df = cases_df.drop(columns=['Probable Cases'])
    cases_df = cases_df.merge(county_population_df, on='county')

    # Sum the total counts
    totals = {
        'county': 'Total',
        'cases': cases_df['cases'].sum(),
        'fatalities': cases_df['fatalities'].sum(),
        'population': cases_df['population'].sum()
    }

    cases_df = cases_df.append(totals, ignore_index=True)

    # Spreadsheet sometimes has positivity rate value as float, other times as string
    positivity_rate = all_data['Molecular Positivity Rate'].at[2, 5]
    if isinstance(positivity_rate, str):
        positivity_rate = float(positivity_rate[:-1]) / 100

    texas_cases = {
        'date': all_data['Case and Fatalities_ALL'][0][0],
        'hospitalizations': all_data['Hospitalizations'].at[3, 1],
        'positivity rate': positivity_rate,
        'counts': json.loads(cases_df.to_json(orient='records'))
    }

    print(texas_cases['date'])
    print('Cases:', texas_cases['counts'][-1]['cases'])
    print('Deaths:', texas_cases['counts'][-1]['fatalities'])
    print('Hospitalizations:', texas_cases['hospitalizations'])
    print('Positivity Rate:', texas_cases['positivity rate'])

    with open(json_filename, 'w', encoding='utf-8') as json_file:
        json_file.write(json.dumps(texas_cases))


if __name__ == '__main__':
    main()
