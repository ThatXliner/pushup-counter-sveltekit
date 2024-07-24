<script lang="ts">
	import { onMount } from 'svelte';
	import {
		calculators,
		type Keypoint,
		type Pose,
		type PoseDetector
	} from '@tensorflow-models/pose-detection';
	import type Workout from './workouts';
	import { normalizePoses } from './workouts';

	export let detector: PoseDetector;
	export let workout: Workout;
	export const fps: number = 30; // Adjust the frame rate as needed
	const frameRate = 1000 / fps; // Adjust the frame rate as needed
	let redDotCanvas: HTMLCanvasElement;
	let videoElement: HTMLVideoElement;
	let stream: MediaStream;
	let workoutMode: number | boolean = false;
	let log = '';

	const startCountdown = () => {
		const countdownInterval = setInterval(() => {
			(workoutMode as number)--;
			if (workoutMode === 0) {
				clearInterval(countdownInterval);
				workoutMode = true;
				workout.recalibrate();
			}
		}, 1000);
	};
	const startCamera = async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
			videoElement.srcObject = stream;
			videoElement.addEventListener('play', () => {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d')!;
				const redDotContext = redDotCanvas.getContext('2d')!;

				const captureFrame = () => {
					if (videoElement.paused || videoElement.ended) {
						return;
					}

					context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
					redDotContext.clearRect(0, 0, redDotCanvas.width, redDotCanvas.height);
					redDotContext.drawImage(canvas, 0, 0, redDotCanvas.width, redDotCanvas.height);
					console.log(redDotCanvas.width, redDotCanvas.height);
					const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

					// Process the frame data here
					detector.estimatePoses(imageData).then((poses: Pose[]) => {
						if (workoutMode === true) {
							log = workout.onFrame(normalizePoses(poses, canvas.height, canvas.width));
						}
						// Overlay the pose keypoints onto the redDotContext
						// biome-ignore lint/complexity/noForEach: <explanation>
						poses.forEach((pose) => {
							// poseDetec.calculators.keypointsToNormalizedKeypoints();
							// biome-ignore lint/complexity/noForEach: <explanation>
							calculators
								.keypointsToNormalizedKeypoints(pose.keypoints, {
									height: canvas.height,
									width: canvas.width
								})
								.forEach((keypoint) => {
									redDotContext.beginPath();
									redDotContext.arc(keypoint.x * 640, keypoint.y * 480, 5, 0, 2 * Math.PI);
									redDotContext.fillStyle = 'red';
									redDotContext.fill();
								});
							// pose.keypoints.forEach((keypoint: Keypoint) => {
							// 	let { x, y } = keypoint;
							// 	// x *= 640 / 350;
							// 	// y *= 480 / 150;
							// 	redDotContext.beginPath();
							// 	redDotContext.arc(x, y, 5, 0, 2 * Math.PI);
							// 	redDotContext.fillStyle = 'red';
							// 	redDotContext.fill();
							// });
						});
					});

					setTimeout(captureFrame, frameRate);
				};

				captureFrame();
			});
		} catch (error) {
			console.error('Error accessing webcam:', error);
		}
	};

	const stopCamera = () => {
		if (stream) {
			const tracks = stream.getTracks();
			// biome-ignore lint/complexity/noForEach: I love functional programming
			tracks.forEach((track) => track.stop());
			videoElement.srcObject = null;
		}
	};

	onMount(() => {
		startCamera();
		return stopCamera;
	});
</script>

<button on:click={startCamera}>Start Camera</button>
<p>{log}</p>
<button
	on:click={() => {
		if (workoutMode === true) {
			workoutMode = false;
		} else if (workoutMode === false) {
			workoutMode = 5;
			startCountdown();
		} else if (typeof workoutMode === 'number') {
			workoutMode = false;
		}
	}}
	>{typeof workoutMode === 'boolean'
		? workoutMode
			? 'Stop workout'
			: 'Start workout'
		: `Workout starting in ${workoutMode} (press to cancel)`}</button
>
<!-- {#if workoutMode === true}
	<button
		on:click={() => {
			workout.recalibrate();
		}}>Recalibrate (press if there's too many frame rejections)</button
	>
{/if} -->

<div>
	<video bind:this={videoElement} autoplay style="transform:scaleX(-1);display:none;"></video>
	<canvas bind:this={redDotCanvas} width="640" height="480" style="transform:scaleX(-1)"></canvas>
</div>
