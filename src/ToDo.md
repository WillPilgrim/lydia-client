file management
===============
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

- Ensure archive load updates accounts with saved accounts - not dynamo accounts. This means doing a refreshAccounts when loading normal saving
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
- Structure:  Create one data structure for all data passed around the apps in props.
    - Reading accounts will populate some of it
    - Transaction generation will populate other parts
    - Adding a new account will add the entry to the data structure
    - Deleting an account will delete it from the data structure. If there are transactions, it will give a warning
    - Accounts will be saved when archiving meaning that restoring an archive will have the point in time accounts
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