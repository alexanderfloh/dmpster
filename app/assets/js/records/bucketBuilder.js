define(['immutable', './bucket', './tagging', './dump', './tag'], function(Immutable, BucketRecord, TaggingRecord, DumpRecord, TagRecord) {
  return bucket => new BucketRecord(Object.assign({}, bucket, {
    hits: Immutable.OrderedMap(bucket.hits),
    dumps: Immutable.List(bucket.dumps),
    tagging: new TaggingRecord(Object.assign({}, bucket.tagging, {
      tags: Immutable.OrderedSet(bucket.tagging.tags).map(tag => new TagRecord(tag))
    })),
  }));
});