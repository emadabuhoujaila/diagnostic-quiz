@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

rem Deploys The Orrery to Cloud Run after: gcloud auth login
rem Project orrery-tutor. Service region me-central1, or europe-west1 if Doha is unavailable.
rem The image is built in that region with a regional log bucket. A source deploy in Doha
rem failed with an empty log because Cloud Build stored the build outside the region.
rem GEMINI_API_KEY is read when this script runs, stored in Secret Manager, and never written into git.
rem Cloud Run disk does not keep the lesson. The lesson object is gs://orrery-tutor-lessons/lesson.json

set PROJECT=orrery-tutor
set SERVICE=orrery
set REGION=me-central1
set FALLBACK=europe-west1
set BUCKET=orrery-tutor-lessons
set SECRET=gemini-api-key
set RUN_SA=orrery-run@%PROJECT%.iam.gserviceaccount.com
set REPO=orrery
set KEYFILE=%TEMP%\orrery-gemini-key.txt

where gcloud >nul 2>&1
if errorlevel 1 (
  echo Install the Google Cloud SDK, then run gcloud auth login.
  exit /b 1
)

call gcloud auth list --filter=status:ACTIVE --format="value(account)" > "%TEMP%\orrery-account.txt"
set /p ACCOUNT=<"%TEMP%\orrery-account.txt"
if not defined ACCOUNT (
  echo Run gcloud auth login first.
  exit /b 1
)

call gcloud projects describe %PROJECT% >nul 2>&1
if errorlevel 1 (
  echo Project %PROJECT% was not found. Create it, attach billing, then run deploy.cmd again.
  exit /b 1
)

call gcloud config set project %PROJECT%
if errorlevel 1 exit /b 1

echo Enabling Cloud Run, Cloud Build, Artifact Registry, Secret Manager, and Cloud Storage.
call gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com storage.googleapis.com
if errorlevel 1 exit /b 1

call gcloud run regions list --format="value(locationId)" > "%TEMP%\orrery-regions.txt"
if errorlevel 1 (
  echo Could not list Cloud Run regions. Trying me-central1.
) else (
  findstr /x /c:"me-central1" "%TEMP%\orrery-regions.txt" >nul
  if errorlevel 1 (
    echo Cloud Run does not list me-central1. Using europe-west1.
    set REGION=%FALLBACK%
  )
)
echo Deploying to !REGION!.

if not defined GEMINI_API_KEY goto promptkey
powershell -NoProfile -Command "if ([string]::IsNullOrWhiteSpace($env:GEMINI_API_KEY)) { exit 1 }; [System.IO.File]::WriteAllText($env:KEYFILE, $env:GEMINI_API_KEY.Trim())"
if errorlevel 1 goto keyfail
set "GEMINI_API_KEY="
goto keyready

:promptkey
echo Paste GEMINI_API_KEY. It is stored in Secret Manager and is not saved in the repo.
powershell -NoProfile -Command "$k = Read-Host 'GEMINI_API_KEY'; if ([string]::IsNullOrWhiteSpace($k)) { exit 1 }; [System.IO.File]::WriteAllText($env:KEYFILE, $k.Trim())"
if errorlevel 1 goto keyfail

:keyready
for %%A in ("%KEYFILE%") do if %%~zA==0 goto keyfail

call gcloud secrets describe %SECRET% >nul 2>&1
if errorlevel 1 (
  call gcloud secrets create %SECRET% --data-file="%KEYFILE%" --replication-policy=automatic
) else (
  call gcloud secrets versions add %SECRET% --data-file="%KEYFILE%"
)
set SECRET_ERR=%ERRORLEVEL%
del /f /q "%KEYFILE%" 2>nul
if not "%SECRET_ERR%"=="0" exit /b 1

call gcloud iam service-accounts describe %RUN_SA% >nul 2>&1
if errorlevel 1 (
  call gcloud iam service-accounts create orrery-run --display-name="Orrery tutor"
  if errorlevel 1 exit /b 1
)

call gcloud secrets add-iam-policy-binding %SECRET% --member=serviceAccount:%RUN_SA% --role=roles/secretmanager.secretAccessor --quiet
if errorlevel 1 exit /b 1

call gcloud storage buckets describe gs://%BUCKET% >nul 2>&1
if errorlevel 1 (
  call gcloud storage buckets create gs://%BUCKET% --location=!REGION! --uniform-bucket-level-access --project=%PROJECT%
  if errorlevel 1 exit /b 1
)
call gcloud storage buckets add-iam-policy-binding gs://%BUCKET% --member=serviceAccount:%RUN_SA% --role=roles/storage.objectAdmin --quiet
if errorlevel 1 exit /b 1

call gcloud projects describe %PROJECT% --format="value(projectNumber)" > "%TEMP%\orrery-project-number.txt"
if errorlevel 1 exit /b 1
set /p PROJECT_NUMBER=<"%TEMP%\orrery-project-number.txt"
if not defined PROJECT_NUMBER exit /b 1
set COMPUTE_SA=!PROJECT_NUMBER!-compute@developer.gserviceaccount.com
set CLOUDBUILD_SA=!PROJECT_NUMBER!@cloudbuild.gserviceaccount.com

set NEED_WAIT=0
call gcloud projects get-iam-policy %PROJECT% --flatten="bindings[].members" --filter="bindings.role=roles/cloudbuild.builds.builder" --format="value(bindings.members)" > "%TEMP%\orrery-builder.txt"
findstr /i /c:"!COMPUTE_SA!" "%TEMP%\orrery-builder.txt" >nul
if errorlevel 1 set NEED_WAIT=1

echo Granting Cloud Build permission to write logs and push the image.
set BIND_OK=0
call :bind roles/cloudbuild.builds.builder !COMPUTE_SA!
call :bind roles/artifactregistry.writer !COMPUTE_SA!
call :bind roles/logging.logWriter !COMPUTE_SA!
call :bind roles/cloudbuild.builds.builder !CLOUDBUILD_SA!
call :bind roles/artifactregistry.writer !CLOUDBUILD_SA!
call :bind roles/logging.logWriter !CLOUDBUILD_SA!
if "!BIND_OK!"=="0" (
  echo Could not grant Cloud Build permission.
  exit /b 1
)
call gcloud iam service-accounts add-iam-policy-binding %RUN_SA% --member=serviceAccount:!COMPUTE_SA! --role=roles/iam.serviceAccountUser --quiet
call gcloud iam service-accounts add-iam-policy-binding %RUN_SA% --member=serviceAccount:!CLOUDBUILD_SA! --role=roles/iam.serviceAccountUser --quiet
if "!NEED_WAIT!"=="1" (
  echo Waiting two minutes for Cloud Build permissions to propagate.
  ping -n 121 127.0.0.1 >nul
)

echo Lessons persist in gs://%BUCKET%/lesson.json
echo Building in !REGION! with build logs stored in that region.
call :ensure_repo !REGION!
if errorlevel 1 exit /b 1
set IMAGE_REGION=!REGION!
set IMAGE=!IMAGE_REGION!-docker.pkg.dev/%PROJECT%/%REPO%/tutor
call gcloud builds submit --project %PROJECT% --region !IMAGE_REGION! --default-buckets-behavior=regional-user-owned-bucket --config cloudbuild.yaml --substitutions=_IMAGE=!IMAGE! --timeout=20m .
if not errorlevel 1 goto built
if /i "!REGION!"=="%FALLBACK%" exit /b 1
echo The !REGION! build failed. Building in %FALLBACK% instead.
call :ensure_repo %FALLBACK%
if errorlevel 1 exit /b 1
set IMAGE_REGION=%FALLBACK%
set IMAGE=!IMAGE_REGION!-docker.pkg.dev/%PROJECT%/%REPO%/tutor
call gcloud builds submit --project %PROJECT% --region !IMAGE_REGION! --default-buckets-behavior=regional-user-owned-bucket --config cloudbuild.yaml --substitutions=_IMAGE=!IMAGE! --timeout=20m .
if errorlevel 1 exit /b 1

:built
call gcloud artifacts repositories add-iam-policy-binding %REPO% --location=!IMAGE_REGION! --project=%PROJECT% --member=serviceAccount:%RUN_SA% --role=roles/artifactregistry.reader --quiet
call gcloud artifacts repositories add-iam-policy-binding %REPO% --location=!IMAGE_REGION! --project=%PROJECT% --member=serviceAccount:service-!PROJECT_NUMBER!@serverless-robot-prod.iam.gserviceaccount.com --role=roles/artifactregistry.reader --quiet
call gcloud run deploy %SERVICE% --image !IMAGE!:latest --project %PROJECT% --region !REGION! --service-account %RUN_SA% --allow-unauthenticated --quiet --memory 2Gi --cpu 1 --timeout 300 --concurrency 4 --max-instances 3 --port 8080 --set-secrets=GEMINI_API_KEY=%SECRET%:latest --set-env-vars=LESSON_BUCKET=%BUCKET%
if errorlevel 1 exit /b 1

echo Student URL:
call gcloud run services describe %SERVICE% --project %PROJECT% --region !REGION! --format="value(status.url)"
exit /b 0

:keyfail
del /f /q "%KEYFILE%" 2>nul
set "GEMINI_API_KEY="
echo A Gemini key is required. Set GEMINI_API_KEY or type it when asked. It is not saved in the repo.
exit /b 1

:bind
call gcloud projects add-iam-policy-binding %PROJECT% --member=serviceAccount:%~2 --role=%~1 --quiet
if not errorlevel 1 set BIND_OK=1
exit /b 0

:ensure_repo
call gcloud artifacts repositories describe %REPO% --location=%~1 --project=%PROJECT% >nul 2>&1
if not errorlevel 1 exit /b 0
call gcloud artifacts repositories create %REPO% --repository-format=docker --location=%~1 --project=%PROJECT% --description="Orrery tutor images"
exit /b !ERRORLEVEL!
