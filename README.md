# pushup-counter-sveltekit

A prototype repo. Demo [here](https://thatxliner.github.io/pushup-counter-sveltekit/). Currently implements

- pushup detection

## Roadmap

I know this is a prototype but it's pretty useful as a demo

- Better UI
- More exercises (misnamed as "workouts" in the code... oops)


## Developing

### Setting up

```bash
git clone https://github.com/ThatXliner/pushup-counter-sveltekit.git
cd pushup-counter-sveltekit
npm ci
```

### New workout

Create a new workout named `<workout>.ts` where `<WORKOUT>` is the name of the workout. Make it `export default` a class that `extends Workout` (which is an abstract class in `src/lib/workouts/index.ts`).

Dev server:

```bash
npm run dev
```

#### Run tests

```bash
git lfs pull
tar xzf tests/assets/pushup.tar.gz -C tests/assets
npm test
```

#### Update tests

Update `tests/accuracy_test.ts` with this at the bottom

```diff
+ test('<WORKOUT> model accuracy', async () => {
+ 	await runModel('<WORKOUT>', new <WORKOUT>());
+ });
```

Where `<WORKOUT>` is the name of the workout. Then convert your video of yourself into frames. Create frames with

```bash
ffmpeg -i input.mp4 -r 30 -vf scale="iw/2:ih/2" frame_%04d.jpg
```

INSIDE the directory that stores the frames. Here, 30 is the framerate (and should always be 30 fps). The `-vf scale="iw/2:ih/2"` scales the image to half the size (optional).

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Build runtime

Use Node.js 22.23.4 with npm 10.9.9 for installation, builds, and tests.
The supported Node.js ranges are `^22.23.4 || ^24.22.1 || >=26.12.1`.
Earlier releases, including Node.js 18 and 20, are no longer supported.

Run `nvm use`, `npm ci`, and `npm run build` to build with the pinned runtime.
