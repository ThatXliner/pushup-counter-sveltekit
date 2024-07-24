<script lang="ts">
	import { onMount } from 'svelte';
	import {
		calculators,
		type Keypoint,
		type Pose,
		type PoseDetector
	} from '@tensorflow-models/pose-detection';

	export let detector: PoseDetector;
	export let onFrame: (poses: Pose[]) => void;
	export const fps: number = 30; // Adjust the frame rate as needed
	const frameRate = 1000 / fps; // Adjust the frame rate as needed
	let redDotCanvas: HTMLCanvasElement;
	let videoElement: HTMLVideoElement;
	let stream: MediaStream;

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
						onFrame(poses);
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
<div>
	<video bind:this={videoElement} autoplay style="transform:scaleX(-1);display:none;"></video>
	<canvas bind:this={redDotCanvas} width="640" height="480" style="transform:scaleX(-1)"></canvas>
</div>
