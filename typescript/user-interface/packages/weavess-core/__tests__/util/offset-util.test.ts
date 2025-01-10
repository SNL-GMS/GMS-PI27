import type { Station } from '../../src/ts/types';
import { calculateMinMaxOffsets } from '../../src/ts/util';

describe('WEAVESS Core: Offset Util', () => {
  it('has the calculateMinMaxOffsets function defined', () => {
    expect(calculateMinMaxOffsets).toBeDefined();
  });

  it('can handle an empty array without throwing', () => {
    expect(calculateMinMaxOffsets([])).toMatchObject({ maxOffset: 0, minOffset: 0 });
  });

  it('can handle WeavessStations without offsets', () => {
    const station1: Station = {
      id: 'station1',
      name: 'first station',
      defaultChannel: {
        id: 'id1',
        name: 'default.channel.name',
        isSelected: false
      },
      nonDefaultChannels: [
        {
          id: 'id2',
          name: 'non.default.channel',
          isSelected: false
        }
      ]
    };
    const station2 = {
      ...station1,
      id: 'station2',
      name: 'second station',
      defaultChannel: {
        ...station1.defaultChannel
      }
    };
    const stations = [station1, station2];
    expect(calculateMinMaxOffsets(stations)).toMatchObject({
      maxOffset: 0,
      minOffset: 0
    });
  });
  it('can handle WeavessStations without offsets that are mixed in with WeavessStations that have offsets', () => {
    const station1: Station = {
      id: 'station1',
      name: 'first station',
      defaultChannel: {
        id: 'id1',
        name: 'default.channel.name',
        isSelected: false
      },
      nonDefaultChannels: [
        {
          id: 'id2',
          name: 'non.default.channel',
          timeOffsetSeconds: 50,
          isSelected: false
        }
      ]
    };
    const station2 = {
      ...station1,
      id: 'station2',
      name: 'second station',
      defaultChannel: {
        ...station1.defaultChannel
      }
    };
    const stations = [station1, station2];
    expect(calculateMinMaxOffsets(stations)).toMatchObject({
      maxOffset: 50,
      minOffset: 0
    });
  });

  it('gets the expected output when given WeavessStations', () => {
    const station1: Station = {
      id: 'station1',
      name: 'first station',
      defaultChannel: {
        id: 'id1',
        name: 'default.channel.name',
        timeOffsetSeconds: 100,
        isSelected: false
      },
      nonDefaultChannels: [
        {
          id: 'id2',
          name: 'non.default.channel',
          timeOffsetSeconds: 200,
          isSelected: false
        }
      ]
    };
    const station2 = {
      ...station1,
      id: 'station2',
      name: 'second station',
      defaultChannel: {
        ...station1.defaultChannel,
        timeOffsetSeconds: 0
      }
    };
    const stations = [station1, station2];
    expect(calculateMinMaxOffsets(stations)).toMatchObject({
      maxOffset: 200,
      minOffset: 0
    });
  });

  it('gets the expected output when given WeavessStations with negative offsets', () => {
    const station1: Station = {
      id: 'station1',
      name: 'first station',
      defaultChannel: {
        id: 'id1',
        name: 'default.channel.name',
        timeOffsetSeconds: -100,
        isSelected: false
      },
      nonDefaultChannels: [
        {
          id: 'id2',
          name: 'non.default.channel',
          timeOffsetSeconds: -200,
          isSelected: false
        }
      ]
    };
    const station2 = {
      ...station1,
      id: 'station2',
      name: 'second station',
      defaultChannel: {
        ...station1.defaultChannel,
        timeOffsetSeconds: 0
      }
    };
    const stations = [station1, station2];
    expect(calculateMinMaxOffsets(stations)).toMatchObject({
      maxOffset: 0,
      minOffset: -200
    });
  });
});
