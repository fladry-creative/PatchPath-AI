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
        { name: 'V/Oct', type: 'cv' },
        { name: 'FM', type: 'cv' },
        { name: 'Timbre', type: 'cv' },
        { name: 'Morph', type: 'cv' },
        { name: 'Harmonics', type: 'cv' },
        { name: 'Trig', type: 'gate' },
      ],
      outputs: [
        { name: 'Out', type: 'audio' },
        { name: 'Aux', type: 'audio' },
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
        { name: 'In', type: 'audio' },
        { name: 'Freq', type: 'cv' },
        { name: 'Resonance', type: 'cv' },
      ],
      outputs: [
        { name: 'LP', type: 'audio' },
        { name: 'BP', type: 'audio' },
        { name: 'HP', type: 'audio' },
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
        { name: 'In 1', type: 'audio' },
        { name: 'CV 1', type: 'cv' },
        { name: 'In 2', type: 'audio' },
        { name: 'CV 2', type: 'cv' },
      ],
      outputs: [
        { name: 'Out 1', type: 'audio' },
        { name: 'Out 2', type: 'audio' },
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
        { name: 'Trig 1', type: 'gate' },
        { name: 'Trig 4', type: 'gate' },
      ],
      outputs: [
        { name: 'CH 1', type: 'cv' },
        { name: 'CH 4', type: 'cv' },
        { name: 'Sum', type: 'cv' },
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
      inputs: [{ name: 'Reset', type: 'gate' }],
      outputs: [
        { name: 'LFO 1', type: 'cv' },
        { name: 'LFO 2', type: 'cv' },
        { name: 'LFO 3', type: 'cv' },
        { name: 'LFO 4', type: 'cv' },
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
        { name: 'Clock', type: 'gate' },
        { name: 'Reset', type: 'gate' },
      ],
      outputs: [
        { name: 'X', type: 'cv' },
        { name: 'Y', type: 'cv' },
        { name: 'Z', type: 'cv' },
        { name: 'Gate', type: 'gate' },
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
        { name: 'Left', type: 'audio' },
        { name: 'Right', type: 'audio' },
        { name: 'Time', type: 'cv' },
        { name: 'Feedback', type: 'cv' },
      ],
      outputs: [
        { name: 'Left', type: 'audio' },
        { name: 'Right', type: 'audio' },
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
        { name: 'Ch 1', type: 'audio' },
        { name: 'Ch 2', type: 'audio' },
        { name: 'Ch 3', type: 'audio' },
      ],
      outputs: [{ name: 'Mix', type: 'audio' }],
    },
  ],
  rows: [
    {
      rowNumber: 1,
      totalHP: 0,
      maxHP: 104,
      modules: [],
    },
    {
      rowNumber: 2,
      totalHP: 0,
      maxHP: 104,
      modules: [],
    },
  ],
  metadata: {
    rackId: '2383104',
    rackName: 'Demo Rack (Mock Data)',
    userName: 'PatchPath AI',
  },
};

export function getMockRack(): ParsedRack {
  return MOCK_RACK;
}
