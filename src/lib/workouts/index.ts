import type { Pose } from '@tensorflow-models/pose-detection';
export default interface Workout {
	onFrame(poses: Pose[]): string;
}
