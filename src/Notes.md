#Special transaction types

- Minimise and Zero

The 'minimise' transaction type is an attribute of an account. Basically it allows an account to set a minimum value the account can get to within a period.
If the balance of the account would fall below that value, funds are transferred from a partner account at the start of the period to ensure this doesn't happen. 
Conversely if the minimum balance for the period is above the set value, funds are transferred to the partner account.

Note optionally a transfer from a partner account can be limited to ensure that account's balance does not go negative.

Example 1:

A Cheque account has a 'minimise' facility set to the 1st of every month with a value of $100, with a 'partner' Savings account. If, for example, the minimum balance for the month falls on the 10th of the month and is $30, then an automatic transfer would be set from the Savings to the Cheque account on the 1st of that month of $70. 

Example 2:
Imagine the same scenario as for example 1, but with the limit option set preventing the Savings account's balance go negative. If the balance of the Savings is only $50, then only $50 will be transferred to the Cheque account.

Example 3:
Imagine the same scenario again except the minimum balance is $300. Then an automatic transfer would be generated of $200 from the Cheque to the Savings account.

The Zero transaction type is a special case of the minimise type. There is only ever one on an account and it represents a closing transaction that sets the balance to 0. That is, funds are transferred from or to a partner account that ensures that on the closing date, the account is cleared.

Restrictions
============
- Only one Zero attribute per account. This reflects the idea that an account is only closed once.
- One Minimise attribute per account. This reflects that an account can only minimise to one partner account.
- Minimise and Zero attributes cannot be applied to Credit Card accounts. This is because the 'Payoff' attribute for Credit Card transactions is a special type of Minimise attribute and would create conflicts.
- Accounts can cascade Minimise and Zero attributes provided this does not create a dependency loop. For example, account A, B and C all minimise to $100. A uses funds from B, B uses funds from C, and C uses funds from A. This cannot be resolved and is not permitted.

Interest
========
Interest is specified at the account level. It can be turned off or on when creating and modifying accounts. If turned on then the following values can be specified:
- First date that interest is calculated from. This must be on or after date of entry. 
- Initial debit interest rate. This is the rate that will apply when the balance of the period applied to is negative.
- Initial credit interest rate. This is the rate that will apply when the balance of the period applied to is positive.
- First date accumulated interest is applied to the account. This represents the first credit or debit entry of interest.
- Applied interest period type and period count. These two values specify how frequently interest will be applied to the account.

Note that the separation of credit and debit interest rates allow for accounts where the rate is not consistent. For example, many account types have a very small credit interest (or none at all) but a much larger debit interest. In either case, the interest is calculated on each period from one entry in the account to the next and the type of rate is based on the balance at the time of the former entry. In practice the rules applied to accounts are often more complex especially for credit interest. For example, to accrue credit interest an account may require a minimum balance or at least no negative balance for a large period. However this mechanism allows for reasonable approximations of account behaviour. A good practical use is to set loan accounts to the appropriate debit rate but set the credit rate to 0. For cheque accounts that pay little interest, turning off interest altogether may be appropriate. 

Notes on Transaction Load/Save
==============================
1. Upon login, auto load transactions with accounts - experiment with storing transaction data as a blob in Dynamo. Otherwise use S3.
2. Experiment with data compression
3. Save transactions will do a special put to account row.
4. Restore reloads just the transaction portion of the account.
5. Put the transactions in accounts 'state' and pass it to 'transactions'. Use Context??