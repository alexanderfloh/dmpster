define(['redux', './analyzing', './buckets', './dumps', './uploader', './loadOlderDumps'], 
function(Redux, Analyzing, Buckets, Dumps, Uploader, LoadOlderDumps) {
  return Redux.combineReducers({
    Analyzing,
    Buckets,
    Dumps,
    Uploader,
    LoadOlderDumps,
  });
});