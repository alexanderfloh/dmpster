#dmpster#
![dmpster screenshot](dmpster.png)
_dmpster_ is a simple web app for storing `.dmp`-files.
It also does an automated analysis of the `.dmp`-file (`!analyze -v`) to give you a quick overview what happend.

#Features#
* Easy file upload via drag and drop.
* Automated analysis of uploaded `.dmp`-files.
* Automatically loads .NET access DLL in the correct version.
* Detects if it needs to use 32- or 64-bit version, depending on the `.dmp`-file.
* Organize your `.dmp`-files by tagging them.
* Permanent links to share via e-mail or instant messaging.
* File upload can be automated.

#Installation#
* `choco install jdk8` - Install Java
* `choco install windbg` - Install Debugging Tools for Windows
* `choco install Play` - Install play framework
* Check out the dmpster source in a local directory
* adapt `conf/application.conf` and `conf/prod.conf` if necessary.
* run `activator clean stage` to build for local production mode
* prepare environment with `SET JAVA_OPTS=-Dconfig.file=conf/prod.conf -Dhttp.port=80`
* run `target\universal\stage\bin\dmpster.bat`
* Done!
