    Static Items For account
    ========================
    Field               Example                                         Notes
    -----               -------                                         -----
    userId              "ap-southeast-2:5363cdf1-ed41-42fa-90c1-3a19c18769bc"   Cognito logged in user id
    accountId           "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7"          UUID. Used to uniquely identify account
    description         "Long term savings"                             Description of the account. Should be 'description'
    createdAt           1530083031603                                   Time Lambda created account
    accName             "Savings"                                       Should be shortName. Max 12 characters. Short display name of account.
    openingDate         2015-06-28T12:00:00+08:00                       Date the account was created. This is immutable.
    openingBal          0                                               Opening balance of the account
    closingDate         2025-06-28T12:00:00+08:00                       Date after which there are no more transactions
    
    interest            true                                            Does interest calculations apply to this account
    dbRate              3.25 (3.25%)                                    Initial debit interest rate (can be manually adjusted)
    crRate              0                                               Initial credit interest rate (can be manually adjusted)

    target              true                                            Does this account target a particular value on a regular basis
    targetBal           10000                                           Value the account tries to achieve
    targetPartner       "8de71190-73d1-11e8-8ec0-3fce1802dff7"          Account where funds go to or come from to achieve target. 
    targetStartDate     2018-06-15                                      Start date of first target period
    targetPeriodType    M (month)                                       Standard period type
    targetPeriodCnt     1 (with M, monthly)                             Standard period count

    creditCard          true
    ccPartner           "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7"          Account where funds come from to pay credit card 
    ccPeriodType        M (month)                                       Standard period type
    ccPeriodCnt         1 (with M, monthly)                             Standard period count
    ccPayDay            9                                               Day of the month the credit card becomes due
    ccPeriodEndDay      28                                              Day of the month the credit card period ends

    close               true                                            Does the account have a final sweeping transaction?
    closePartner        "c8c74b80-7adf-11e8-a000-cfaf666b12b9"          Account where funds go to or come from to clear this account 
    closeDate           2025-01-01                                      Date of the closure

    Calculation Time Account Variables
    ==================================
    Field           Example                                             Notes
    -----           -------                                             -----
    dirty           false                                               Does account require rebalancing
    currentBal      35000                                               Used to summarise account statuses. Should not be stored.    
    ccDates         ['2018-01-15','2018-02-15','2018-03-15']            Dates for which credit card periods start

    Possible Template Variables
    ===========================
    type                interest                                        Only active if account has interest = true
    intApplStartDate    2018-01-15                                      First date that interest credit or debit is applied to the account
    intApplEndDate      2020-01-15                                      Last date that interest credit or debit is applied to the account
    intApplPeriodType   M (month)                                       Standard period type
    intApplPeriodCnt    1 (with M, monthly)                             Standard period count




    type
    partner
    fromDate
    toDate
    PeriodType
    PeriodCnt

    Other Notes
    ===========
- Account close date represents the last date of any transactions for the account. If this is not provided, a global end of processing date is used. By default this is 10 years from now.
- Global inflation rate is hardcoded to 3%.