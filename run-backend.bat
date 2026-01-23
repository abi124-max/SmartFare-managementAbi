@echo off
echo Starting Smart Fare Backend...
cd backend
if exist mvnw.cmd (
    echo Using Maven wrapper...
    mvnw.cmd spring-boot:run
) else (
    echo Maven wrapper not found. Trying to compile and run manually...
    javac -cp "src/main/java" src/main/java/com/smartfare/SmartFareApplication.java
    java -cp "src/main/java" com.smartfare.SmartFareApplication
)
pause