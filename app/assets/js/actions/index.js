define(['fetch'], function(fetch__unused) {
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }

  const Actions = {
    loadBuckets: buckets => {
      return {
        type: 'LOAD_BUCKETS',
        buckets
      };
    },

    updateBucket: bucket => {
      return {
        type: 'UPDATE_BUCKET',
        bucket,
      };
    },

    addAnalysis: fileName => {
      return {
        type: 'ADD_ANALYSIS',
        fileName
      };
    },

    loadAnalyzing: fileNames => {
      return {
        type: 'LOAD_ANALYZING',
        fileNames
      };
    },

    loadDumps: dumps => {
      return {
        type: 'LOAD_DUMPS',
        dumps
      };
    },

    updateDump: dump => {
      return {
        type: 'UPDATE_DUMP',
        dump,
      };
    },

    postAddTag: (containerType, id, tagName, url) => {
      return {
        type: 'POST_ADD_TAG',
        containerType,
        id,
        tagName,
        url,
        status: 'pending',
      };
    },

    postAddTagSuccess: (containerType, id, tagName, url) => {
      return {
        type: 'POST_ADD_TAG',
        containerType,
        id,
        tagName,
        url,
        status: 'success',
      };
    },

    createAddTagFunction: (containerType, id, tagName, url) => {
      return function(dispatch) {
        dispatch(Actions.postAddTag(containerType, id, tagName, url));
        return fetch(url + encodeURIComponent(tagName), {
          method: 'POST',
        })
          .then(checkStatus)
          .then(response => dispatch(Actions.postAddTagSuccess(containerType, id, tagName, url)));
      };
    },

    addTagToBucket: (id, tagName, url) => Actions.createAddTagFunction('bucket', id, tagName, url),

    addTagToDump: (id, tagName, url) => Actions.createAddTagFunction('dump', id, tagName, url),

    postRemoveTag: (containerType, id, tagName, url) => {
      return {
        type: 'POST_REMOVE_TAG',
        containerType,
        id,
        tagName,
        url,
        status: 'pending',
      };
    },

    postRemoveTagSuccess: (containerType, id, tagName, url) => {
      return {
        type: 'POST_REMOVE_TAG',
        containerType,
        id,
        tagName,
        url,
        status: 'success',
      };
    },

    createRemoveTagFunction: (containerType, id, tagName, url) => {
      return function(dispatch) {
        dispatch(Actions.postRemoveTag(containerType, id, tagName, url));
        return fetch(url + encodeURIComponent(tagName), {
          method: 'POST',
        })
          .then(checkStatus)
          .then(response => dispatch(Actions.postRemoveTagSuccess(containerType, id, tagName, url)));
      };
    },

    removeTagFromBucket: (id, tagName, url) => Actions.createRemoveTagFunction('bucket', id, tagName, url),
    removeTagFromDump: (id, tagName, url) => Actions.createRemoveTagFunction('dump', id, tagName, url),

    postSetNotes: (id, notes) => {
      return {
        type: 'POST_SET_NOTES',
        id,
        notes,
        status: 'pending',
      };
    },

    postSetNotesSuccess: (id, notes) => {
      return {
        type: 'POST_SET_NOTES',
        id,
        notes,
        status: 'success',
      };
    },

    setNotes: (id, notes) => {
      return function(dispatch) {
        dispatch(Actions.postSetNotes(id, notes));
        
        return fetch('/dmpster/bucket/' + id + '/updateNotes', {
          method: 'POST',
          body: notes,
        })
          .then(checkStatus)
          .then(response => dispatch(Actions.postSetNotesSuccess(id, notes)));
      };
    },

    fileUpload: (filename, progress) => {
      return {
        type: 'FILE_UPLOAD',
        filename,
        progress,
      };
    },

    startLoadingOlderDumps: () => {
      return {
        type: 'START_LOADING_OLDER_DUMPS',
      };
    },

    finishLoadingOlderDumps: () => {
      return {
        type: 'FINISH_LOADING_OLDER_DUMPS',
      };
    },

    loadOlderDumps: () => {
      return function(dispatch) {
        dispatch(Actions.startLoadingOlderDumps());

        return fetch("dmpster/buckets.json")
          .then(checkStatus)
          .then(response => response.json())
          .then(json => {
            dispatch(Actions.loadDumps(json.dumps));
            dispatch(Actions.loadBuckets(json.buckets)); 
            dispatch(Actions.finishLoadingOlderDumps());
          });
      };
    },

  };
  return Actions;
});