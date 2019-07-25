State data object structure
===========================
state = {
    "accounts" : [account],                                             Array of accounts
    "today" : date                                                      Today's date (yyyy-mm-dd)
}

account = {
    "userId": "ap-southeast-2:371d1338-d888-4e70-aac3-df0f24d36817",    Unique Cognito user key
    "accountId": "d70acff0-7534-11e9-843d-e37c51ab093d",                Unique Dynamodb identifier for account
    "description": "Main account",                                      Account description
    "createdAt": 1557720541807,                                         Lambda timestamp of when the account was created
    "accName": "Main",                                                  Account short name. Max 12 characters
    "openingDate": "2019-05-13T00:00:00+08:00",                         Immutable date account was actually opened on
    "closingDate": "2029-05-13T00:00:00+08:00",                         Date account is expected to close on
    "closedDate": "2029-05-13T00:00:00+08:00",                          Date account was actually closed on
    "interest": false,                                                  Whether interest is calculated for account
    "intFirstAppliedDate": "2019-05-13T00:00:00+08:00",                 Initial date interest is to be calculated from
    "periodCnt": 1,                                                     How many periods per each interest debit/credit
    "periodType": "M",                                                  Type of period per each interest debit/credit
    "dbRate": 0,                                                        Initial debit interest rate
    "crRate": 0,                                                        Initial credit interest rate
    "amount": 0,                                                        Initial account opening balance
    "sortOrder": 1,                                                     Account's position within displays
    "transactions" : [transaction],                                     Array of transactions for the account
    "starting" : starting,                                              Starting structure for the account
    "dirty": false,                                                     Is recalculation required for this account
    "currentBal": 0,                                                    Balance of the account after recalculation
    "currentCrRate": 0,                                                 Credit interest rate after recalculation
    "currentDbRate": 0,                                                 Debit interest rate after recalculation
    "ccDates": [date]                                                   List of period end dates for credit card payments
}

transaction = {

}

starting = {
                "balance": 0,                           Opening balance for this instance of the structure
                "date": "2019-05-13T00:00:00+08:00",    Start date for this instance
                "crRate": 0,                            Opening credit interest rate
                "dbRate": 0,                            Opening debit interest rate
                "interest": 0,                          Accumulated unaccounted interest at start of account
                "payoffAmt": 0
}

New Account
===========
Create dynamodb record
Build new entry in above table with initial values
Populate initial values