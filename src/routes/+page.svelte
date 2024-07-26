<script lang="ts">
	import * as poseDetection from '@tensorflow-models/pose-detection';
	import * as tf from '@tensorflow/tfjs-core';
	// Register one of the TF.js backends.
	import '@tensorflow/tfjs-backend-webgl';
	import CameraPreview from '$lib/CameraPreview.svelte';
	import Pushup from '$lib/workouts/Pushup';
	import JumpingJack from '$lib/workouts/JumpingJack';
	import type Workout from '$lib/workouts';
	// import '@tensorflow/tfjs-backend-wasm';

	$effect(() => {
		(async () => {
			await tf.ready();
		})();
	});
	const pushupWorkout: Workout = $state(new Pushup());
	const jumpingJackWorkout: Workout = $state(new JumpingJack());
	const pushupModelConfig = $derived(pushupWorkout.getModelConfigurations());
	const jumpingJackModelConfig = $derived(jumpingJackWorkout.getModelConfigurations());
	const pushupDetectorPromise = $derived(
		poseDetection.createDetector(pushupModelConfig.type, pushupModelConfig.config)
	);
	const jumpingJackDetectorPromise = $derived(
		poseDetection.createDetector(jumpingJackModelConfig.type, jumpingJackModelConfig.config)
	);
</script>

{#await pushupDetectorPromise}
	<p>loading pushup detector model...</p>
{:then pushupDetector}
	<p>loaded pushup detector model</p>
	<CameraPreview {pushupDetector} fps={pushupModelConfig.fps} {workout}={pushupWorkout} />
{:catch error}
	<p>{error.message}</p>
{/await}

{#await jumpingJackDetectorPromise}
	<p>loading jumping jack detector model...</p>
{:then jumpingJackDetector}
	<p>loaded jumping jack detector model</p>
	<CameraPreview {jumpingJackDetector} fps={jumpingJackModelConfig.fps} {workout}={jumpingJackWorkout} />
{:catch error}
	<p>{error.message}</p>
{/await}
