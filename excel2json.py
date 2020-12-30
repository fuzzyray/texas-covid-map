#!/usr/bin/env python3
import json
import sys
from urllib.request import urlretrieve

import pandas as pd

URL = 'https://dshs.texas.gov/coronavirus/TexasCOVID19CaseCountData.xlsx'
BASENAME = 'TexasCOVID19CaseCountData'

try:
    print("Retrieving:", URL)
    urlretrieve(URL, BASENAME + '.xlsx')
except Exception as e:
    print(e)
    sys.exit(-1)
else:
    # Read the latest population estimate from Texas Demographic Center https://demographics.texas.gov
    # urlretrieve('https://demographics.texas.gov/Resources/TPEPP/Estimates/2018/2018_txpopest_county.csv',
    #             'Texas2018PopulationEstimate.csv')
    county_population_df = pd.read_csv('Texas2018PopulationEstimate.csv', encoding="utf-8")
    county_population_df.loc[county_population_df['county'] == 'De Witt', 'county'] = 'DeWitt'
    county_population_df = county_population_df[['county', 'jan1_2019_pop_est']]
    county_population_df = county_population_df.rename(columns={"jan1_2019_pop_est": "population"})
    county_population_df = county_population_df.replace(to_replace='State of Texas', value='Total')
    county_population_df = county_population_df.set_index('county')

    # Read the Covid Data from the spreadsheet
    all_data = pd.read_excel('TexasCOVID19CaseCountData.xlsx', sheet_name=None, header=None, engine='openpyxl')

    # Get the Case and Fatality data
    cases_df = all_data['Case and Fatalities'].copy().dropna().reset_index(drop=True)
    cases_df.columns = cases_df.iloc[0]
    cases_df = cases_df[1:]
    cases_df = cases_df.rename(columns={"County": "county", "Confirmed\nCases": "cases", "Fatalities": "fatalities"})
    cases_df = cases_df.drop(columns=['Probable\nCases'])
    cases_df = cases_df.merge(county_population_df, on='county')

    TXCases = {
        "date": all_data['Case and Fatalities'][0][0],
        "hospitalizations": all_data['Hospitalization by Day'][[2]].dropna().tail(1).iat[0, 0],
        "positivity rate": all_data['Tests by Day'].at[2, 5],
        "counts": json.loads(cases_df.to_json(orient='records'))
    }

    print(TXCases["date"])
    print("hospitalizations:", TXCases["hospitalizations"])
    print("Positivity Rate:", TXCases["positivity rate"])

    with open(BASENAME + '.json', 'w', encoding='utf-8') as jsonFile:
        jsonFile.write(json.dumps(TXCases))
