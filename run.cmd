@echo off
cmd /c kill.cmd
SET JAVA_OPTS=-Dconfig.file=conf/prod.conf -Dhttp.port=9000
activator start
