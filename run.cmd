@echo off
cmd /c kill.cmd

activator start -Dconfig.resource=prod.conf -Dhttp.port=80
