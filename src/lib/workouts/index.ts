import {
	SupportedModels,
	type BlazePoseTfjsModelConfig,
	type MoveNetModelConfig,
	type Pose
} from '@tensorflow-models/pose-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type ModelConfigurations = {
	type: SupportedModels;
	config: BlazePoseTfjsModelConfig | MoveNetModelConfig;
	fps: number;
};
export const DEFAULT_BLAZEPOSE_CONFIG = {
	type: SupportedModels.BlazePose,
	config: {
		runtime: 'tfjs',
		enableSmoothing: true,
		modelType: 'full'
	},
	fps: 15
};
export const DEFAULT_MOVENET_CONFIG = {
	type: SupportedModels.MoveNet,
	config: { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
	fps: 30
};
export default abstract class Workout {
	getModelConfigurations(): ModelConfigurations {
		return DEFAULT_MOVENET_CONFIG;
	}
	abstract getDetectionCount(): number;
	abstract onFrame(poses: Pose[]): string;
	abstract recalibrate(): void;
}
export function normalizePoses(poses: Pose[], height: number, width: number): Pose[] {
	if (poses.length === 0) {
		return [];
	} else {
		return [
			{
				...poses[0],
				keypoints: poseDetection.calculators.keypointsToNormalizedKeypoints(poses[0].keypoints, {
					height,
					width
				})
			}
		];
	}
}
