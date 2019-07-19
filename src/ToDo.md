file management
===============
- Add Trim button (only enabled if recalc not required and save not required)
    - Select a trim date. Validate as for 'archive'
    - Validate every transaction before and including trim date has been reconciled
    - For each account
        - Set new copy of transactions
        - Loop through all transactions while trans date is <= trim date
            - keep running interest amounts
            - keep running balance
            - keep accumulated interest - reset every interest payment
            - keep last closing balance cc amount 
        - update all starting values for account
        - Loop through all transactions while trans date is <= trim date again
            - remove transaction



        - Remove all transactions up until trim date. 
        - Accumulate any interest
        - Update starting values for transAcc
            - newAccount.starting.balance = {balance as at the end of the trim date}
            - newAccount.starting.crRate = {credit interest at the end of the trim date}
            - newAccount.starting.dbRate = {credit interest at the end of the trim date}
            - newAccount.starting.date = {trim date + 1}
            - newAccount.starting.interest = {cummulated interest to the point of the trim date since the last interest credit/debit}
            - newAccount.starting.payoffAmt = {payoff amount for the credit card that is next due as at the trim date}
        - flag account as requiring saving

- Combine functions
    - Allow two functions to be combined to archive and update current file
    - Perhaps give a choice as to whether archiving happens at end of financial year or calendar year only

- Allow management of archived files
    - List
    - Select
    - Rename
    - Delete       

- Allow management of current file
    - Delete
    - Rename
    - Backup

accounts
========
- move 'static' (non transaction processing) detail from transaction list grouping to accounts in dynamoDb
- add an edit button to accounts list (replaces link on actual account list item)
- modify account list item click to go to list of transactions for account

transactions
============
- Create a last entry for interest accounts when the account is closed
- add in 'offset' feature for transfers
- improve 'opening balance' line of the transactions to use 'start' values properly
- allow 'start' values to be modified
- add ability to modify starting values for a 'segment' from a button in the transaction display
- restrict 'Apply annual inflation rate' to be editable only for debit, credit and transfer types and only when start and end dates are different

templates
=========

main
====
- add data settings
    - interest rate
    - default end date
- add in 'scratch pad' for notes
    - add in link to calculator from scratch pad (React component?)
- add in mortgage calculator

miscellaneous
=============
- Need to persist sort orders, selected account, scroll position etc when storing current data
- Put in a warning when Loading if data is 'dirty'
- Need a better way to handle if no data.txt file exists in AWS S3
- Use native date objects rather than Moment in key areas
- handle state better - redux?
- use const instead of let where appropriate
- Check at least one account created before allowing Save
- Revisit the way accounts are stored
    - Opening date
    - Close date

Testing
=======
- test all functions with no accounts created
- test all functions with no templates created