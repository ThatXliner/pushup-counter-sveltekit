<script lang="ts">
	import { onMount } from 'svelte';
	import type { PoseDetector } from '@tensorflow-models/pose-detection';

	export let detector: PoseDetector;
	let videoElement: HTMLVideoElement;
	let stream: MediaStream;
	let pushups = 0;
	let isUp = true;
	let log = {};

	const startCamera = async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
			videoElement.srcObject = stream;
			videoElement.addEventListener('play', () => {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d')!;
				const frameRate = 1000 / 30; // Adjust the frame rate as needed

				const captureFrame = () => {
					if (videoElement.paused || videoElement.ended) {
						return;
					}

					context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
					const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

					// Process the frame data here
					detector.estimatePoses(imageData).then((poses) => {
						const keypoints = poses[0].keypoints;
						const left_shoulder = keypoints.find((keypoint) => keypoint.name === 'left_shoulder');
						const right_shoulder = keypoints.find((keypoint) => keypoint.name === 'right_shoulder');
						const left_elbow = keypoints.find((keypoint) => keypoint.name === 'left_elbow');
						const right_elbow = keypoints.find((keypoint) => keypoint.name === 'right_elbow');

						const left_shoulder_to_elbow = Math.round(
							Math.sqrt(
								Math.pow(left_shoulder.x - left_elbow.x, 2) +
									Math.pow(left_shoulder.y - left_elbow.y, 2)
							)
						);
						const right_shoulder_to_elbow = Math.round(
							Math.sqrt(
								Math.pow(right_shoulder.x - right_elbow.x, 2) +
									Math.pow(right_shoulder.y - right_elbow.y, 2)
							)
						);
						log = { left_shoulder_to_elbow, right_shoulder_to_elbow };
						// calibrate these values per person
						if (left_shoulder_to_elbow < 40 && right_shoulder_to_elbow < 40) {
							if (isUp) {
								pushups++;
								isUp = false;
							}
						}
						if (left_shoulder_to_elbow > 50 && right_shoulder_to_elbow > 50) {
							if (!isUp) {
								pushups++;
							}
							isUp = true;
						}
						console.log(left_shoulder_to_elbow, right_shoulder_to_elbow);

						// Draw the poses on the canvas
						// poses.forEach((pose) => {
						// 	pose.keypoints.forEach((keypoint) => {
						// 		const { x, y, name } = keypoint;
						// 		keypointsContext.beginPath();
						// 		keypointsContext.arc(x, y, 5, 0, 2 * Math.PI);
						// 		keypointsContext.fillStyle = 'red';
						// 		keypointsContext.fill();
						// 		keypointsContext.font = '12px Arial';
						// 		keypointsContext.fillText(name, x + 10, y - 10);
						// 	});
						// });
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
<p>{JSON.stringify(log)}</p>
<p>{pushups}</p>
<div>
	<video bind:this={videoElement} autoplay style="transform:scaleX(-1)"></video>
</div>
