define(['immutable', 'tagging'], function(Immutable, TaggingRecord) {
  const DumpRecord = Immutable.Record({
    id: '',
    isNew: false,
    ageLabel: '',
    dmpUrl: '',
    filename: '',
    tagging: new TaggingRecord(),
  });
  return DumpRecord;
});