import type Workout from '$lib/workouts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Pushup from '$lib/workouts/pushup';
import { readdir, readFile, stat } from 'node:fs/promises';
import tfnode from '@tensorflow/tfjs-node';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { normalizePoses } from '$lib/workouts';

async function runModel(workout: string, model: Workout) {
	console.log('Creating pose estimator');
	await tf.ready();
	const modelConfig = model.getModelConfigurations();
	const detector = await poseDetection.createDetector(modelConfig.type, modelConfig.config);
	for (const folder of await readdir(`tests/assets/${workout}`)) {
		if (!(await stat(`tests/assets/${workout}/${folder}`)).isDirectory()) continue;
		const frameDirectory = `tests/assets/${workout}/${folder}`;
		const frameNames = (await readdir(frameDirectory)).filter((name) =>
			/^frame_.*\.(png|jpg)$/.test(name)
		);
		assert.ok(frameNames.length > 0, `No frames found in ${frameDirectory}`);
		console.log('Reading frames');
		const frames = await Promise.all(
			frameNames
				.sort((a, b) => {
					// Sort numerically by frame number
					const aNum = Number.parseInt(a.split('_')[1].split('.')[0]);
					const bNum = Number.parseInt(b.split('_')[1].split('.')[0]);
					return aNum - bNum;
				})
				.map((fileName) => readFile(`${frameDirectory}/${fileName}`))
		);
		console.log('Running model');
		let index = 0;
		model.recalibrate();
		// I had issues when trying to run this in parallel
		for (const frame of frames) {
			const image = tfnode.node.decodeImage(frame) as tf.Tensor3D;
			const height = image.shape[0];
			const width = image.shape[1];
			const poses = await detector.estimatePoses(image, {}, index++ * (1 / 30) * 1000);
			model.onFrame(normalizePoses(poses, height, width));
		}
		assert.equal(model.getDetectionCount(), Number.parseInt(folder));
	}
}
test(
	'Pushup model accuracy',
	{ timeout: 60 * 1000 },
	async () => {
		await runModel('pushup', new Pushup());
	}
);
