define(['immutable', './dump', './tagging', './tag'], function(Immutable, DumpRecord, TaggingRecord, TagRecord) {
  const DumpBuilder = dump => new DumpRecord(Object.assign({}, dump, {
    tagging: new TaggingRecord(Object.assign({}, dump.tagging, {
      tags: new Immutable.OrderedSet(dump.tagging.tags).map(tag => new TagRecord(tag)),
    })),
  }));
  return DumpBuilder;
});