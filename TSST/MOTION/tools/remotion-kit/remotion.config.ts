import {Config} from '@remotion/cli/config';

// PNG frames keep flat brand colours and Arabic edges clean; the codec (H.264 / WAV) is set per render.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('angle');
