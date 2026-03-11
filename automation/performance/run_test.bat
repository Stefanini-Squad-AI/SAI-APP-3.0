@echo off
setlocal enabledelayedexpansion

REM Verify required arguments
if "%3"=="" (
    echo ================================================
    echo   K6 Performance Testing Framework
    echo ================================================
    echo.
    echo Usage: run_test.bat ^<TEST_NAME^> ^<TEST_TYPE^> ^<REPORT_MODE^>
    echo.
    echo Parameters:
    echo   TEST_NAME    : Test name ^(e.g., demo_ticketlog^)
    echo   TEST_TYPE    : PERFORMANCE ^| LOAD ^| STRESS
    echo   REPORT_MODE  : TRADITIONAL ^| REALTIME
    echo.
    echo Examples:
    echo   run_test.bat demo_ticketlog PERFORMANCE TRADITIONAL
    echo   run_test.bat demo_ticketlog LOAD REALTIME
    echo   run_test.bat demo_ticketlog STRESS TRADITIONAL
    echo.
    exit /b 1
)

set testName=%1
set testType=%2
set reportMode=%3

REM Convert to uppercase
for %%i in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    set testType=!testType:%%i=%%i!
    set reportMode=!reportMode:%%i=%%i!
)

REM Validate test type
if not "%testType%"=="PERFORMANCE" if not "%testType%"=="LOAD" if not "%testType%"=="STRESS" (
    echo Error: Invalid test type. Use: PERFORMANCE, LOAD or STRESS
    exit /b 1
)

REM Validate report mode
if not "%reportMode%"=="TRADITIONAL" if not "%reportMode%"=="REALTIME" (
    echo Error: Invalid report mode. Use: TRADITIONAL or REALTIME
    exit /b 1
)

echo ================================================
echo   Starting %testType% Test
echo ================================================
echo Test: %testName%
echo Type: %testType%
echo Mode: %reportMode%
echo ================================================
echo.

REM Get current date
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)

set currentDate=%mydate%
set reportsBaseDir=reports\%currentDate%

REM Create base reports directory if it doesn't exist
if not exist %reportsBaseDir% mkdir %reportsBaseDir%

REM Find next available version number
set nextVersion=1
:find_next_version
if exist "%reportsBaseDir%\%testName%_v%nextVersion%" (
    set /a nextVersion+=1
    goto find_next_version
)

REM Both JSON and HTML reports will be in the same versioned folder
set reportResultDir=%reportsBaseDir%\%testName%_v%nextVersion%
set resultDir=%reportResultDir%

REM Create the directory
mkdir "%reportResultDir%"

echo Results directory: %reportResultDir%
echo.

REM Run k6 test
if "%reportMode%"=="REALTIME" (
    echo Running with Web Dashboard ^(REALTIME Mode^)...
    set K6_WEB_DASHBOARD=true
    set K6_WEB_DASHBOARD_EXPORT=%reportResultDir%\realtime-report.html
    k6 run scripts\test-%testName%.js --out json=%reportResultDir%\%testType%-%testName%.json -e TEST_NAME=%testName% -e RESULT_DIR=%reportResultDir% -e REPORT_RESULT_DIR=%reportResultDir% -e TEST_TYPE=%testType% -e REPORT_MODE=%reportMode%
) else (
    echo Running with Custom Report ^(TRADITIONAL Mode^)...
    k6 run scripts\test-%testName%.js --out json=%reportResultDir%\%testType%-%testName%.json -e TEST_NAME=%testName% -e RESULT_DIR=%reportResultDir% -e REPORT_RESULT_DIR=%reportResultDir% -e TEST_TYPE=%testType% -e REPORT_MODE=%reportMode%
)

echo.
echo ================================================
echo   Test completed
echo ================================================
echo Results directory: %reportResultDir%
echo - HTML Report: %reportResultDir%\%testType%-test-*-%testName%.html
echo - JSON Results: %reportResultDir%\%testType%-%testName%.json
echo ================================================

endlocal
