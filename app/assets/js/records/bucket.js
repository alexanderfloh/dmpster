define(['immutable', 'tagging'], function(Immutable, TaggingRecord){
  const BucketRecord = Immutable.Record({
    id: '',
    name: '',
    notes: '',
    url: '',
    hits: Immutable.OrderedMap(),
    dumps: Immutable.List(),
    tagging: new TaggingRecord(),
  });
  return BucketRecord;
});