@echo off
setlocal enabledelayedexpansion

REM Get the script's directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Change to script's directory
cd /d "%SCRIPT_DIR%"
if errorlevel 1 (
    echo Error: Could not change to script directory: %SCRIPT_DIR%
    pause
    exit /b 1
)

echo ========================================
echo   SmartMerchant Cleanup Script
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Stop dotnet processes that might lock files
echo Stopping dotnet processes...
taskkill /F /IM dotnet.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   Stopped dotnet processes
    timeout /t 2 /nobreak >nul
) else (
    echo   No dotnet processes found
)
echo.

REM Verify we're in the right directory
if not exist "SmartMerchant.sln" (
    echo Warning: SmartMerchant.sln not found in current directory.
    echo Current directory: %CD%
    echo Expected directory: %SCRIPT_DIR%
    echo.
)

REM Find obj directories first
echo Searching for obj directories...
set OBJ_COUNT=0
set OBJ_LIST=
for /f "delims=" %%d in ('dir /s /b /ad "%CD%\obj" 2^>nul') do (
    if exist "%%d" (
        set /a OBJ_COUNT+=1
        set "OBJ_LIST=!OBJ_LIST!%%d "
        echo   Found: %%d
    )
)

if !OBJ_COUNT! EQU 0 (
    echo   No obj directories found.
) else (
    echo   Found !OBJ_COUNT! obj directory(ies)
    echo.
    echo Removing obj directories...
    for /f "delims=" %%d in ('dir /s /b /ad "%CD%\obj" 2^>nul') do (
        if exist "%%d" (
            echo   Removing: %%d
            rd /s /q "%%d" 2>nul
            if !ERRORLEVEL! NEQ 0 (
                echo     Warning: Failed to remove: %%d
            ) else (
                echo     Removed: %%d
            )
        )
    )
)
echo.

REM Find bin directories first
echo Searching for bin directories...
set BIN_COUNT=0
set BIN_LIST=
for /f "delims=" %%d in ('dir /s /b /ad "%CD%\bin" 2^>nul') do (
    if exist "%%d" (
        set /a BIN_COUNT+=1
        set "BIN_LIST=!BIN_LIST!%%d "
        echo   Found: %%d
    )
)

if !BIN_COUNT! EQU 0 (
    echo   No bin directories found.
) else (
    echo   Found !BIN_COUNT! bin directory(ies)
    echo.
    echo Removing bin directories...
    for /f "delims=" %%d in ('dir /s /b /ad "%CD%\bin" 2^>nul') do (
        if exist "%%d" (
            echo   Removing: %%d
            rd /s /q "%%d" 2>nul
            if !ERRORLEVEL! NEQ 0 (
                echo     Warning: Failed to remove: %%d
            ) else (
                echo     Removed: %%d
            )
        )
    )
)
echo.

REM Count remaining directories
set REMAINING=0
for /f "delims=" %%d in ('dir /s /b /ad "%CD%\obj" 2^>nul') do (
    if exist "%%d" (
        set /a REMAINING+=1
    )
)
for /f "delims=" %%d in ('dir /s /b /ad "%CD%\bin" 2^>nul') do (
    if exist "%%d" (
        set /a REMAINING+=1
    )
)

echo ========================================
echo   Cleanup Summary
echo ========================================
echo Removed obj directories: !OBJ_COUNT!
echo Removed bin directories: !BIN_COUNT!
echo.

if !REMAINING! GTR 0 (
    echo Warning: !REMAINING! directory^(ies^) could not be removed.
    echo These may be locked by running applications.
    echo Please close Visual Studio and other IDEs, then run this script again.
    echo.
) else (
    echo All obj and bin directories removed successfully!
    echo.
)

pause
