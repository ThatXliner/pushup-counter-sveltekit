import type Workout from '$lib/workouts';
import { expect, test } from 'bun:test';
import { Glob } from 'bun';
import Pushup from '$lib/workouts/pushup';
import { readdir } from 'node:fs/promises';
import tfnode from '@tensorflow/tfjs-node';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

async function runModel(workout: string, model: Workout) {
	console.log('Creating pose estimator');
	await tf.ready();
	const modelConfig = model.getModelConfigurations();
	const detector = await poseDetection.createDetector(modelConfig.type, modelConfig.config);
	for (const folder of await readdir(`tests/assets/${workout}`)) {
		const glob = new Glob(`tests/assets/${workout}/${folder}/frame_*.png`);
		console.log('Reading frames');
		const frames = await Promise.all(
			[...glob.scanSync()]
				.sort((a, b) => {
					// Sort numerically by frame number
					const aNum = Number.parseInt(a.split('_')[1].split('.')[0]);
					const bNum = Number.parseInt(b.split('_')[1].split('.')[0]);
					return aNum - bNum;
				})
				.map((fileName) => {
					const file = Bun.file(fileName);
					// @types/bun does not yet know about the new API
					return file.bytes() as Promise<Uint8Array>;
				})
		);
		console.log('Running model');
		let index = 0;
		// I had issues when trying to run this in parallel
		for (const frame of frames) {
			const image = tfnode.node.decodeImage(frame) as tf.Tensor3D;
			const pose = await detector.estimatePoses(image, {}, index++ * (1 / 60) * 1000);
			model.onFrame(pose);
			// console.log(index, model.getDetectionCount());
		}
		expect(model.getDetectionCount()).toBe(Number.parseInt(folder));
		// console.log(frames[0]);
	}
	// const glob = new Glob(`./assets/${workout}/[0-9]+`);
	// console.log([...glob.scanSync()], `./assets/${workout}/[0-9]+/`);
	// const frames = [...glob.scanSync()].sort(
	// 	// sort by frame number
	// 	(a, b) => {
	// 		console.log(a, b);
	// 		const aNum = Number.parseInt(a.split('.')[0]);
	// 		const bNum = Number.parseInt(b.split('.')[0]);
	// 		return aNum - bNum;
	// 	}
	// );
	// console.log(frames, model);
}
test(
	'Pushup model accuracy',
	async () => {
		await runModel('pushup', new Pushup());
		expect(2 + 2).toBe(4);
	},
	1000 * 60 // 1 minute timeout
);
