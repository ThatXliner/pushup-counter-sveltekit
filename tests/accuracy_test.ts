import type Workout from '$lib/workouts';
import { expect, test } from 'bun:test';
async function runModel(model: Workout) {}
test('Pushup model accuracy', async () => {
	expect(2 + 2).toBe(4);
});
