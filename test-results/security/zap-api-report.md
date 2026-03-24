# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 3 |
| Informational | 4 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Exceeded High | http://tco-backend:8080 | Percentage of responses with status code 4xx | 95 % |
| Info | Informational | http://tco-backend:8080 | Percentage of responses with status code 2xx | 4 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with content type application/json | 15 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with content type text/html | 1 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with method DELETE | 7 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with method GET | 60 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with method PATCH | 3 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with method POST | 23 % |
| Info | Informational | http://tco-backend:8080 | Percentage of endpoints with method PUT | 5 % |
| Info | Informational | http://tco-backend:8080 | Count of total endpoints | 111    |




## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | 5 |
| Unexpected Content-Type was returned | Low | 2 |
| X-Content-Type-Options Header Missing | Low | 1 |
| A Client Error response code was returned by the server | Informational | 110 |
| Authentication Request Identified | Informational | 3 |
| Non-Storable Content | Informational | Systemic |
| Storable and Cacheable Content | Informational | Systemic |




## Alert Detail



### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://tco-backend:8080/api/CreditTypes%3FisActive=true
  * Node Name: `http://tco-backend:8080/api/CreditTypes (isActive)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://tco-backend:8080/api/Health
  * Node Name: `http://tco-backend:8080/api/Health`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services%3FisActive=true
  * Node Name: `http://tco-backend:8080/api/Services (isActive)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/v1/swagger.json
  * Node Name: `http://tco-backend:8080/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages
  * Node Name: `http://tco-backend:8080/api/ContactMessages ()({name,email,subject,message})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 5

### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Unexpected Content-Type was returned ](https://www.zaproxy.org/docs/alerts/100001/)



##### Low (High)

### Description

A Content-Type of text/html was returned by the server.
This is not one of the types expected to be returned by an API.
Raised by the 'Alert on Unexpected Content Types' script

* URL: http://tco-backend:8080/swagger/
  * Node Name: `http://tco-backend:8080/swagger/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/index.html
  * Node Name: `http://tco-backend:8080/swagger/index.html`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``


Instances: 2

### Solution



### Reference




#### Source ID: 4

### [ X-Content-Type-Options Header Missing ](https://www.zaproxy.org/docs/alerts/10021/)



##### Low (Medium)

### Description

The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.

* URL: http://tco-backend:8080/swagger/v1/swagger.json
  * Node Name: `http://tco-backend:8080/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`


Instances: 1

### Solution

Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.
If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.

### Reference


* [ https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85) ](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85))
* [ https://owasp.org/www-community/Security_Headers ](https://owasp.org/www-community/Security_Headers)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 401 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://tco-backend:8080/api/ContactMessages/id
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id/
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id
  * Node Name: `http://tco-backend:8080/api/Services/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id/
  * Node Name: `http://tco-backend:8080/api/Services/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id
  * Node Name: `http://tco-backend:8080/api/Users/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id/
  * Node Name: `http://tco-backend:8080/api/Users/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080
  * Node Name: `http://tco-backend:8080`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/
  * Node Name: `http://tco-backend:8080/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/942283100145427520
  * Node Name: `http://tco-backend:8080/942283100145427520`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api
  * Node Name: `http://tco-backend:8080/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/
  * Node Name: `http://tco-backend:8080/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/377714378718724039
  * Node Name: `http://tco-backend:8080/api/377714378718724039`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth
  * Node Name: `http://tco-backend:8080/api/Auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/
  * Node Name: `http://tco-backend:8080/api/Auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/6026183632686631223
  * Node Name: `http://tco-backend:8080/api/Auth/6026183632686631223`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/actuator/health
  * Node Name: `http://tco-backend:8080/api/Auth/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup
  * Node Name: `http://tco-backend:8080/api/Backup`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/
  * Node Name: `http://tco-backend:8080/api/Backup/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/8137376701692189804
  * Node Name: `http://tco-backend:8080/api/Backup/8137376701692189804`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/generate
  * Node Name: `http://tco-backend:8080/api/Backup/generate`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/generate/
  * Node Name: `http://tco-backend:8080/api/Backup/generate/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/status
  * Node Name: `http://tco-backend:8080/api/Backup/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Backup/status/
  * Node Name: `http://tco-backend:8080/api/Backup/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages
  * Node Name: `http://tco-backend:8080/api/ContactMessages`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages%3Fstatus=%2523set%2528%2524engine%253D%2522%2522%2529%250A%2523set%2528%2524proc%253D%2524engine.getClass%2528%2529.forName%2528%2522java.lang.Runtime%2522%2529.getRuntime%2528%2529.exec%2528%2522sleep+15%2522%2529%2529%250A%2523set%2528%2524null%253D%2524proc.waitFor%2528%2529%2529%250A%2524%257Bnull%257D
  * Node Name: `http://tco-backend:8080/api/ContactMessages (status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages%3Fstatus=10
  * Node Name: `http://tco-backend:8080/api/ContactMessages (status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/6424585726089808040
  * Node Name: `http://tco-backend:8080/api/ContactMessages/6424585726089808040`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id/4194725595209768190
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id/4194725595209768190`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/pending
  * Node Name: `http://tco-backend:8080/api/ContactMessages/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/pending/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/stats
  * Node Name: `http://tco-backend:8080/api/ContactMessages/stats`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/stats/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/stats/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests
  * Node Name: `http://tco-backend:8080/api/CreditRequests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/2709970534244552137
  * Node Name: `http://tco-backend:8080/api/CreditRequests/2709970534244552137`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/8986486644784238592
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/8986486644784238592`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/status
  * Node Name: `http://tco-backend:8080/api/CreditRequests/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/status/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/status/8371023943152908756
  * Node Name: `http://tco-backend:8080/api/CreditRequests/status/8371023943152908756`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/status/status
  * Node Name: `http://tco-backend:8080/api/CreditRequests/status/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/status/status/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/status/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes%3FisActive=http%253A%252F%252Fwww.google.com%252F
  * Node Name: `http://tco-backend:8080/api/CreditTypes (isActive)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/5478770201619904314
  * Node Name: `http://tco-backend:8080/api/CreditTypes/5478770201619904314`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id/
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard
  * Node Name: `http://tco-backend:8080/api/Dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/
  * Node Name: `http://tco-backend:8080/api/Dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/5200337674174828921
  * Node Name: `http://tco-backend:8080/api/Dashboard/5200337674174828921`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/stats
  * Node Name: `http://tco-backend:8080/api/Dashboard/stats`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/stats/
  * Node Name: `http://tco-backend:8080/api/Dashboard/stats/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/status-distribution
  * Node Name: `http://tco-backend:8080/api/Dashboard/status-distribution`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Dashboard/status-distribution/
  * Node Name: `http://tco-backend:8080/api/Dashboard/status-distribution/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services%3FisActive=http%253A%252F%252Fwww.google.com%252F
  * Node Name: `http://tco-backend:8080/api/Services (isActive)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/5269606097333388403
  * Node Name: `http://tco-backend:8080/api/Services/5269606097333388403`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id
  * Node Name: `http://tco-backend:8080/api/Services/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id/
  * Node Name: `http://tco-backend:8080/api/Services/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users
  * Node Name: `http://tco-backend:8080/api/Users`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users%3Fpage=%2523set%2528%2524engine%253D%2522%2522%2529%250A%2523set%2528%2524proc%253D%2524engine.getClass%2528%2529.forName%2528%2522java.lang.Runtime%2522%2529.getRuntime%2528%2529.exec%2528%2522sleep+15%2522%2529%2529%250A%2523set%2528%2524null%253D%2524proc.waitFor%2528%2529%2529%250A%2524%257Bnull%257D&pageSize=10&search=ZAP
  * Node Name: `http://tco-backend:8080/api/Users (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users%3Fpage=1&pageSize=10&search=ZAP
  * Node Name: `http://tco-backend:8080/api/Users (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/
  * Node Name: `http://tco-backend:8080/api/Users/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/6926437094370953129
  * Node Name: `http://tco-backend:8080/api/Users/6926437094370953129`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id
  * Node Name: `http://tco-backend:8080/api/Users/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id/
  * Node Name: `http://tco-backend:8080/api/Users/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/1706131796435177846
  * Node Name: `http://tco-backend:8080/swagger/1706131796435177846`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/v1
  * Node Name: `http://tco-backend:8080/swagger/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/v1/
  * Node Name: `http://tco-backend:8080/swagger/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/swagger/v1/6656667933515499779
  * Node Name: `http://tco-backend:8080/swagger/v1/6656667933515499779`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id/status
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id/status ()({status,adminNotes})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id/status/
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id/status/ ()({status,adminNotes})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/status
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/status ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/status/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/status/ ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/login
  * Node Name: `http://tco-backend:8080/api/Auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/login/
  * Node Name: `http://tco-backend:8080/api/Auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/register
  * Node Name: `http://tco-backend:8080/api/Auth/register ()({email,password,fullName,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Auth/register/
  * Node Name: `http://tco-backend:8080/api/Auth/register/ ()({email,password,fullName,role})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages
  * Node Name: `http://tco-backend:8080/api/ContactMessages ()({name,email,subject,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests
  * Node Name: `http://tco-backend:8080/api/CreditRequests ()({fullName,identificationNumber,email,phone,address,employmentStatus,monthlySalary,yearsOfEmployment,creditType,useOfMoney,requestedAmount,termYears,interestRate,monthlyPayment,totalPayment,totalInterest})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/ ()({fullName,identificationNumber,email,phone,address,employmentStatus,monthlySalary,yearsOfEmployment,creditType,useOfMoney,requestedAmount,termYears,interestRate,monthlyPayment,totalPayment,totalInterest})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/approve
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/approve ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/approve/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/approve/ ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/reject
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/reject ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests/id/reject/
  * Node Name: `http://tco-backend:8080/api/CreditRequests/id/reject/ ()({status,remarks,approvedAmount,approvedTermMonths,newStatus})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes
  * Node Name: `http://tco-backend:8080/api/CreditTypes ()({name,description,baseInterestRate,minAmount,maxAmount,maxTermMonths,minTermMonths,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/
  * Node Name: `http://tco-backend:8080/api/CreditTypes/ ()({name,description,baseInterestRate,minAmount,maxAmount,maxTermMonths,minTermMonths,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services
  * Node Name: `http://tco-backend:8080/api/Services ()({title,description,icon,displayOrder,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/
  * Node Name: `http://tco-backend:8080/api/Services/ ()({title,description,icon,displayOrder,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users
  * Node Name: `http://tco-backend:8080/api/Users ()({email,password,fullName,role,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/
  * Node Name: `http://tco-backend:8080/api/Users/ ()({email,password,fullName,role,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/change-password
  * Node Name: `http://tco-backend:8080/api/Users/change-password ()({userId,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/change-password/
  * Node Name: `http://tco-backend:8080/api/Users/change-password/ ()({userId,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/computeMetadata/v1/
  * Node Name: `http://tco-backend:8080/computeMetadata/v1/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/latest/meta-data/
  * Node Name: `http://tco-backend:8080/latest/meta-data/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/metadata/instance
  * Node Name: `http://tco-backend:8080/metadata/instance ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/metadata/v1
  * Node Name: `http://tco-backend:8080/metadata/v1 ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/opc/v1/instance/
  * Node Name: `http://tco-backend:8080/opc/v1/instance/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/opc/v2/instance/
  * Node Name: `http://tco-backend:8080/opc/v2/instance/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/openstack/latest/meta_data.json
  * Node Name: `http://tco-backend:8080/openstack/latest/meta_data.json ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id ()({name,description,baseInterestRate,minAmount,maxAmount,maxTermMonths,minTermMonths,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes/id/
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id/ ()({name,description,baseInterestRate,minAmount,maxAmount,maxTermMonths,minTermMonths,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id
  * Node Name: `http://tco-backend:8080/api/Services/id ()({title,description,icon,displayOrder,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Services/id/
  * Node Name: `http://tco-backend:8080/api/Services/id/ ()({title,description,icon,displayOrder,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id
  * Node Name: `http://tco-backend:8080/api/Users/id ()({fullName,role,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/Users/id/
  * Node Name: `http://tco-backend:8080/api/Users/id/ ()({fullName,role,isActive})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``


Instances: 110

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://tco-backend:8080/api/Users
  * Node Name: `http://tco-backend:8080/api/Users ()({email,password,fullName,role,isActive})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`
* URL: http://tco-backend:8080/api/Users/change-password
  * Node Name: `http://tco-backend:8080/api/Users/change-password ()({userId,newPassword})`
  * Method: `POST`
  * Parameter: `userId`
  * Attack: ``
  * Evidence: `newPassword`
  * Other Info: `userParam=userId
userValue=John Doe
passwordParam=newPassword`
* URL: http://tco-backend:8080/api/Auth/login
  * Node Name: `http://tco-backend:8080/api/Auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 3

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://tco-backend:8080/api/Backup/generate
  * Node Name: `http://tco-backend:8080/api/Backup/generate`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/id
  * Node Name: `http://tco-backend:8080/api/ContactMessages/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/ContactMessages/stats
  * Node Name: `http://tco-backend:8080/api/ContactMessages/stats`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditRequests
  * Node Name: `http://tco-backend:8080/api/CreditRequests ()({fullName,identificationNumber,email,phone,address,employmentStatus,monthlySalary,yearsOfEmployment,creditType,useOfMoney,requestedAmount,termYears,interestRate,monthlyPayment,totalPayment,totalInterest})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://tco-backend:8080/api/CreditTypes
  * Node Name: `http://tco-backend:8080/api/CreditTypes ()({name,description,baseInterestRate,minAmount,maxAmount,maxTermMonths,minTermMonths,isActive})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3

### [ Storable and Cacheable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are storable by caching components such as proxy servers, and may be retrieved directly from the cache, rather than from the origin server by the caching servers, in response to similar requests from other users. If the response data is sensitive, personal or user-specific, this may result in sensitive information being leaked. In some cases, this may even result in a user gaining complete control of the session of another user, depending on the configuration of the caching components in use in their environment. This is primarily an issue where "shared" caching servers such as "proxy" caches are configured on the local network. This configuration is typically found in corporate or educational environments, for instance.

* URL: http://tco-backend:8080/api/CreditTypes%3FisActive=true
  * Node Name: `http://tco-backend:8080/api/CreditTypes (isActive)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://tco-backend:8080/api/CreditTypes/id
  * Node Name: `http://tco-backend:8080/api/CreditTypes/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://tco-backend:8080/api/Health
  * Node Name: `http://tco-backend:8080/api/Health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://tco-backend:8080/api/Services%3FisActive=true
  * Node Name: `http://tco-backend:8080/api/Services (isActive)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`
* URL: http://tco-backend:8080/api/Services/id
  * Node Name: `http://tco-backend:8080/api/Services/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: ``
  * Other Info: `In the absence of an explicitly specified caching lifetime directive in the response, a liberal lifetime heuristic of 1 year was assumed. This is permitted by rfc7234.`

Instances: Systemic


### Solution

Validate that the response does not contain sensitive, personal or user-specific information. If it does, consider the use of the following HTTP response headers, to limit, or prevent the content being stored and retrieved from the cache by another user:
Cache-Control: no-cache, no-store, must-revalidate, private
Pragma: no-cache
Expires: 0
This configuration directs both HTTP 1.0 and HTTP 1.1 compliant caching servers to not store the response, and to not retrieve the response (without validation) from the cache, in response to a similar request.

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


