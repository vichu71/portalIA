@echo off
cd /d C:\Users\vmhuecas\question\question-backoffice
flutter run -d edge --dart-define=API_URL=http://localhost:8083 --dart-define=BUILDER_URL=http://localhost:8100 --dart-define=RUNNER_URL=http://localhost:8101/backoffice