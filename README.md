# orderbuster

This is a Node.js script that extracts data from a database using a URL vulnerable to an "ORDER BY" SQL injection point. This technique has been described by [Joseph Keeler](http://josephkeeler.com/2009/05/php-security-sql-injection-in-order-by/) and Alexandre de Dommelin, among others, and is described by the Portswigger as ["the most common injection point within the SQL query structure."](https://support.portswigger.net/customer/en/portal/articles/2590771-sql-injection-in-the-query-structure)

A similar tool written in Perl has been demonstrated by [Brian Cardinale](https://www.youtube.com/watch?v=WKnqP0izeLE). The vulnerability [can be detected by sqlmap](https://github.com/sqlmapproject/sqlmap/issues/97). The best method to protect against it is to whitelist ORDER BY parameters such that they can only be valid column names. 

The script can be used from a command line as follows:

`node bust.js [vulnerableURL] [targetFieldSelectStatement] [estimatedLength] [knownSortableColumn] [javascriptOrderTest] [cookies]`

Where **vulnerableURL** is a URL ending in the injection point, **knownSortableColumn** is an existing sortable column in the vulnerable query, and **javascriptOrderTest** is a comparison (in Javascript) that returns whether the given response **html** is ordered ascending or descending with regard to **knownSortableColumn**. 

For example: 

`node bust.js "http://vulnerable.com/admin.php?page=exploitable&OrderBy=" "SELECT user_pass FROM users WHERE ID = 1" 40 "ID" "html.lastIndexOf(\"[data id='1']\") < html.lastIndexOf(\"[data id='2']\")" "admincookie=blahblah;"`

This script is provided as-is, with no warranties or guarantees of any kind. It does not throttle or conceal its requests in any way, and using it against a site you are not authorized to attack would be both illegal and a very bad idea.
