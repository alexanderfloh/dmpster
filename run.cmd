@echo off
cmd /c kill.cmd

play -Dhttp.port=80 -Dfile.separator=\/ -Dconfig.resource=prod.conf start
