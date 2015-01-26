strawpoll
=========

Consensus building over SMS.

Originally designed to select a band name.

Once added to the system, users can send a text to a specified phone number and a new choice will be created.

Then, they'll receive choices and their reply will be recorded as the vote.

Installation
------------

npm install https://github.com/ghing/strawpoll/

Configuration
-------------

Configuration is passed using environment variables.

### STRAWPOLL_MONGO_CONNECTION_STRING

Connection string for the MongoDB database.

Example:

    mongodb://localhost/bandnames

### STRAWPOLL_TEST_MONGO_CONNECTION_STRING

Connection string for the MongoDB database to be used to run tests.

Example:

    mongodb://localhost/bandnames_test

### STRAWPOLL_PORT

Port on which to run the server.

Example:

    9999

### TWILIO_ACCOUNT_SID

Twilio account SID.

### TWILIO_AUTH_TOKEN

Twilio authentication token.

### TWILIO_PHONE_NUMBER

Twilio phone number used to send SMS messages.

Command Line Interface
----------------------

### createuser

Create a new user.

Example:

    strawpoll createuser Geoff '+11234567890'

### send-sms

Send choices for users to vote on.

#### Examples:

Send a choice to a user who hasn't received one in the last 2 hours.

    strawpoll send-sms --wait '2 hours'

Send a choice to a user who hasn't received one in the last 2 hours and if a simulated coin flip succeeds.  This is useful if you want to run this command via a cron job but don't want all users to receive messages at the same time.

    strawpoll send-sms --conflip

Send a choice only to a specific user. Default is to send to all users.

    strawpoll send-sms --user Geoff
