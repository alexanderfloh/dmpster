define(['immutable'], function(Immutable) {
  const TaggingRecord = Immutable.Record({
    addTagUrl: '',
    removeTagUrl: '',
    tags: Immutable.OrderedSet()
  });
  return TaggingRecord;
});