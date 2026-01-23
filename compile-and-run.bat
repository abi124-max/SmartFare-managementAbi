@echo off
echo Downloading Maven...
curl -o maven.zip https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip
echo Extracting Maven...
powershell -command "Expand-Archive -Path maven.zip -DestinationPath . -Force"
set MAVEN_HOME=%CD%\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

echo Building and running Smart Fare Backend...
cd backend
mvn clean spring-boot:run
pause