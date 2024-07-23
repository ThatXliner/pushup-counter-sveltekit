<script lang="ts">
	import * as poseDetection from '@tensorflow-models/pose-detection';
	import * as tf from '@tensorflow/tfjs-core';
	// Register one of the TF.js backends.
	import '@tensorflow/tfjs-backend-webgl';
	import CameraPreview from '$lib/CameraPreview.svelte';
	import Pushup from '$lib/workouts/pushup';
	import type Workout from '$lib/workouts';
	// import '@tensorflow/tfjs-backend-wasm';

	$effect(() => {
		(async () => {
			await tf.ready();
		})();
	});
	const workout: Workout = $state(new Pushup());
	const modelConfig = $derived(workout.getModelConfigurations());
	const detectorPromise = $derived(
		poseDetection.createDetector(modelConfig.type, modelConfig.config)
	);
	let log = $state('');
</script>

{#await detectorPromise}
	<p>loading detector model...</p>
{:then detector}
	<p>loaded</p>
	<p>{log}</p>
	<CameraPreview
		{detector}
		fps={modelConfig.fps}
		onFrame={(poses) => {
			log = workout.onFrame(poses);
		}}
	/>
{:catch error}
	<p>{error.message}</p>
{/await}
