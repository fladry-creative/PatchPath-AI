/**
 * Mock ModularGrid data for testing
 */

import { type ParsedRack } from '@/types/rack';

export const MOCK_RACK: ParsedRack = {
  url: 'https://modulargrid.net/e/racks/view/2383104',
  modules: [
    // Oscillators
    {
      id: '1',
      name: 'Plaits',
      manufacturer: 'Mutable Instruments',
      type: 'VCO',
      hp: 12,
      power: { positive12V: 60, negative12V: 5 },
      inputs: [
        { id: 'freq', name: 'V/Oct', type: 'CV' },
        { id: 'fm', name: 'FM', type: 'CV' },
        { id: 'timbre', name: 'Timbre', type: 'CV' },
        { id: 'morph', name: 'Morph', type: 'CV' },
        { id: 'harmonics', name: 'Harmonics', type: 'CV' },
        { id: 'trigger', name: 'Trig', type: 'Gate' },
      ],
      outputs: [
        { id: 'out', name: 'Out', type: 'Audio' },
        { id: 'aux', name: 'Aux', type: 'Audio' },
      ],
    },
    // Filter
    {
      id: '2',
      name: 'Ripples',
      manufacturer: 'Mutable Instruments',
      type: 'VCF',
      hp: 8,
      power: { positive12V: 60, negative12V: 5 },
      inputs: [
        { id: 'in', name: 'In', type: 'Audio' },
        { id: 'freq', name: 'Freq', type: 'CV' },
        { id: 'resonance', name: 'Resonance', type: 'CV' },
      ],
      outputs: [
        { id: 'lp', name: 'LP', type: 'Audio' },
        { id: 'bp', name: 'BP', type: 'Audio' },
        { id: 'hp', name: 'HP', type: 'Audio' },
      ],
    },
    // VCA
    {
      id: '3',
      name: 'Veils',
      manufacturer: 'Mutable Instruments',
      type: 'VCA',
      hp: 10,
      power: { positive12V: 70, negative12V: 5 },
      inputs: [
        { id: 'in1', name: 'In 1', type: 'Audio' },
        { id: 'cv1', name: 'CV 1', type: 'CV' },
        { id: 'in2', name: 'In 2', type: 'Audio' },
        { id: 'cv2', name: 'CV 2', type: 'CV' },
      ],
      outputs: [
        { id: 'out1', name: 'Out 1', type: 'Audio' },
        { id: 'out2', name: 'Out 2', type: 'Audio' },
      ],
    },
    // Envelope Generator
    {
      id: '4',
      name: 'Maths',
      manufacturer: 'Make Noise',
      type: 'EG',
      hp: 20,
      power: { positive12V: 60, negative12V: 60 },
      inputs: [
        { id: 'trig1', name: 'Trig 1', type: 'Gate' },
        { id: 'trig4', name: 'Trig 4', type: 'Gate' },
      ],
      outputs: [
        { id: 'ch1', name: 'CH 1', type: 'CV' },
        { id: 'ch4', name: 'CH 4', type: 'CV' },
        { id: 'sum', name: 'Sum', type: 'CV' },
      ],
    },
    // LFO
    {
      id: '5',
      name: 'Batumi',
      manufacturer: 'Xaoc Devices',
      type: 'LFO',
      hp: 10,
      power: { positive12V: 100, negative12V: 10 },
      inputs: [{ id: 'reset', name: 'Reset', type: 'Gate' }],
      outputs: [
        { id: 'lfo1', name: 'LFO 1', type: 'CV' },
        { id: 'lfo2', name: 'LFO 2', type: 'CV' },
        { id: 'lfo3', name: 'LFO 3', type: 'CV' },
        { id: 'lfo4', name: 'LFO 4', type: 'CV' },
      ],
    },
    // Sequencer
    {
      id: '6',
      name: 'Rene 2',
      manufacturer: 'Make Noise',
      type: 'Sequencer',
      hp: 34,
      power: { positive12V: 140, negative12V: 10 },
      inputs: [
        { id: 'clock', name: 'Clock', type: 'Gate' },
        { id: 'reset', name: 'Reset', type: 'Gate' },
      ],
      outputs: [
        { id: 'x', name: 'X', type: 'CV' },
        { id: 'y', name: 'Y', type: 'CV' },
        { id: 'z', name: 'Z', type: 'CV' },
        { id: 'gate', name: 'Gate', type: 'Gate' },
      ],
    },
    // Delay Effect
    {
      id: '7',
      name: 'Magneto',
      manufacturer: 'Qu-Bit',
      type: 'Effect',
      hp: 18,
      power: { positive12V: 250, negative12V: 50 },
      inputs: [
        { id: 'left', name: 'Left', type: 'Audio' },
        { id: 'right', name: 'Right', type: 'Audio' },
        { id: 'time', name: 'Time', type: 'CV' },
        { id: 'feedback', name: 'Feedback', type: 'CV' },
      ],
      outputs: [
        { id: 'left', name: 'Left', type: 'Audio' },
        { id: 'right', name: 'Right', type: 'Audio' },
      ],
    },
    // Mixer
    {
      id: '8',
      name: 'Mixup',
      manufacturer: 'Intellijel',
      type: 'Mixer',
      hp: 6,
      power: { positive12V: 40, negative12V: 40 },
      inputs: [
        { id: 'ch1', name: 'Ch 1', type: 'Audio' },
        { id: 'ch2', name: 'Ch 2', type: 'Audio' },
        { id: 'ch3', name: 'Ch 3', type: 'Audio' },
      ],
      outputs: [{ id: 'mix', name: 'Mix', type: 'Audio' }],
    },
  ],
  rows: [
    {
      rowNumber: 1,
      hp: 104,
      modules: [],
    },
    {
      rowNumber: 2,
      hp: 104,
      modules: [],
    },
  ],
  metadata: {
    rackId: '2383104',
    rackName: 'Demo Rack (Mock Data)',
    author: 'PatchPath AI',
    hp: 208,
    rows: 2,
  },
};

export function getMockRack(): ParsedRack {
  return MOCK_RACK;
}
