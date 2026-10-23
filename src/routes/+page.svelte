<script lang="ts">
	import * as poseDetection from '@tensorflow-models/pose-detection';
	import * as tf from '@tensorflow/tfjs-core';
	// Register one of the TF.js backends.
	import '@tensorflow/tfjs-backend-webgl';
	import CameraPreview from '$lib/CameraPreview.svelte';
	import BicepCurl from '$lib/workouts/BicepCurl';
	import type Workout from '$lib/workouts';
	// import '@tensorflow/tfjs-backend-wasm';

	$effect(() => {
		(async () => {
			await tf.ready();
		})();
	});
	const workout: Workout = $state(new BicepCurl('left'));
	const modelConfig = $derived(workout.getModelConfigurations());
	const detectorPromise = $derived(
		poseDetection.createDetector(modelConfig.type, modelConfig.config)
	);
</script>

{#await detectorPromise}
	<p>loading detector model...</p>
{:then detector}
	<p>loaded</p>
	<CameraPreview {detector} fps={modelConfig.fps} {workout} />
{:catch error}
	<p>{error.message}</p>
{/await}
