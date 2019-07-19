Bugs
====

- [x] 2018-07-17  Adding new account causes TypeError: Cannot read property 'currentBal' of undefined. 
                  Account list exists in transAcc but new account doesn't
- [x] 2018-07-17  New accounts with opening date of today show no opening balance
- [x] 2018-07-17  Creating new account with interest with 'First Applied Date' of 2018-08-15 creates first interest debit on 2018-09-15 - as intended - may cause a problem if truncating accounts allowed in future
- [x] 2018-07-17  Selecting Opening Balance when updating an account should select whole amount, not just put the cursor at the end
- [x] 2018-07-17  Save button highlight not going away when Save pressed - could not recreate
- [x] 2018-07-17  Inflation factor compulsory
- [ ] 2018-07-17  List management for templates is clunky and heavy handed. Needs filtering by account.
- [x] 2018-07-17  When modifying a template, Recalculate required is indicated but transaction list shows already recalculated - could not recreate
- [x] 2018-07-17  Can't create credit card payoff transactions! - Credit card template already exists for account 'AMEXSean'
- [x] 2018-07-17  Ubank opening balance (amount) is 120310.999999 instead of 120311
- [x] 2018-07-18  Manual interest payments getting automatically modified - probably need to set type to 'manual'