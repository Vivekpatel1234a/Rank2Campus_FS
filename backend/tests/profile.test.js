import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProfileCompletion } from '../src/utils/profile.js';
import { isAllocationRoundReady } from '../src/controllers/allocation.controller.js';
import { classifyCutoffMatch } from '../src/controllers/predictor.controller.js';

test('calculateProfileCompletion returns a valid percentage for a mostly complete profile', () => {
  const student = {
    fullName: 'Aarav Sharma',
    dateOfBirth: '2006-05-12',
    gender: 'Male',
    state: 'Maharashtra',
    city: 'Pune',
    category: 'OPEN',
    examName: 'JEE Main',
    rank: 15432,
    score: 246,
    percentile: 96.4,
    interestedBranches: ['CSE', 'ECE'],
    academicInfo: {
      board: 'CBSE',
      schoolName: 'Greenfield Academy',
      class10Percentage: 94,
      class12Percentage: 96.2
    }
  };

  const result = calculateProfileCompletion(student);
  assert.equal(result.profileCompletion, 100);
  assert.equal(result.profileCompleted, true);
});

test('calculateProfileCompletion marks incomplete profiles as not ready', () => {
  const student = {
    fullName: 'Student One',
    dateOfBirth: null,
    gender: 'Other',
    state: '',
    city: '',
    category: 'OPEN',
    examName: '',
    rank: null,
    score: null,
    percentile: null,
    interestedBranches: [],
    academicInfo: {
      board: '',
      schoolName: '',
      class10Percentage: null,
      class12Percentage: null
    }
  };

  const result = calculateProfileCompletion(student);
  assert.ok(result.profileCompletion < 75);
  assert.equal(result.profileCompleted, false);
});

test('isAllocationRoundReady rejects completed rounds and accepts ready open/closed rounds', () => {
  assert.equal(isAllocationRoundReady({ status: 'open' }).valid, true);
  assert.equal(isAllocationRoundReady({ status: 'closed' }).valid, true);
  assert.equal(isAllocationRoundReady({ status: 'allocation_completed' }).valid, false);
  assert.equal(isAllocationRoundReady({ status: 'upcoming' }).valid, false);
});

test('classifyCutoffMatch categorizes rank-to-cutoff ratios consistently', () => {
  assert.deepEqual(classifyCutoffMatch(8000, 10000), { chance: 'Safe', matchScore: 99 });
  assert.deepEqual(classifyCutoffMatch(11000, 10000), { chance: 'Moderate', matchScore: 90 });
  assert.deepEqual(classifyCutoffMatch(12000, 10000), { chance: 'Risky', matchScore: 80 });
});

test('classifyCutoffMatch rejects invalid ranks and cutoffs', () => {
  assert.equal(classifyCutoffMatch(0, 10000), null);
  assert.equal(classifyCutoffMatch(10000, 0), null);
  assert.equal(classifyCutoffMatch('unknown', 10000), null);
});
