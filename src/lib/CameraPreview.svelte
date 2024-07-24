<script lang="ts">
	import { onMount } from 'svelte';
	import type { Pose, PoseDetector } from '@tensorflow-models/pose-detection';

	export let detector: PoseDetector;
	export let onFrame: (poses: Pose[]) => void;
	export const fps: number = 30; // Adjust the frame rate as needed
	const frameRate = 1000 / fps;
	let videoElement: HTMLVideoElement;
	let stream: MediaStream;

	const startCamera = async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
			videoElement.srcObject = stream;
			videoElement.addEventListener('play', () => {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d')!;

				const captureFrame = () => {
					if (videoElement.paused || videoElement.ended) {
						return;
					}

					context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
					const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

					// Process the frame data here
					detector.estimatePoses(imageData).then(onFrame);

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
	<video bind:this={videoElement} autoplay style="transform:scaleX(-1)"></video>
</div>
