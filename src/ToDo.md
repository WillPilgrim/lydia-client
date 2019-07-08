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

transactions
============
- add in 'offset' feature for transfers

templates
=========

main
====
- add data settings
    - interest rate
    - default end date
- add in 'scratch pad' for notes
    - add in link to calculator from scratch pad

miscellaneous
=============
- Put in a warning when Loading if data is 'dirty'
- Need a better way to handle if no data.txt file exists in AWS S3
- Use native date objects rather than Moment in key areas
- handle state better - redux?
- use const instead of let where appropriate
- handle many accounts in the nav bar on the Transactions list
- look at better table processing
    - scrolling within list
    - React Table looks like a good candidate
- Check at least one account created before allowing Save

Testing
=======
- test all functions with no accounts created
- test all functions with no templates created