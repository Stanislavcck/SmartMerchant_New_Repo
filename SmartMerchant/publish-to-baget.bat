@echo off
setlocal enabledelayedexpansion

REM Configuration
set BAGET_URL=http://localhost:5555/v3/index.json
set BAGET_API_KEY=supersecret123
set PROJECT_PATH=SmartMerchant.WEB\SmartMerchant.WEB.csproj
set OUTPUT_DIR=.\packages

echo.
echo ========================================
echo   SmartMerchant.WEB NuGet Publisher
echo ========================================
echo.

REM Check if dotnet is available
where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: dotnet CLI not found. Please install .NET SDK.
    exit /b 1
)

REM Check if project file exists
if not exist "%PROJECT_PATH%" (
    echo Error: Project file not found: %PROJECT_PATH%
    exit /b 1
)

REM Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

echo Step 1: Building and packing project...
echo.

REM Clean previous builds
dotnet clean "%PROJECT_PATH%" --configuration Release >nul 2>&1

REM Build the project first
echo Building project...
set NUGET_ALLOW_INSECURE_CONNECTIONS=true
dotnet build "%PROJECT_PATH%" --configuration Release --verbosity minimal
if errorlevel 1 (
    echo Error: Build failed.
    exit /b 1
)

REM Publish the project first (framework-dependent deployment with all dependencies)
echo Publishing project with all dependencies...
set PUBLISH_DIR=%OUTPUT_DIR%\publish
if exist "%PUBLISH_DIR%" (
    rmdir /s /q "%PUBLISH_DIR%"
)
mkdir "%PUBLISH_DIR%"

REM Publish with all dependencies included
dotnet publish "%PROJECT_PATH%" --configuration Release --output "%PUBLISH_DIR%" --verbosity minimal
if errorlevel 1 (
    echo Error: Publish failed.
    exit /b 1
)

echo Published files to: %PUBLISH_DIR%
echo Published DLLs: 
dir /b "%PUBLISH_DIR%\*.dll" | find /c /v ""
echo.

REM Copy ENTIRE published folder to build output for packaging
echo Copying ENTIRE published folder structure for packaging...
set BUILD_OUTPUT=SmartMerchant.WEB\bin\Release\net9.0
set PACKAGE_LIB_DIR=%BUILD_OUTPUT%\lib\net9.0
set PACKAGE_CONTENT_DIR=%BUILD_OUTPUT%\content

REM Create directories
if not exist "%PACKAGE_LIB_DIR%" (
    mkdir "%PACKAGE_LIB_DIR%"
)
if not exist "%PACKAGE_CONTENT_DIR%" (
    mkdir "%PACKAGE_CONTENT_DIR%"
)

REM Create exclude file for DLLs and runtime files (they go to lib/net9.0, not content)
(
echo *.dll
echo *.deps.json
echo *.runtimeconfig.json
echo *.pdb
) > exclude.txt

REM Copy ALL DLLs, deps.json, runtimeconfig.json, and PDBs to lib/net9.0
echo Copying all DLLs and runtime files to lib/net9.0...
xcopy /Y /I "%PUBLISH_DIR%\*.dll" "%PACKAGE_LIB_DIR%\" >nul 2>&1
xcopy /Y /I "%PUBLISH_DIR%\*.deps.json" "%PACKAGE_LIB_DIR%\" >nul 2>&1
xcopy /Y /I "%PUBLISH_DIR%\*.runtimeconfig.json" "%PACKAGE_LIB_DIR%\" >nul 2>&1
xcopy /Y /I "%PUBLISH_DIR%\*.pdb" "%PACKAGE_LIB_DIR%\" >nul 2>&1

REM Copy ENTIRE published folder structure to content (everything EXCEPT DLLs and runtime files)
echo Copying ENTIRE published folder to content (wwwroot, Pages, Views, appsettings.json, etc.)...
xcopy /E /I /Y /EXCLUDE:exclude.txt "%PUBLISH_DIR%" "%PACKAGE_CONTENT_DIR%\" >nul 2>&1

REM Clean up exclude file
del exclude.txt >nul 2>&1

set DLL_COUNT=0
for %%f in ("%PACKAGE_LIB_DIR%\*.dll") do (
    set /a DLL_COUNT+=1
)

echo Copied %DLL_COUNT% DLLs to lib/net9.0
echo Copied entire published folder structure to content (wwwroot, Pages, Views, appsettings.json, etc.)

REM Pack the project - all DLLs are now in lib/net9.0
echo Packing project with all dependencies...
dotnet pack "%PROJECT_PATH%" --configuration Release --output "%OUTPUT_DIR%" --no-build --verbosity minimal
if errorlevel 1 (
    echo Error: Pack failed.
    exit /b 1
)

REM Verify the package includes all DLLs
echo Verifying package contents...
for %%f in ("%OUTPUT_DIR%\*.nupkg") do (
    set PACKAGE_FILE=%%f
    goto :found_package
)

:found_package
if defined PACKAGE_FILE (
    echo Package created: !PACKAGE_FILE!
    echo Package includes all dependencies and is ready to deploy.
    echo The package contains all DLLs needed to run: dotnet SmartMerchant.WEB.dll
) else (
    echo WARNING: Could not find package file
)
echo.

REM Find the generated .nupkg file
set PACKAGE_FILE=
for %%f in ("%OUTPUT_DIR%\*.nupkg") do (
    set PACKAGE_FILE=%%f
    goto :found
)

:found
if "!PACKAGE_FILE!"=="" (
    echo Error: No .nupkg file found in %OUTPUT_DIR%
    exit /b 1
)

echo Package created: !PACKAGE_FILE!
echo.

REM Ensure NuGet.Config exists with BaGet source and allowInsecureConnections
if not exist "NuGet.Config" (
    echo Creating NuGet.Config...
    (
        echo ^<?xml version="1.0" encoding="utf-8"?^>
        echo ^<configuration^>
        echo   ^<packageSources^>
        echo     ^<add key="nuget.org" value="https://api.nuget.org/v3/index.json" /^>
        echo     ^<add key="BaGet" value="%BAGET_URL%" allowInsecureConnections="true" /^>
        echo   ^</packageSources^>
        echo ^</configuration^>
    ) > NuGet.Config
) else (
    REM Check if BaGet source exists in NuGet.Config
    findstr /C:"BaGet" NuGet.Config >nul 2>&1
    if errorlevel 1 (
        echo Warning: BaGet source not found in NuGet.Config
        echo Please ensure NuGet.Config contains:
        echo   ^<add key="BaGet" value="%BAGET_URL%" allowInsecureConnections="true" /^>
    )
)

REM Check if BaGet is running (optional check)
echo Step 2: Preparing to publish...
echo Note: Make sure BaGet is running with: docker-compose up -d
echo.

echo Step 3: Publishing to BaGet...
echo URL: %BAGET_URL%
echo.

REM Set environment variable to allow insecure connections
set NUGET_ALLOW_INSECURE_CONNECTIONS=true

REM Publish to BaGet using NuGet.Config
dotnet nuget push "!PACKAGE_FILE!" --source "%BAGET_URL%" --api-key "%BAGET_API_KEY%" --skip-duplicate --configfile NuGet.Config
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to publish package to BaGet.
    echo Make sure:
    echo   1. BaGet is running: docker-compose up -d
    echo   2. BaGet is accessible at %BAGET_URL%
    echo   3. API key is correct: %BAGET_API_KEY%
    echo   4. NuGet.Config allows insecure connections
    exit /b 1
)

echo.
echo ========================================
echo   Package published successfully!
echo ========================================
echo.
echo Package: !PACKAGE_FILE!
echo BaGet URL: %BAGET_URL%
echo Browse packages: http://localhost:5555/
echo.
echo To use this package source, add to NuGet.config:
echo   ^<add key="BaGet" value="%BAGET_URL%" /^>
echo.

endlocal
