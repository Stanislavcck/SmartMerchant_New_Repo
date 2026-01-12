@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Vagrant Cleanup Script
echo ========================================
echo.

REM Check if vagrant is available
where vagrant >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: vagrant command not found. Please install Vagrant.
    exit /b 1
)

echo Step 1: Stopping all running VMs...
vagrant halt 2>nul
if %ERRORLEVEL% EQU 0 (
    echo VMs stopped successfully.
) else (
    echo No running VMs or error stopping VMs.
)
echo.

echo Step 2: Destroying all VMs...
vagrant destroy -f 2>nul
if %ERRORLEVEL% EQU 0 (
    echo VMs destroyed successfully.
) else (
    echo No VMs to destroy or error destroying VMs.
)
echo.

echo Step 3: Cleaning up Vagrant processes...
REM Kill any stuck Vagrant/Ruby processes
taskkill /F /IM vagrant.exe >nul 2>&1
taskkill /F /IM ruby.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Killed stuck Vagrant/Ruby processes.
) else (
    echo No stuck processes found.
)
echo.

echo Step 4: Removing lock files...
dir .vagrant >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo Removing .vagrant directory
    rmdir /s /q .vagrant 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo .vagrant directory removed
    ) else (
        echo Could not remove .vagrant directory (may be in use)
    )
) else (
    echo No .vagrant directory found
)
echo.



echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo To verify cleanup:
echo   vagrant status
echo   vagrant global-status
echo
