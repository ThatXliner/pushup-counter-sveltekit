<script lang="ts">
	import * as poseDetection from '@tensorflow-models/pose-detection';
	import * as tf from '@tensorflow/tfjs-core';
	// Register one of the TF.js backends.
	import '@tensorflow/tfjs-backend-webgl';
	import CameraPreview from '$lib/CameraPreview.svelte';
	// import '@tensorflow/tfjs-backend-wasm';

	$effect(() => {
		(async () => {
			await tf.ready();
		})();
	});
	const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
	const detectorPromise = poseDetection.createDetector(
		poseDetection.SupportedModels.MoveNet,
		detectorConfig
	);
</script>

{#await detectorPromise}
	<p>loading detector model...</p>
{:then detector}
	<p>loaded</p>

	<CameraPreview {detector} />
{:catch error}
	<p>{error.message}</p>
{/await}
