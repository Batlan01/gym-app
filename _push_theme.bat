@echo off
cd /d D:\gym-webapp\gym-webapp
git add -A
if %errorlevel% neq 0 (
  echo GIT ADD FAILED
  echo Trying to create test lock file...
  type nul > .git\index.lock
  if %errorlevel% neq 0 (
    echo CANNOT CREATE LOCK FILE
  ) else (
    del .git\index.lock
    echo Lock file creation works manually
    git add -A
  )
)
git status --short
