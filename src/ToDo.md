Backlog in priority order
=========================
1. Go onto 'credit card' handling
    - details to be added re. templates etc
    - Update calculate.js to use new cc details
    - Remove cc details from testTrans
2. Do zero and minimise
    - details to be added re. templates etc
    - Update calculate.js to use new zero/minimise details
    - Remove zero/minimise details from testTrans
3. Deprecate old 'transactions' format entirely.
4. Wire up Save button to saving transactions somewhere
    - loop through all accounts in 'transactions'
    - get trans for account
    - update dynamo with trans = trans[acc]
    - alternatively, store transactions as a blob in S3
5. Wire up Load button to do the opposite
6. Work out what to do at startup
    - do we load transactions automatically like accounts or is a 'load' required?


accounts
========
- move 'static' (non transaction processing) detail from transaction list grouping to accounts in dynamoDb
- add an edit button to accounts list (replaces link on actual account list item)
- modify account list item click to go to list of transactions for account
- add extra detail
    - 'stop' date
    - account type
        - 'interest'
        - 'cc'
- remove S3 attachment code
- add concept of a debit and a credit interest rate so that credits and debits can attract different rates.

transactions
============
- add Save Transactions button 
    - implements saving of all data to S3/dynamoDb
- add Load transactions button
    - reads from S3 and populates data structures for transaction displays per account
    - what happens if accounts in transaction data doesn't match account list?
- allow manual editing of transactions in transaction list
- allow reconciliation of transactions in transaction list
- use 'inflate' from template rather than hardcoded version
- add in 'offset' feature for transfers
- add in manual interest rate adjustment transaction

templates
=========
- Add 'inflate' toggle for templates
- Add 'zero' template - sweep all funds from account to another account
- Add 'minimise' template - sweep money out of account but still keep a minimum amount in it

main
====
- add data settings
    - interest rate
    - default end date
- add in 'scratch pad' for notes
    - add in link to calculator from scratch pad

miscellaneous
=============
- handle state better - redux?
- use const instead of let where appropriate
- handle many accounts in the nav bar on the Transactions list
- look at better table processing
    - scrolling within list